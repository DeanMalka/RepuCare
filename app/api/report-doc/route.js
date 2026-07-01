import { serverClient } from '../../../lib/supabaseServer';
import { gatherReportData } from '../../../lib/reportData';
import { buildReportHTML } from '../../../lib/report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Owner-only: renders the reputation report as a standalone HTML page.
// The dashboard opens this in a new tab → the owner prints / saves to PDF / shares.
//   /api/report-doc            → main business
//   /api/report-doc?branch=ID  → a specific branch
export async function GET(req) {
  const supa = serverClient();
  const url = new URL(req.url);
  const branchId = url.searchParams.get('branch') || null;
  const d = await gatherReportData(supa, { branchId });
  if (d.error) {
    const code = d.error === 'unauth' ? 401 : 400;
    return new Response('<!doctype html><meta charset="utf-8"><div dir="rtl" style="font-family:sans-serif;padding:40px;text-align:center">לא ניתן להפיק את הדו"ח (' + d.error + '). התחבר/י ונסה/י שוב.</div>', {
      status: code, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  const html = buildReportHTML(d);
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
