import { serverClient } from '../../../lib/supabaseServer';
import { stripe } from '../../../lib/stripe';
import { NextResponse } from 'next/server';
export async function POST() {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const { data: biz } = await supa.from('businesses').select('id,name').eq('owner_id', user.id).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'no business' }, { status: 400 });
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: { trial_period_days: 45, metadata: { business_id: biz.id } },
      success_url: base + '/dashboard?paid=1',
      cancel_url: base + '/dashboard',
      customer_email: user.email,
      metadata: { business_id: biz.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
