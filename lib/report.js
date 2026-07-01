// Builds a polished, standalone, print-ready RTL HTML reputation report.
// Pure string output (no React) so it can be served as a page (/api/report-doc)
// or emailed (/api/report-send). Self-contained: inline CSS, no external assets
// except Google Fonts (optional) — safe to print to PDF or attach.

const C = {
  ink: '#0a1c26', petrol: '#0b6f8e', teal: '#0fa7a3', tealL: '#5fd6d2',
  gold: '#c4a35a', star: '#f5b50a', pos: '#10936f', muted: '#5f717b', line: '#e4edf2',
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stars = (v) => { const n = Math.round(v || 0); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); };
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };

// Derive plain-language recommendations from the numbers.
export function buildRecommendations(d) {
  const out = [];
  const g = d.google || {};
  if (g.rating != null && g.rating < 4.3) {
    out.push('הדירוג בגוגל (' + g.rating + ') משאיר מקום לשיפור — המשיכו לתפוס פידבק מלקוחות פחות מרוצים בפרטי, לפני שזה מגיע לגוגל.');
  } else if (g.rating != null) {
    out.push('הדירוג בגוגל (' + g.rating + ') מצוין — שמרו על הקצב: כל לקוח מרוצה שמשאיר ביקורת מחזק את הבולטות שלכם בחיפוש.');
  }
  if (g.count != null) {
    const target = Math.max(150, Math.ceil((g.count * 4) / 50) * 50);
    if (g.count < target) out.push('כמות הביקורות (' + g.count + ') עדיין מתחת למוביל באזור (~' + target + '+). כל ביקור הוא הזדמנות לביקורת — המשיכו לשלוח בקשה אוטומטית.');
  }
  (d.survey || []).forEach((q) => {
    if (q.avg != null && q.avg < 3.5) out.push('בסקר, "' + q.label + '" קיבל ' + q.avg.toFixed(1) + '/5 — נקודה למיקוד שיפור.');
  });
  out.push('הגיבו לכל ביקורת בגוגל (גם תודה קצרה) — גוגל מתעדף עסקים מגיבים.');
  out.push('הוסיפו 5–10 תמונות חדשות לפרופיל הגוגל החודש.');
  return out.slice(0, 6);
}

export function buildReportHTML(d) {
  const g = d.google || {};
  const k = d.collected || {};
  const recs = (d.recommendations && d.recommendations.length) ? d.recommendations : buildRecommendations(d);
  const addedBadge = (g.added != null && g.added > 0)
    ? '<div class="added"><div class="added-n">+' + g.added + '</div><div class="added-l">ביקורות נוספו בגוגל מאז ההצטרפות' + (g.baselineAt ? ' (' + fmtDate(g.baselineAt) + ')' : '') + '</div></div>'
    : '';

  const kpiCard = (label, value, sub) =>
    '<div class="kpi"><div class="kpi-l">' + esc(label) + '</div><div class="kpi-v">' + value + '</div>' +
    (sub ? '<div class="kpi-s">' + esc(sub) + '</div>' : '') + '</div>';

  const surveyRows = (d.survey || []).filter((q) => q.avg != null).map((q) =>
    '<div class="srow"><div class="srow-h"><span>' + esc(q.label) + '</span><b>' + q.avg.toFixed(1) + ' <small>/5</small></b></div>' +
    '<div class="bar"><i style="width:' + Math.round((q.avg / 5) * 100) + '%"></i></div></div>').join('');

  const reviewRows = (d.reviews || []).slice(0, 5).map((r) =>
    '<div class="rev"><div class="rev-h"><b>' + esc(r.author || 'לקוח') + '</b><span class="rev-st">' + stars(r.rating) + '</span>' +
    (r.date ? '<span class="rev-d">' + esc(r.date) + '</span>' : '') + '</div>' +
    (r.body ? '<div class="rev-b">' + esc(r.body) + '</div>' : '') + '</div>').join('');

  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>דו"ח מוניטין — ${esc(d.title || 'העסק')}</title>
<style>
  *{box-sizing:border-box} html,body{margin:0;padding:0}
  body{font-family:Rubik,system-ui,Arial,sans-serif;background:#eef4f8;color:${C.ink};-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .wrap{max-width:820px;margin:0 auto;padding:26px 18px 50px}
  .card{background:#fff;border:1px solid ${C.line};border-radius:18px;padding:22px;box-shadow:0 14px 36px -22px rgba(10,40,52,.3);margin-bottom:16px}
  .top{background:linear-gradient(135deg,${C.ink},${C.petrol});color:#fff;border:none}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;letter-spacing:-.02em}
  .dot{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,${C.tealL},${C.petrol});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800}
  h1{font-size:25px;margin:14px 0 2px;letter-spacing:-.02em}
  .muted{color:${C.muted};font-size:13px}
  .top .muted{color:rgba(255,255,255,.75)}
  .gold{height:1px;background:linear-gradient(90deg,transparent,rgba(196,163,90,.6),transparent);margin:12px 0 16px}
  .hero{display:flex;gap:18px;flex-wrap:wrap;align-items:center}
  .hero-rate{font-size:46px;font-weight:800;line-height:1;color:#fff}
  .hero-st{color:${C.star};font-size:20px;letter-spacing:2px}
  .added{margin-inline-start:auto;text-align:center;background:rgba(95,214,210,.16);border:1px solid rgba(95,214,210,.4);border-radius:14px;padding:12px 18px}
  .added-n{font-size:30px;font-weight:800;color:#9ff0e6}
  .added-l{font-size:12px;color:rgba(255,255,255,.8);max-width:180px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .kpi{background:#f7fbfc;border:1px solid #e7f0f3;border-radius:14px;padding:13px 14px}
  .kpi-l{font-size:12px;color:${C.muted}} .kpi-v{font-size:24px;font-weight:800;margin-top:4px} .kpi-s{font-size:11.5px;color:${C.muted};margin-top:3px}
  h3{font-size:16px;margin:0 0 4px}
  .srow{margin:11px 0} .srow-h{display:flex;justify-content:space-between;font-size:14px} .srow-h small{color:${C.muted};font-weight:500}
  .bar{height:8px;background:#e7f0f3;border-radius:99px;overflow:hidden;margin-top:6px} .bar i{display:block;height:100%;background:linear-gradient(90deg,${C.teal},${C.petrol})}
  .rev{padding:11px 0;border-bottom:1px solid ${C.line}} .rev:last-child{border-bottom:none}
  .rev-h{display:flex;align-items:center;gap:8px;font-size:14px} .rev-st{color:${C.star}} .rev-d{color:${C.muted};font-size:11.5px;margin-inline-start:auto}
  .rev-b{color:#43525b;font-size:13.5px;margin-top:3px}
  ul.recs{margin:6px 0 0;padding-inline-start:20px} ul.recs li{margin:7px 0;font-size:14px;line-height:1.5}
  .foot{text-align:center;color:#90a1a9;font-size:12px;margin-top:8px}
  @media print{ body{background:#fff} .card{box-shadow:none;break-inside:avoid} .noprint{display:none!important} }
  @media(max-width:640px){ .kpis{grid-template-columns:repeat(2,1fr)} }
</style></head><body><div class="wrap">

  <div class="card top">
    <div class="brand"><span class="dot">R</span>RepuCare</div>
    <h1>${esc(d.title || 'העסק')}</h1>
    <div class="muted">${esc(d.city || '')}${d.city ? ' · ' : ''}דו"ח מצב מוניטין · ${fmtDate(d.generatedAt || new Date().toISOString())}</div>
    <div class="gold"></div>
    <div class="hero">
      <div>
        <div class="hero-rate">${g.rating != null ? '★ ' + g.rating : '—'}</div>
        <div class="muted">${g.count != null ? g.count + ' ביקורות בגוגל' : 'אין נתון ביקורות'}</div>
      </div>
      ${addedBadge}
    </div>
  </div>

  <div class="card">
    <h3>תמונת מצב</h3><div class="muted">המספרים שאספנו עבורכם</div>
    <div class="gold"></div>
    <div class="kpis">
      ${kpiCard('דירוג גוגל', g.rating != null ? '★ ' + g.rating : '—', g.count != null ? g.count + ' ביקורות' : '')}
      ${kpiCard('נוספו מאז ההצטרפות', g.added != null ? '+' + g.added : '—', 'ביקורות בגוגל')}
      ${kpiCard('בקשות שנשלחו', k.requestsSent != null ? k.requestsSent : 0, 'דרך RepuCare')}
      ${kpiCard('נחסם מפומבי', k.caughtPrivate != null ? k.caughtPrivate : 0, 'פידבק פרטי')}
    </div>
  </div>

  ${(d.survey && d.survey.some((q) => q.avg != null)) ? `<div class="card">
    <h3>תובנות מהסקר</h3><div class="muted">ציון ממוצע לכל שאלה (1–5)</div><div class="gold"></div>
    ${surveyRows}
  </div>` : ''}

  ${(d.reviews && d.reviews.length) ? `<div class="card">
    <h3>ביקורות אחרונות בגוגל</h3><div class="gold"></div>
    ${reviewRows}
  </div>` : ''}

  <div class="card">
    <h3>המלצות לפעולה</h3><div class="gold"></div>
    <ul class="recs">${recs.map((r) => '<li>' + esc(r) + '</li>').join('')}</ul>
  </div>

  <div class="foot">הופק על ידי RepuCare · ניהול מוניטין לעסקי שירות · ${fmtDate(d.generatedAt || new Date().toISOString())}</div>
</div></body></html>`;
}
