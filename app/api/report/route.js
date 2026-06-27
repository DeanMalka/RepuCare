import { NextResponse } from 'next/server';
import { admin } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Look up a business on Google via Places API (New) Text Search.
async function fetchPlace(query) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { error: 'no_key' };
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.googleMapsUri',
      },
      body: JSON.stringify({ textQuery: query, languageCode: 'he', regionCode: 'IL' }),
    });
    const data = await res.json();
    if (!res.ok) return { error: 'api_error', detail: data };
    const p = data.places && data.places[0];
    if (!p) return { error: 'not_found' };
    return {
      placeId: p.id || null,
      name: (p.displayName && p.displayName.text) || query,
      rating: typeof p.rating === 'number' ? p.rating : null,
      reviews: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
      address: p.formattedAddress || null,
      mapsUri: p.googleMapsUri || null,
    };
  } catch (e) {
    return { error: 'fetch_failed', detail: String(e) };
  }
}

// Build a benchmark + opportunity report (not just raw numbers).
function buildReport({ name, rating, reviews, address }) {
  const r = typeof rating === 'number' ? rating : null;
  const n = typeof reviews === 'number' ? reviews : null;
  const target = n != null ? Math.max(150, Math.ceil((n * 4) / 50) * 50) : 150;
  const projection = n != null ? Math.min(target, n + Math.round((target - n) * 0.6)) : null;
  const ratingGood = r != null ? r >= 4.2 : null;

  const sections = [];
  sections.push({
    type: 'stats',
    title: 'המצב שלך היום בגוגל',
    stats: [
      { label: 'דירוג ממוצע', value: r != null ? '★ ' + r : '—' },
      { label: 'מספר ביקורות', value: n != null ? String(n) : '—' },
    ],
  });

  if (ratingGood) {
    sections.push({
      title: 'מה טוב',
      body: 'הדירוג שלך (' + r + ') מצוין — סימן שהשירות באמת טוב. הלקוחות שכותבים, מרוצים.',
    });
  } else if (r != null) {
    sections.push({
      title: 'נקודת תשומת לב',
      body:
        'הדירוג שלך (' + r + ') משאיר מקום לשיפור. הצעד הראשון: לתפוס פידבק מלקוחות לא מרוצים בפרטי — לפני שזה מגיע לגוגל.',
    });
  }

  if (n != null) {
    sections.push({
      title: 'איפה אתה מפסיד',
      body:
        'הבעיה היא לא הדירוג — היא הכמות. ' + n + ' ביקורות זה מעט לעסק ברמה כזו. ' +
        'מוביל בקטגוריה באזור שלך מציג בדרך כלל ' + target + '+ ביקורות. כשלקוח מחפש בגוגל, מי שיש לו יותר ביקורות ' +
        'עולה גבוה יותר ונראה אמין יותר — גם בדירוג זהה. כל לקוח מרוצה שיוצא בלי ביקורת = חשיפה ואמון שאבדו.',
    });
    sections.push({
      title: 'התחזית עם RepuCare',
      body:
        'אם רק 30% מהלקוחות המרוצים ישאירו ביקורת, אתה עובר מ-' + n + ' ל-' + projection + '+ ביקורות תוך כמה חודשים — ' +
        'בלי מאמץ. אחרי כל ביקור נשלחת בקשה אוטומטית; מרוצים מופנים לגוגל, ולא-מרוצים מופנים אליך בפרטי.',
    });
  } else {
    sections.push({
      title: 'ההזדמנות',
      body:
        'רוב הלקוחות המרוצים לא משאירים ביקורת — פשוט כי לא מבקשים מהם ברגע הנכון. RepuCare מבקש אוטומטית אחרי כל ' +
        'ביקור, מפנה מרוצים לגוגל, ומעלה בהדרגה את כמות הביקורות והדירוג שלך.',
    });
  }

  sections.push({
    type: 'list',
    title: '3 צעדים מהירים (חינם, עכשיו)',
    items: [
      'הגב לכל ביקורת קיימת בגוגל — גם תודה קצרה. גוגל נותן עדיפות לעסקים שמגיבים.',
      'בקש ביקורת מכל לקוח מרוצה החודש.',
      'הוסף 5–10 תמונות חדשות לפרופיל הגוגל שלך.',
    ],
  });

  return {
    businessName: name,
    address: address || null,
    matched: r != null || n != null,
    generatedAt: new Date().toISOString(),
    sections,
  };
}

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch (e) { body = {}; }

  const businessName = String(body.clinic || body.business_name || '').trim();
  const contactName = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const googleUrl = String(body.google || '').trim();

  if (!businessName) {
    return NextResponse.json({ ok: false, error: 'missing_business' }, { status: 400 });
  }

  const place = await fetchPlace(businessName);
  const matched = place && !place.error;
  const rating = matched ? place.rating : null;
  const reviews = matched ? place.reviews : null;
  const report = buildReport({
    name: (matched && place.name) || businessName,
    rating,
    reviews,
    address: matched ? place.address : null,
  });

  // Save the lead (best-effort — never fail the customer's report on a DB hiccup).
  try {
    const db = admin();
    await db.from('leads').insert({
      business_name: businessName,
      contact_name: contactName || null,
      contact_phone: phone || null,
      google_url: googleUrl || null,
      google_place_id: matched ? place.placeId : null,
      google_rating: rating,
      google_reviews_count: reviews,
      report,
      source: 'landing',
    });
  } catch (e) {
    // swallow — report is already built for the customer
  }

  return NextResponse.json({ ok: true, report, _diag: matched ? { matched: true } : { matched: false, place } });
}
