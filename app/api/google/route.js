import { serverClient } from '../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = process.env.GOOGLE_PLACES_API_KEY;

// Find the business on Google (Places API New) by free-text query.
async function textSearch(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'he', regionCode: 'IL' }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  return (data.places && data.places[0]) || null;
}

// Pull full place details incl. up to 5 reviews (Places API New).
async function placeDetails(placeId) {
  const res = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId) + '?languageCode=he&regionCode=IL', {
    headers: {
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,googleMapsUri,reviews',
    },
  });
  const data = await res.json();
  if (!res.ok) return { error: 'api_error', detail: data };
  return data;
}

// Read-only: refresh the owner's Google rating + reviews cache on the business row.
export async function POST(req) {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  if (!KEY) return NextResponse.json({ ok: false, error: 'no_key' }, { status: 200 });

  const { data: biz } = await supa.from('businesses').select('id, name, city, google_place_id').eq('owner_id', user.id).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'no business' }, { status: 400 });

  let placeId = (biz.google_place_id || '').trim();
  if (!placeId) {
    const q = [biz.name, biz.city].filter(Boolean).join(' ');
    if (!q) return NextResponse.json({ ok: false, error: 'no_query' }, { status: 200 });
    const p = await textSearch(q);
    if (!p || !p.id) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 200 });
    placeId = p.id;
  }

  const d = await placeDetails(placeId);
  if (!d || d.error) return NextResponse.json({ ok: false, error: 'details_failed' }, { status: 200 });

  const rating = typeof d.rating === 'number' ? d.rating : null;
  const count = typeof d.userRatingCount === 'number' ? d.userRatingCount : null;
  const reviews = (d.reviews || []).slice(0, 5).map(r => ({
    author: (r.authorAttribution && r.authorAttribution.displayName) || null,
    rating: typeof r.rating === 'number' ? r.rating : null,
    date: r.relativePublishTimeDescription || (r.publishTime ? String(r.publishTime).slice(0, 10) : null),
    body: String((r.text && r.text.text) || (r.originalText && r.originalText.text) || '').slice(0, 600),
  }));

  await supa.from('businesses').update({
    google_place_id: placeId,
    google_rating: rating,
    google_reviews_count: count,
    google_reviews: reviews,
    google_fetched_at: new Date().toISOString(),
  }).eq('owner_id', user.id);

  return NextResponse.json({ ok: true, rating, count, reviews });
}
