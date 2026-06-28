import { serverClient } from '../../../lib/supabaseServer';
import { rateLimit, clientIp } from '../../../lib/ratelimit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Normalize an Israeli phone to E.164 (+9725XXXXXXXX). Returns null if it doesn't look valid.
function normalizePhone(raw) {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (!d) return null;
  if (d.startsWith('+')) { /* keep */ }
  else if (d.startsWith('00')) d = '+' + d.slice(2);
  else if (d.startsWith('972')) d = '+' + d;
  else if (d.startsWith('0')) d = '+972' + d.slice(1);
  else d = '+972' + d;
  return /^\+\d{9,15}$/.test(d) ? d : null;
}

export async function POST(req) {
  if (!(await rateLimit('cust:' + clientIp(req), 12, 60))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const { data: biz } = await supa.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'no business' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const action = body.action || 'import';

  // Opt a customer out of all future messages.
  if (action === 'optout') {
    if (!body.id) return NextResponse.json({ error: 'no_id' }, { status: 400 });
    const { error } = await supa.from('customers').update({ do_not_contact: !!body.value })
      .eq('id', body.id).eq('business_id', biz.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // Import a list of customers (owner attests consent).
  if (action === 'import') {
    if (!body.consent) return NextResponse.json({ error: 'consent_required' }, { status: 400 });
    const list = Array.isArray(body.customers) ? body.customers.slice(0, 2000) : [];
    const now = new Date().toISOString();
    const seen = new Set();
    const rows = [];
    let skipped = 0;
    for (const c of list) {
      const phone = normalizePhone(c.phone);
      if (!phone || seen.has(phone)) { skipped++; continue; }
      seen.add(phone);
      rows.push({
        business_id: biz.id,
        phone,
        name: String(c.name || '').trim().slice(0, 120) || null,
        source: 'import',
        consent_at: now,
      });
    }
    if (!rows.length) return NextResponse.json({ ok: true, imported: 0, skipped });
    // RLS (with_check) guarantees we can only write rows for our own business_id.
    const { error } = await supa.from('customers').upsert(rows, { onConflict: 'business_id,phone' });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, imported: rows.length, skipped });
  }

  return NextResponse.json({ error: 'bad_action' }, { status: 400 });
}
