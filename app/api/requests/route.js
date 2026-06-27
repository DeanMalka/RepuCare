import { serverClient } from '../../../lib/supabaseServer';
import { admin } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const { data: biz } = await supa.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'no business' }, { status: 400 });

  const b = await req.json();
  const contact = (b.contact || '').trim();
  const a = admin();

  // Returning-customer detection (by phone/contact, per business)
  let returning = false, visitCount = 1, alreadyReviewed = false;
  if (contact) {
    const { data: existing } = await a.from('customers')
      .select('id,visit_count,has_reviewed,name')
      .eq('business_id', biz.id).eq('phone', contact).maybeSingle();
    if (existing) {
      returning = true;
      visitCount = (existing.visit_count || 1) + 1;
      alreadyReviewed = !!existing.has_reviewed;
      await a.from('customers').update({
        visit_count: visitCount,
        last_seen: new Date().toISOString(),
        name: b.name || existing.name,
      }).eq('id', existing.id);
    } else {
      await a.from('customers').insert({ business_id: biz.id, phone: contact, name: b.name || null });
    }
  }

  const { error } = await supa.from('review_requests').insert({
    business_id: biz.id, customer_name: b.name || null, contact: contact || null,
    channel: b.channel || 'sms', status: 'sent',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // TODO phase 2: actually send via Resend/Twilio (with consent / 30א compliance).
  // returning -> "תודה שבחרת בנו שוב" template; new -> review request.
  return NextResponse.json({ ok: true, returning, visitCount, alreadyReviewed });
}
