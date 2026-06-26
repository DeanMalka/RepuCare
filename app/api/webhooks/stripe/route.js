import { stripe } from '../../../../lib/stripe';
import { admin } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';
export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event;
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return new NextResponse('bad signature', { status: 400 }); }
  const a = admin();
  const obj = event.data.object;
  async function save(sub, businessId) {
    if (!businessId) return;
    await a.from('subscriptions').upsert({
      business_id: businessId,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      status: sub.status,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'business_id' });
  }
  if (event.type === 'checkout.session.completed' && obj.subscription) {
    const sub = await stripe.subscriptions.retrieve(obj.subscription);
    await save(sub, obj.metadata?.business_id || sub.metadata?.business_id);
  } else if (event.type.startsWith('customer.subscription.')) {
    await save(obj, obj.metadata?.business_id);
  }
  return NextResponse.json({ received: true });
}
