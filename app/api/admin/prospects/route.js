import { serverClient } from '../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ADMIN = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// ICP segmentation by Google rating + review volume (matches the prospect CSV scheme).
function segment(rating, count) {
  if (rating == null || !count) return 'מעט/ללא ביקורות (פוטנציאל)';
  if (rating < 3.6) return 'דירוג נמוך (כאב)';
  if (rating <= 4.4) return 'ליבה ICP (3.8–4.4)';
  return 'דירוג גבוה (עדיפות נמוכה)';
}

async function textSearch(q, key) {
  const u = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&region=il&language=he&key=${key}`;
  try { const r = await fetch(u); const j = await r.json(); return Array.isArray(j.results) ? j.results : []; }
  catch (e) { return []; }
}
async function details(pid, key) {
  const u = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pid}&fields=name,formatted_phone_number,rating,user_ratings_total,website&language=he&key=${key}`;
  try { const r = await fetch(u); const j = await r.json(); return j.result || {}; }
  catch (e) { return {}; }
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  const isAdmin = !!user && ADMIN.includes((user.email || '').toLowerCase());
  const SECRET = process.env.PROSPECTS_SECRET || process.env.WHATSAPP_VERIFY_TOKEN || '';
  const okSecret = !!SECRET && body.secret === SECRET;
  if (!isAdmin && !okSecret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ error: 'no_places_key' }, { status: 500 });
  const cats = Array.isArray(body.categories) ? body.categories : [];      // [{label, keyword}]
  const cities = Array.isArray(body.cities) ? body.cities : [];
  const perCity = Math.min(Number(body.perCity) || 8, 20);
  if (!cats.length || !cities.length) return NextResponse.json({ error: 'need categories+cities' }, { status: 400 });

  const rows = []; const seen = new Set();
  for (const c of cats) {
    for (const city of cities) {
      const results = await textSearch(`${c.keyword} ${city}`, key);
      const slice = results.slice(0, perCity).filter(r => r.place_id && !seen.has(r.place_id));
      slice.forEach(r => seen.add(r.place_id));
      const ds = await Promise.all(slice.map(r => details(r.place_id, key)));
      slice.forEach((r, i) => {
        const d = ds[i] || {};
        const rating = d.rating != null ? d.rating : (r.rating != null ? r.rating : null);
        const count = d.user_ratings_total != null ? d.user_ratings_total : (r.user_ratings_total != null ? r.user_ratings_total : null);
        rows.push({
          type: c.label, city, name: d.name || r.name || '',
          rating, reviews: count, phone: d.formatted_phone_number || '',
          website: d.website || '', segment: segment(rating, count),
        });
      });
    }
  }
  return NextResponse.json({ ok: true, count: rows.length, rows });
}
