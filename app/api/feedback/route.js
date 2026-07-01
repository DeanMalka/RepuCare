import { admin } from '../../../lib/supabase';
import { resolveRatingTarget } from '../../../lib/ratingTarget';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { token, rating, body, survey } = await req.json();
  if (!token) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const supa = admin();
  const t = await resolveRatingTarget(supa, token);
  if (!t) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let cust = null;
  const cm = (req.headers.get('cookie') || '').match(/(?:^|;\s*)rc_cust=([^;]+)/);
  const custId = cm ? decodeURIComponent(cm[1]) : null;
  if (custId && /^[0-9a-f-]{36}$/i.test(custId)) {
    const { data } = await supa.from('customers').select('id,name,phone').eq('id', custId).eq('business_id', t.businessId).maybeSingle();
    if (data) cust = data;
  }

  const s = survey || {};
  const c = (v) => { const n = parseInt(v, 10); return n >= 1 && n <= 5 ? n : null; };

  await supa.from('feedback').insert({
    business_id: t.businessId,
    branch_id: t.branchId,
    rating: rating || null,
    body: body || '',
    status: 'new',
    q_service: c(s.service),
    q_staff: c(s.staff),
    q_value: c(s.value),
    q_timeliness: c(s.timeliness),
    customer_id: cust ? cust.id : null,
    customer_name: cust ? cust.name : null,
    customer_phone: cust ? cust.phone : null,
  });
  await supa.from('events_log').insert({ business_id: t.businessId, branch_id: t.branchId, type: 'feedback', meta: { rating, survey: s } });

  return NextResponse.json({ ok: true, redirect: rating >= 4 ? (t.google || null) : null });
}
