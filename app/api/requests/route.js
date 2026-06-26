import { serverClient } from '../../../lib/supabaseServer';
import { NextResponse } from 'next/server';
export async function POST(req) {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const { data: biz } = await supa.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'no business' }, { status: 400 });
  const b = await req.json();
  const { error } = await supa.from('review_requests').insert({ business_id: biz.id, customer_name: b.name || null, contact: b.contact || null, channel: b.channel || 'sms', status: 'sent' });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // TODO phase 2: actually send via Resend/Twilio (with consent / 30א compliance)
  return NextResponse.json({ ok: true });
}
