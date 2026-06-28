import { admin } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — Meta webhook verification handshake (done once when you set the callback URL).
export async function GET(req) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && expected && token === expected) {
    return new Response(challenge || '', { status: 200 });
  }
  return new Response('forbidden', { status: 403 });
}

// Optional payload authenticity check — enforced only once WHATSAPP_APP_SECRET is set.
function verifySignature(raw, header) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!header) return false;
  try {
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
    const a = Buffer.from(expected), b = Buffer.from(header);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { return false; }
}

// Customer reply that means "stop messaging me" (Hebrew + English).
const STOP_RE = /(^|\s)(הסר|הסירו|הסירי|להסיר|תסיר|תסירו|בטל|ביטול|stop|unsubscribe|cancel)(\s|$)/i;

export async function POST(req) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get('x-hub-signature-256'))) {
    return new Response('bad signature', { status: 401 });
  }
  let body;
  try { body = JSON.parse(raw); } catch (e) { return NextResponse.json({ ok: true }); }
  const a = admin();
  try {
    for (const e of (body.entry || [])) {
      for (const ch of (e.changes || [])) {
        const v = ch.value || {};
        // Delivery / read / failure receipts -> update the request row by message id.
        for (const st of (v.statuses || [])) {
          if (!st.id || !st.status) continue;
          const patch = { status: st.status };
          if (st.status === 'failed') {
            const err = (st.errors && st.errors[0] && (st.errors[0].title || st.errors[0].message)) || 'failed';
            patch.error = String(err).slice(0, 300);
          }
          await a.from('review_requests').update(patch).eq('provider_msg_id', st.id);
        }
        // Inbound message -> if it's a STOP word, suppress that phone everywhere on our sender.
        for (const m of (v.messages || [])) {
          const from = m.from;
          const text = (m.text && m.text.body) || '';
          if (from && STOP_RE.test(text)) {
            const phone = '+' + String(from).replace(/[^\d]/g, '');
            await a.from('customers').update({ do_not_contact: true }).eq('phone', phone);
          }
        }
      }
    }
  } catch (e) { /* always 200 so Meta doesn't retry-storm */ }
  return NextResponse.json({ ok: true });
}
