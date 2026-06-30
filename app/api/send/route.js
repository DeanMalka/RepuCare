import { serverClient } from '../../../lib/supabaseServer';
import { rateLimit, clientIp } from '../../../lib/ratelimit';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Pick the WhatsApp sender for a business.
// A (default): shared RepuCare WABA from env. B (future): the business's own WABA.
function resolveSender(biz) {
  if (biz.sender_mode === 'own' && biz.waba_phone_id && process.env.WHATSAPP_OWN_TOKENS) {
    return null; // B — per-business sender; activated when the premium add-on ships.
  }
  const phoneId = process.env.WHATSAPP_SHARED_PHONE_ID;
  const token = process.env.WHATSAPP_SHARED_TOKEN;
  if (!phoneId || !token) return null; // not configured yet -> requests just queue
  return {
    phoneId, token,
    template: process.env.WHATSAPP_TEMPLATE_NAME || 'review_request',
    lang: process.env.WHATSAPP_TEMPLATE_LANG || 'he',
  };
}

// Send one WhatsApp template message via Cloud API. Returns {id} or {error}.
// Template body has 3 variables: {{1}} customer name, {{2}} business name, {{3}} review link.
async function sendWhatsApp(sender, toE164, name, bizName, link) {
  const to = toE164.replace(/^\+/, '');
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${sender.phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + sender.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: sender.template,
          language: { code: sender.lang },
          components: [{ type: 'body', parameters: [
            { type: 'text', text: name || 'לקוח' },
            { type: 'text', text: bizName || 'העסק' },
            { type: 'text', text: link },
          ] }],
        },
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { error: (j.error && j.error.message) || ('http_' + res.status) };
    const id = j.messages && j.messages[0] && j.messages[0].id;
    return { id: id || null };
  } catch (e) {
    return { error: 'fetch_error' };
  }
}

export async function POST(req) {
  if (!(await rateLimit('send:' + clientIp(req), 12, 60))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const { data: biz } = await supa.from('businesses')
    .select('id, name, rating_token, send_channel, sender_mode, waba_phone_id').eq('owner_id', user.id).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'no business' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 500) : [];
  if (!ids.length) return NextResponse.json({ error: 'no_ids' }, { status: 400 });

  // RLS guarantees these are only this owner's customers.
  const { data: customers } = await supa.from('customers')
    .select('id, name, phone, do_not_contact, has_reviewed').in('id', ids).eq('business_id', biz.id);
  const targets = (customers || []).filter(c => c.phone && !c.do_not_contact);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://repucare.co.il';
  // per-customer visit link → private feedback becomes attributable (see /api/visit)
  const channel = biz.send_channel || 'whatsapp';
  const sender = resolveSender(biz);

  let sent = 0, queued = 0, failed = 0;
  for (const c of targets) {
    let status = 'queued', provider_msg_id = null, error = null;
    if (sender) {
      const link = appUrl + '/api/visit?c=' + encodeURIComponent(c.id) + '&t=' + biz.rating_token;
      const r = await sendWhatsApp(sender, c.phone, c.name, biz.name, link);
      if (r.error) { status = 'failed'; error = String(r.error).slice(0, 300); failed++; }
      else { status = 'sent'; provider_msg_id = r.id; sent++; }
    } else {
      queued++; // no sender configured yet — recorded, ready to fire once WhatsApp is connected.
    }
    await supa.from('review_requests').insert({
      business_id: biz.id, customer_name: c.name || null, contact: c.phone,
      channel, status, provider_msg_id, template: sender ? sender.template : null, error,
    });
    await supa.from('customers').update({ last_seen: new Date().toISOString() }).eq('id', c.id).eq('business_id', biz.id);
  }

  return NextResponse.json({
    ok: true, selected: ids.length, processed: targets.length,
    sent, queued, failed, skipped: ids.length - targets.length,
    pendingProvider: !sender,
  });
}
