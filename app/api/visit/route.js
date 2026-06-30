import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

// Per-customer entry point: stamps a short-lived cookie identifying the customer,
// then redirects to the public rating page. Lets private feedback be attributed
// back to the specific customer the owner messaged (so they can follow up).
export async function GET(req) {
  const url = new URL(req.url);
  const c = (url.searchParams.get('c') || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
  const t = (url.searchParams.get('t') || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 60);
  const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const res = NextResponse.redirect(base + '/r/' + t, 302);
  if (c) res.cookies.set('rc_cust', c, { path: '/', maxAge: 1800, sameSite: 'lax' });
  return res;
}
