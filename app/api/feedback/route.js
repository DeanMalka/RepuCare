import { admin } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { token, rating, body, survey } = await req.json();
  if (!token) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const supa = admin();
  const { data: biz } = await supa.from('businesses').select('id,google_review_url').eq('rating_token', token).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const s = survey || {};
  const c = (v) => { const n = parseInt(v, 10); return n >= 1 && n <= 5 ? n : null; };

  await supa.from('feedback').insert({
    business_id: biz.id,
    rating: rating || null,
    body: body || '',
    status: 'new',
    q_service: c(s.service),
    q_staff: c(s.staff),
    q_value: c(s.value),
    q_timeliness: c(s.timeliness),
  });
  await supa.from('events_log').insert({ business_id: biz.id, type: 'feedback', meta: { rating, survey: s } });

  // Happy customers (4-5) get sent to Google after the survey.
  return NextResponse.json({ ok: true, redirect: rating >= 4 ? (biz.google_review_url || null) : null });
}
