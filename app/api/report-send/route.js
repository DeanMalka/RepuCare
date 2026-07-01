import { serverClient } from '../../../lib/supabaseServer';
import { rateLimit, clientIp } from '../../../lib/ratelimit';
import { gatherReportData } from '../../../lib/reportData';
import { buildReportHTML } from '../../../lib/report';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Owner-only: email the reputation report (HTML) via Resend.
// Body: { branchId?, to? }  — defaults to the owner's own email.
// If RESEND_API_KEY isn't set yet, returns a friendly not-configured signal so
// the UI can fall back to "open & print / share" instead.
export async function POST(req) {
  if (!(await rateLimit('reportsend:' + clientIp(req), 5, 60))) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const branchId = body.branchId || null;
  const to = String(body.to || user.email || '').trim();
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ ok: false, error: 'bad_email' }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: 'email_not_configured' }, { status: 200 });

  const d = await gatherReportData(supa, { branchId });
  if (d.error) return NextResponse.json({ ok: false, error: d.error }, { status: 400 });
  const html = buildReportHTML(d);
  const from = process.env.REPORT_FROM || 'RepuCare <reports@repucare.co.il>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to],
        subject: 'דו"ח מצב מוניטין — ' + (d.title || 'העסק שלך') + ' · RepuCare',
        html,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ ok: false, error: (j && j.message) || ('http_' + res.status) }, { status: 200 });
    return NextResponse.json({ ok: true, to, id: j.id || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 200 });
  }
}
