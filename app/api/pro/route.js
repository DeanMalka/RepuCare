import { serverClient } from '../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Parse a pro.co.il (המקצוענים) business profile from its JSON-LD (schema.org LocalBusiness).
function parseProProfile(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  for (const raw of blocks) {
    let data;
    try { data = JSON.parse(raw); } catch (e) { continue; }
    const graph = data['@graph'] || (Array.isArray(data) ? data : [data]);
    const lb = graph.find(x => {
      const t = x && x['@type'];
      return t && (Array.isArray(t) ? t.includes('LocalBusiness') : String(t).includes('LocalBusiness'));
    });
    if (!lb) continue;
    const ar = lb.aggregateRating || {};
    const rating = ar.ratingValue != null ? Number(ar.ratingValue) : null;
    const count = ar.reviewCount != null ? Number(ar.reviewCount) : null;
    const reviews = (lb.review || []).slice(0, 8).map(r => ({
      author: (r.author && (r.author.name || (typeof r.author === 'string' ? r.author : null))) || null,
      rating: r.reviewRating && r.reviewRating.ratingValue != null ? Number(r.reviewRating.ratingValue) : null,
      date: r.datePublished || null,
      body: String(r.reviewBody || r.description || '').slice(0, 500),
    }));
    return { name: lb.name || null, rating, count, reviews };
  }
  return null;
}

// Pulls the owner's pro.co.il profile (read-only) and caches rating + reviews on the business row.
export async function POST(req) {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const { data: biz } = await supa.from('businesses').select('id, pro_url, pro_consent').eq('owner_id', user.id).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'no business' }, { status: 400 });

  const url = (biz.pro_url || '').trim();
  if (!url) return NextResponse.json({ ok: false, error: 'no_url' }, { status: 200 });
  if (!biz.pro_consent) return NextResponse.json({ ok: false, error: 'no_consent' }, { status: 200 });

  // Safety: only fetch pro.co.il URLs.
  let host = '';
  try { host = new URL(url).hostname; } catch (e) {}
  if (!/(^|\.)pro\.co\.il$/.test(host)) return NextResponse.json({ ok: false, error: 'bad_url' }, { status: 200 });

  let html = '';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: 'fetch_failed', status: res.status }, { status: 200 });
    html = await res.text();
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'fetch_error' }, { status: 200 });
  }

  const parsed = parseProProfile(html);
  if (!parsed) return NextResponse.json({ ok: false, error: 'parse_failed' }, { status: 200 });

  await supa.from('businesses').update({
    pro_rating: parsed.rating,
    pro_reviews_count: parsed.count,
    pro_reviews: parsed.reviews,
    pro_fetched_at: new Date().toISOString(),
  }).eq('owner_id', user.id);

  return NextResponse.json({ ok: true, rating: parsed.rating, count: parsed.count, reviews: parsed.reviews });
}
