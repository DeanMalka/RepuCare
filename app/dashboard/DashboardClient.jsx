'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '../../lib/supabaseBrowser';

const TYPES = {
  dental:'מרפאת שיניים', clinic:'מרפאה / קליניקה', aesthetic:'קוסמטיקה ואסתטיקה', spa:'ספא / עיסוי', nails:'מניקור / פדיקור',
  salon:'מספרה / ברבר', dog:'טיפוח כלבים', vet:'וטרינר',
  garage:'מוסך', carwash:'שטיפת רכב', tires:'צמיגים / פנצ׳ר',
  restaurant:'מסעדה', cafe:'בית קפה', bakery:'מאפייה / קונדיטוריה', fastfood:'מזון מהיר / טייק אווי', bar:'בר / פאב', catering:'קייטרינג',
  grocery:'מכולת / סופרמרקט', butcher:'אטליז', greengrocer:'ירקן', pharmacy:'בית מרקחת',
  clothing:'אופנה / בגדים', shoes:'נעליים', jewelry:'תכשיטים ושעונים', toys:'צעצועים', gifts:'מתנות',
  electronics:'חשמל ואלקטרוניקה', phones:'סלולר / תיקון טלפונים', computers:'מחשבים', optics:'אופטיקה ומשקפיים',
  hardware:'חומרי בניין / טמבוריה', paint:'צבעים', furniture:'רהיטים', homegoods:'כלי בית ועיצוב', florist:'פרחים',
  gym:'חדר כושר', studio:'סטודיו (יוגה/פילאטיס)', kindergarten:'גן ילדים / פעוטון', play:'משחקייה', school:'חוגים / לימודים',
  realestate:'תיווך נדל״ן', lawyer:'עורך דין', accountant:'רואה חשבון / יועץ מס', insurance:'ביטוח ופיננסים',
  electrician:'חשמלאי', plumber:'אינסטלטור', renovation:'שיפוצים / קבלן', ac:'טכנאי מזגנים', appliance:'טכנאי מוצרי חשמל', locksmith:'מנעולן',
  gardening:'גינון', pestcontrol:'הדברה', moving:'הובלות', cleaning:'ניקיון',
  photography:'צילום', print:'דפוס / גרפיקה', event:'אולם / הפקת אירועים', travel:'סוכנות נסיעות', laundry:'מכבסה', driving:'בית ספר לנהיגה',
  other:'אחר / עסק כללי'
};
const HEB_M = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];

const INK='#0a1c26', INK2='#0e2733', PETROL='#0b6f8e', TEAL='#0fa7a3', TEALL='#5fd6d2', GOLD='#c4a35a', STAR='#f5b50a', POS='#10936f', MUTED='#5f717b', LINE='#e4edf2';

const panel = { background:'#fff', border:'1px solid '+LINE, borderRadius:18, padding:20, boxShadow:'0 14px 36px -18px rgba(10,40,52,.28)' };
const h3 = { fontSize:16, fontWeight:700, color:INK };
const inp = { width:'100%', padding:12, border:'1.5px solid #e2ecf1', borderRadius:12, fontSize:15, fontFamily:'inherit', marginBottom:10, outline:'none', background:'#fbfdfe', color:INK };
const btn = { display:'inline-flex', alignItems:'center', gap:8, padding:'11px 18px', border:'none', borderRadius:11, background:'linear-gradient(135deg,'+TEAL+','+PETROL+')', color:'#fff', fontWeight:600, fontSize:14.5, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 12px 26px -12px rgba(11,111,142,.6)', textDecoration:'none' };
const ghost = { padding:'10px 16px', border:'1px solid #dfeaef', borderRadius:11, background:'#fff', color:PETROL, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', textDecoration:'none' };
const soon = { fontSize:10.5, color:MUTED, border:'1px solid '+LINE, borderRadius:999, padding:'1px 8px' };

function RcMark({ s=30 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden="true" style={{ filter:'drop-shadow(0 0 8px rgba(95,214,210,.45))' }}>
      <defs><linearGradient id="rcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#62d7d2"/><stop offset="1" stopColor="#0b6f8e"/></linearGradient></defs>
      <rect x="8" y="8" width="104" height="104" rx="28" fill="url(#rcg)"/>
      <circle cx="57" cy="55" r="29" fill="#fff"/>
      <path d="M40 74 L34 93 L58 79 Z" fill="#fff"/>
      <path d="M57 69c-9-6-17-11-17-19 0-5 4-8 8-8 4 0 7 2 9 6 2-4 5-6 9-6 4 0 8 3 8 8 0 8-8 13-17 19z" fill="#0b6f8e"/>
      <path d="M95 20 l3 9 9 3 -9 3 -3 9 -3-9 -9-3 9-3 z" fill="#fff"/>
    </svg>
  );
}
const I = {
  grid:'M3 3h8v8H3zM13 3h8v5h-8zM13 11h8v10h-8zM3 13h8v8H3z',
  send:'M4 4h16v12H7l-3 3z',
  star:'m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z',
  chat:'M21 11.5a8 8 0 0 1-11 7L4 20l1.5-5A8 8 0 1 1 21 11.5z',
  bars:'M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3',
  gear:'M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.4 2.4a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.3-1a7 7 0 0 0 1.7 1L9.5 22h5l.4-2.4a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.6a7 7 0 0 0 .1-1z',
  trend:'M3 17l6-6 4 4 7-7M14 5h5v5',
  shield:'M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z',
};
function Ico({ d, s=19, stroke='currentColor' }) {
  return <svg viewBox="0 0 24 24" width={s} height={s} style={{ stroke, fill:'none', strokeWidth:1.8, flex:'none' }}><path d={d} strokeLinejoin="round"/></svg>;
}
function stars(v){ const n=Math.round(v||0); return '★★★★★'.slice(0,n)+'☆☆☆☆☆'.slice(0,5-n); }

export default function DashboardClient({ email, isAdmin=false, business, feedback=[], requests=[], reviews=[], events=[], sub, appUrl, leads = [], customers = [] }) {
  const router = useRouter(); const [view,setView]=useState('dash'); const V=(x)=>view===x; const navTo=(x)=>(e)=>{e.preventDefault();setView(x);window.scrollTo(0,0);};
  const [busy, setBusy] = useState(false);
  async function post(url, body, method='POST') {
    setBusy(true);
    try {
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{}) });
      return await r.json().catch(()=>({}));
    } catch (e) {
      return { ok:false, error:'network' };
    } finally {
      setBusy(false);
    }
  }
  async function logout(){ await browserClient().auth.signOut(); router.push('/login'); }

  if (!business) {
    return <Onboard onCreate={async (b)=>{ const r=await post('/api/business', b); if(r.ok) router.refresh(); else alert(r.error||'שגיאה'); }} email={email} logout={logout} busy={busy} />;
  }

  const ratingEvents = events.filter(e=>e.type==='rating').map(e=> Number(e.meta && e.meta.rating)).filter(n=>n>=1&&n<=5);
  const fbRatings = feedback.map(f=>f.rating).filter(n=>typeof n==='number' && n>=1 && n<=5);
  const allRatings = [...ratingEvents, ...fbRatings];
  const avgRating = allRatings.length ? (allRatings.reduce((a,b)=>a+b,0)/allRatings.length) : null;
  const googleCount = reviews.length;
  const requestsSent = requests.length;
  const conversion = requestsSent ? Math.round((ratingEvents.length / requestsSent) * 100) : null;
  const caughtPrivate = feedback.length;
  const openFb = feedback.filter(f=>f.status==='new').length;
  const ratingLink = (appUrl||'') + '/r/' + business.rating_token;
  const planLabel = sub ? (sub.status==='trialing' ? 'בתקופת ניסיון (45 יום)' : sub.status==='active' ? 'מנוי פעיל' : sub.status) : 'ללא מנוי פעיל';

  const base = new Date(); base.setDate(1);
  const months = [];
  for (let i=5;i>=0;i--){
    const m = new Date(base.getFullYear(), base.getMonth()-i, 1);
    const y=m.getFullYear(), mo=m.getMonth();
    const inM = (ts)=>{ const t=new Date(ts); return t.getFullYear()===y && t.getMonth()===mo; };
    const reqN = requests.filter(r=>inM(r.created_at)).length;
    const rs = events.filter(e=>e.type==='rating' && inM(e.created_at)).map(e=>Number(e.meta&&e.meta.rating)).filter(n=>n>=1&&n<=5);
    months.push({ label:HEB_M[mo], reqN, ratingAvg: rs.length ? rs.reduce((a,b)=>a+b,0)/rs.length : null });
  }
  const maxReq = Math.max(1, ...months.map(m=>m.reqN));
  const hasSeries = months.some(m=>m.reqN>0 || m.ratingAvg!=null);

  const SURVEY_Q = [['q_service','שירות'],['q_staff','יחס הצוות'],['q_value','מחיר מול תמורה'],['q_timeliness','מהירות / זמנים']];
  const surveyAvg = (k) => { const v = feedback.map(f=>f[k]).filter(n=>typeof n==='number'); return v.length ? (v.reduce((a,b)=>a+b,0)/v.length) : null; };
  const surveyCount = feedback.filter(f => SURVEY_Q.some(([k])=>typeof f[k]==='number')).length;

  function exportLeadsCsv() {
    const head = ['תאריך','שם עסק','איש קשר','טלפון','דירוג','מס׳ ביקורות','סטטוס'];
    const rows = leads.map(l => [new Date(l.created_at).toLocaleString('he-IL'), l.business_name||'', l.contact_name||'', l.contact_phone||'', l.google_rating==null?'':l.google_rating, l.google_reviews_count==null?'':l.google_reviews_count, l.status||'']);
    const csv = [head, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\r\n');
    const blob = new Blob(['﻿'+csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'repucare-leads.csv'; a.click(); URL.revokeObjectURL(url);
  }

  const shell = { display:'grid', gridTemplateColumns:'262px 1fr', minHeight:'100vh', direction:'rtl', background:'#eef4f8', color:'#15242c', fontFamily:'Rubik, system-ui, Arial, sans-serif' };
  const side = { background:'linear-gradient(180deg,'+INK+','+INK2+')', color:'#fff', padding:'22px 16px', position:'sticky', top:0, height:'100vh', display:'flex', flexDirection:'column' };
  const main = { padding:'22px 28px 60px', minWidth:0 };
  const navA = (on)=>({ display:'flex', alignItems:'center', gap:11, color: on?'#fff':'rgba(255,255,255,.72)', padding:'11px 13px', borderRadius:12, fontSize:15, fontWeight:500, textDecoration:'none', background: on?'linear-gradient(135deg,rgba(15,167,163,.22),rgba(11,111,142,.22))':'transparent', boxShadow: on?'inset 0 0 0 1px rgba(95,214,210,.3)':'none' });

  return (
    <div style={shell} className="rc-shell">
      <aside style={side} className="rc-side">
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 10px 22px', direction:'ltr' }}>
          <span style={{ fontWeight:800, fontSize:20, letterSpacing:'-.03em', color:'#fff' }}>RepuCare</span>
          <RcMark s={28}/>
        </div>
        <nav style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <a onClick={navTo('dash')} style={navA(V('dash'))} href="#"><Ico d={I.grid}/> דשבורד</a>
          <a onClick={navTo('customers')} style={navA(V('customers'))} href="#"><Ico d={I.send}/> לקוחות ושליחה</a>
          <a onClick={navTo('reviews')} style={navA(V('reviews'))} href="#"><Ico d={I.star}/> ביקורות ופידבק {openFb>0 && <span style={{ marginInlineStart:'auto', background:'#e0913a', color:'#fff', fontSize:11, borderRadius:999, padding:'1px 7px' }}>{openFb}</span>}</a>
          <a onClick={navTo('reports')} style={navA(V('reports'))} href="#"><Ico d={I.bars}/> דוחות</a>
          <a onClick={navTo('settings')} style={navA(V('settings'))} href="#"><Ico d={I.gear}/> הגדרות</a>
          {isAdmin && <a onClick={navTo('leads')} style={navA(V('leads'))} href="#"><Ico d={I.trend}/> לידים <span style={{ marginInlineStart:'auto', background:TEAL, color:'#fff', fontSize:11, borderRadius:999, padding:'1px 7px' }}>{leads.length}</span></a>}
        </nav>
        <div style={{ marginTop:'auto', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:'12px 14px', fontSize:13 }}>
          <b style={{ display:'block', color:'#fff', fontSize:14 }}>{business.name}</b>
          <span style={{ color:'rgba(255,255,255,.55)' }}>{business.city || '—'} · {TYPES[business.business_type]||business.business_type}</span>
          {sub && (sub.status==='trialing'||sub.status==='active')
            ? <span style={{ display:'inline-block', marginTop:8, fontSize:10.5, letterSpacing:'.06em', color:'#9ff0e6', border:'1px solid rgba(95,214,210,.4)', borderRadius:999, padding:'2px 9px' }}>{sub.status==='trialing'?'פיילוט · 45 יום חינם':'מנוי פעיל'}</span>
            : <span style={{ display:'inline-block', marginTop:8, fontSize:10.5, letterSpacing:'.06em', color:GOLD, border:'1px solid rgba(196,163,90,.45)', borderRadius:999, padding:'2px 9px' }}>ללא מנוי פעיל</span>}
        </div>
      </aside>

      <main style={main} id="top">
        <div className="rc-noprint" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:22, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:23, fontWeight:800, letterSpacing:'-.02em' }}>שלום {business.name} 👋</h1>
            <div style={{ color:MUTED, fontSize:13.5, marginTop:2 }}>תמונת המוניטין של העסק — {new Date().toLocaleDateString('he-IL',{month:'long',year:'numeric'})}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:12.5, color:PETROL, background:'#fff', border:'1px solid #dcebf0', borderRadius:999, padding:'6px 14px', fontWeight:600 }}>{planLabel}</span>
            <a style={btn} onClick={navTo('customers')} href="#"><Ico d={I.send} s={16} stroke="#fff"/> שלח בקשות</a>
            <button style={{ ...ghost }} onClick={logout}>יציאה</button>
          </div>
        </div>

        {V('dash') && (
        <div className="rc-kpis" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:18 }}>
          <Kpi icon={I.star} label="דירוג ממוצע" value={avgRating!=null? avgRating.toFixed(1) : '—'}
               extra={avgRating!=null ? <span style={{ color:STAR, fontSize:13, letterSpacing:1 }}>{stars(avgRating)}</span> : null}
               delta={avgRating!=null ? allRatings.length+' דירוגים שנאספו' : 'אין דירוגים עדיין'} />
          <Kpi icon={I.star} label="ביקורות גוגל" value={business.google_reviews_count!=null? business.google_reviews_count : googleCount}
               extra={business.google_rating!=null ? <span style={{ color:STAR, fontSize:13 }}>★ {Number(business.google_rating).toFixed(1)}</span> : null}
               delta={business.google_reviews_count!=null ? 'מסונכרן מגוגל' : 'לחץ סנכרן בכרטיס למטה'} flat={business.google_reviews_count==null} />
          <Kpi icon={I.send} label="בקשות שנשלחו" value={requestsSent} delta="סה״כ" flat />
          <Kpi icon={I.trend} label="המרה לביקורת" value={conversion!=null? conversion : '—'} small={conversion!=null?'%':''}
               delta={conversion!=null ? 'מתוך הבקשות' : 'יוצג אחרי בקשות'} flat />
          <Kpi icon={I.shield} label="נחסם מפומבי" value={caughtPrivate} delta="פידבק פרטי" flat />
        </div>
        )}

        {V('dash') && (
        <div className="rc-2col" style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:18, marginBottom:18 }}>
          <div style={panel}>
            <div style={{ marginBottom:8 }}><h3 style={h3}>פעילות ודירוג</h3><div style={{ color:MUTED, fontSize:12.5 }}>6 חודשים אחרונים</div></div>
            {hasSeries ? <GrowthChart months={months} maxReq={maxReq}/> :
              <div style={{ padding:'34px 8px', textAlign:'center', color:MUTED, fontSize:13.5 }}>
                צובר נתונים — ככל שתשלח בקשות ותאסוף דירוגים, כאן תופיע מגמת הצמיחה החודשית.
              </div>}
            <div style={{ display:'flex', gap:16, fontSize:12.5, color:MUTED, marginTop:6 }}>
              <span><i style={{ display:'inline-block', width:11, height:11, borderRadius:3, marginInlineEnd:6, background:TEAL, verticalAlign:'-1px' }}/>בקשות בחודש</span>
              <span><i style={{ display:'inline-block', width:11, height:11, borderRadius:3, marginInlineEnd:6, background:GOLD, verticalAlign:'-1px' }}/>דירוג ממוצע</span>
            </div>
          </div>

          <div style={panel}>
            <div style={{ marginBottom:14 }}><h3 style={h3}>מקור הביקורות</h3><div style={{ color:MUTED, fontSize:12.5 }}>לפי ערוץ</div></div>
            <Src name="Google" val={business.google_reviews_count||googleCount} max={Math.max(1,business.google_reviews_count||0,googleCount)} color="#fff" border>
              <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M47 24.5c0-1.6-.2-3.1-.4-4.5H24v9h12.9c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 7.2-10.4 7.2-17.7z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.5-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48z"/></svg>
            </Src>
            {(business.pro_url && business.pro_consent)
              ? <Src name="המקצוענים" val={business.pro_reviews_count||0} max={Math.max(1,business.pro_reviews_count||0,googleCount)} color={PETROL}>
                  <span style={{ color:'#fff', fontWeight:800, fontSize:12 }}>פ</span>
                </Src>
              : <Src name="המקצוענים" soonLabel="הוסף קישור בהגדרות" color={PETROL}>
                  <span style={{ color:'#fff', fontWeight:800, fontSize:12 }}>פ</span>
                </Src>}
            <Src name="Facebook" soonLabel="בקרוב · שלב 2" color="#1877f2"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17 5.66 21.13 10.44 21.94v-7H7.9v-2.94h2.54V9.85c0-2.52 1.5-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.94h-2.34v7C18.34 21.13 22 17 22 12.06"/></svg></Src>
            <Src name="Instagram" soonLabel="בקרוב · שלב 2" color="linear-gradient(135deg,#f09433,#bc1888)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none"/></svg></Src>
            <p style={{ fontSize:12, color:MUTED, marginTop:14 }}>בשלב 2 נאחד גם פייסבוק ואינסטגרם — וכל תגובה, בכל ערוץ, תיספר כאן.</p>
          </div>
        </div>
        )}

        {/* Google — live rating + reviews via Places API (New) */}
        {V('dash') && (
          <div style={{ ...panel, marginBottom:18 }} id="google">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
              <h3 style={h3}>Google {business.google_rating!=null && <span style={{ color:STAR, fontWeight:800 }}>★ {Number(business.google_rating).toFixed(1)}</span>} {business.google_reviews_count!=null && <span style={{ fontSize:12.5, color:MUTED, fontWeight:500 }}>· {business.google_reviews_count} ביקורות</span>}</h3>
              <div style={{ display:'flex', gap:8 }}>
                {business.google_review_url && <a style={ghost} href={business.google_review_url} target="_blank" rel="noreferrer">פתח בגוגל ↗</a>}
                <button style={ghost} disabled={busy} onClick={async()=>{ const r=await post('/api/google'); if(r&&r.ok) router.refresh(); else alert((r&&r.error)||'שגיאה בסנכרון'); }}>{business.google_rating!=null?'רענן':'סנכרן עכשיו'}</button>
              </div>
            </div>
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'4px 0 14px' }}/>
            {(business.google_reviews&&business.google_reviews.length)
              ? business.google_reviews.slice(0,5).map((rv,i)=>(
                  <div key={i} style={{ padding:'11px 0', borderBottom:'1px solid '+LINE }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontWeight:600, fontSize:14 }}>{rv.author||'לקוח'}</span><span style={{ color:STAR, fontSize:13 }}>{stars(rv.rating)}</span><span style={{ color:MUTED, fontSize:11.5, marginInlineStart:'auto' }}>{rv.date||''}</span></div>
                    {rv.body && <div style={{ fontSize:13.5, color:INK2, marginTop:4 }}>{rv.body}</div>}
                  </div>
                ))
              : <p style={{ color:MUTED, fontSize:13.5 }}>{business.google_rating!=null? 'אין טקסט ביקורות להצגה כרגע.' : 'לחץ "סנכרן עכשיו" כדי למשוך את הדירוג והביקורות מגוגל (לפי שם העסק והעיר).'}</p>}
          </div>
        )}
        {/* pro.co.il (המקצוענים) — read-only external source */}
        {V('dash') && business.pro_url && business.pro_consent && (
          <div style={{ ...panel, marginBottom:18 }} id="pro">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
              <h3 style={h3}>המקצוענים {business.pro_rating!=null && <span style={{ color:STAR, fontWeight:800 }}>★ {Number(business.pro_rating).toFixed(2)}</span>} {business.pro_reviews_count!=null && <span style={{ fontSize:12.5, color:MUTED, fontWeight:500 }}>· {business.pro_reviews_count} ביקורות</span>}</h3>
              <div style={{ display:'flex', gap:8 }}>
                <a style={ghost} href={business.pro_url} target="_blank" rel="noreferrer">פתח פרופיל ↗</a>
                <button style={ghost} disabled={busy} onClick={async()=>{ const r=await post('/api/pro'); if(r&&r.ok) router.refresh(); else alert((r&&r.error)||'שגיאה ברענון'); }}>רענן</button>
              </div>
            </div>
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'4px 0 14px' }}/>
            {(business.pro_reviews&&business.pro_reviews.length)
              ? business.pro_reviews.slice(0,5).map((rv,i)=>(
                  <div key={i} style={{ padding:'11px 0', borderBottom:'1px solid '+LINE }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontWeight:600, fontSize:14 }}>{rv.author||'לקוח'}</span><span style={{ color:STAR, fontSize:13 }}>{stars(rv.rating)}</span><span style={{ color:MUTED, fontSize:11.5, marginInlineStart:'auto' }}>{rv.date||''}</span></div>
                    {rv.body && <div style={{ color:'#43525b', fontSize:13.5, marginTop:2 }}>{rv.body}</div>}
                  </div>
                ))
              : <p style={{ color:MUTED, fontSize:13.5 }}>שמרת קישור ואישור — לחץ "רענן" כדי למשוך את הדירוג והביקורות מהמקצוענים.</p>}
            <p style={{ fontSize:11.5, color:MUTED, marginTop:10 }}>מקור: פרופיל המקצוענים שלך (קריאה בלבד).{business.pro_fetched_at? ' עודכן: '+new Date(business.pro_fetched_at).toLocaleDateString('he-IL') : ''}</p>
          </div>
        )}

        {V('reviews') && (
        <div className="rc-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
          <div style={panel} id="reviews">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}><h3 style={h3}>ביקורות גוגל אחרונות</h3></div>
            {reviews.length===0
              ? <div style={{ padding:'22px 6px', color:MUTED, fontSize:13.5, lineHeight:1.6 }}>
                  סנכרון ביקורות הגוגל שלך מגיע ב<b style={{color:INK}}>שלב 2</b>. בינתיים — כל דירוג שנאסף דרך RepuCare מופיע במדדים למעלה, והדירוגים הנמוכים נתפסים בפידבק הפרטי משמאל.
                </div>
              : reviews.map(rv=>(
                  <div key={rv.id} style={{ display:'flex', gap:12, padding:'13px 0', borderBottom:'1px solid '+LINE }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'#dbe8ee', color:PETROL, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flex:'none' }}>{(rv.reviewer||'?').slice(0,1)}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontWeight:600, fontSize:14.5 }}>{rv.reviewer||'לקוח'}</span><span style={{ color:STAR, fontSize:13 }}>{stars(rv.rating)}</span></div>
                      <div style={{ color:'#43525b', fontSize:13.5, marginTop:2 }}>{rv.body||''}</div>
                      <div style={{ color:MUTED, fontSize:11.5, marginTop:4 }}>{rv.source||'google'} · {rv.external_date||new Date(rv.created_at).toLocaleDateString('he-IL')}</div>
                    </div>
                  </div>
                ))}
          </div>

          <div style={panel} id="feedback">
            <div style={{ marginBottom:8 }}><h3 style={h3}>פידבק פרטי — לטיפול {openFb>0 && <span style={{ fontSize:12, color:'#fff', background:GOLD, borderRadius:999, padding:'2px 9px', marginInlineStart:6 }}>{openFb} חדש</span>}</h3><div style={{ color:MUTED, fontSize:12.5 }}>נתפס לפני שהפך לפומבי</div></div>
            {feedback.length===0 && <p style={{ color:MUTED, fontSize:14, paddingTop:8 }}>אין פידבק עדיין.</p>}
            {feedback.map(f=>(
              <div key={f.id} style={{ display:'flex', gap:11, alignItems:'flex-start', padding:'12px 0', borderBottom:'1px solid '+LINE }}>
                <span style={{ width:9, height:9, borderRadius:'50%', marginTop:6, flex:'none', background: f.status==='new'?'#e0913a':POS }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, color:'#3a4750', lineHeight:1.5 }}>{f.body || '(ללא טקסט)'} {f.rating?<span style={{ color:GOLD, fontWeight:700 }}>· {f.rating}★</span>:''}</div>
                  <div style={{ color:MUTED, fontSize:11.5, marginTop:3 }}>{(f.customer_name||f.customer_phone) ? <>{f.customer_name||'לקוח'}{f.customer_phone && <> · <a href={'https://wa.me/'+String(f.customer_phone).replace(/[^\d]/g,'')} target="_blank" rel="noreferrer" style={{ color:PETROL, fontWeight:700 }}>{f.customer_phone} ↗</a></>}</> : 'אנונימי'} · {new Date(f.created_at).toLocaleDateString('he-IL')}</div>
                </div>
                {f.status==='new'
                  ? <button style={{ ...ghost, padding:'4px 11px', fontSize:12 }} onClick={async()=>{ await post('/api/business',{markFeedback:f.id},'PATCH'); router.refresh(); }}>סמן כטופל</button>
                  : <span style={{ fontSize:10.5, fontWeight:600, borderRadius:999, padding:'2px 9px', background:'rgba(16,147,111,.14)', color:POS }}>טופל</span>}
              </div>
            ))}
          </div>
        </div>
        )}

        {V('dash') && (
        <div style={{ ...panel, marginBottom:18 }} id="share">
          <h3 style={h3}>קישור הדירוג שלך</h3>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'10px 0 16px' }}/>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <input style={{ ...inp, marginBottom:0, flex:1, minWidth:240, direction:'ltr', textAlign:'left' }} readOnly value={ratingLink} />
            <button style={ghost} onClick={()=>{navigator.clipboard&&navigator.clipboard.writeText(ratingLink); alert('הקישור הועתק');}}>העתק</button>
            <a style={btn} href={'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(ratingLink)} target="_blank" rel="noreferrer">קוד QR</a>
          </div>
          <p style={{ fontSize:12.5, color:MUTED, marginTop:10 }}>תלו את ה‑QR בעסק או שלחו את הקישור ללקוחות אחרי השירות. דירוג גבוה → גוגל, נמוך → פידבק פרטי אליכם.</p>
        </div>
        )}

        {/* customers + bulk send */}
        {V('customers') && (
        <div style={{ ...panel, marginBottom:18 }} id="customers">
          <h3 style={h3}>לקוחות ושליחה מרוכזת</h3>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'10px 0 16px' }}/>
          <Customers customers={customers} post={post} router={router} busy={busy} />
        </div>
        )}

        {/* single send request */}
        {V('customers') && (
        <div style={{ ...panel, marginBottom:18 }} id="send">
          <h3 style={h3}>שליחת בקשה ללקוח בודד</h3>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'10px 0 16px' }}/>
          <SendRequest onSend={async (b)=>{ const r=await post('/api/requests', b); if(r.ok) router.refresh(); else alert(r.error||'שגיאה'); return r; }} busy={busy} />
        </div>
        )}

        {V('reports') && <BusinessReport business={business} avgRating={avgRating} allRatings={allRatings} requestsSent={requestsSent} conversion={conversion} caughtPrivate={caughtPrivate} SURVEY_Q={SURVEY_Q} surveyAvg={surveyAvg} surveyCount={surveyCount} />}

        {V('customers') && (
        <div style={{ ...panel, marginBottom:18 }} id="requests">
          <h3 style={h3}>בקשות אחרונות</h3>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'10px 0 16px' }}/>
          {requests.length===0 && <p style={{ color:MUTED, fontSize:14 }}>עדיין לא נשלחו בקשות.</p>}
          {requests.map(r=>(
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid '+LINE, fontSize:14 }}>
              <span style={{ color:INK }}>{r.customer_name || r.contact || 'לקוח'}</span>
              <span style={{ color:MUTED, fontSize:12 }}>{r.status} · {r.channel}</span>
            </div>
          ))}
        </div>
        )}

        {V('leads') && isAdmin && (
          <div style={{ ...panel, marginBottom:18 }} id="leads">
            <h3 style={h3}>לידים נכנסים <span style={{ fontSize:11, color:'#fff', background:PETROL, borderRadius:999, padding:'2px 9px', marginInlineStart:6 }}>אדמין</span> {leads.length>0 && <span style={{ fontSize:12, color:'#fff', background:TEAL, borderRadius:999, padding:'2px 9px', marginInlineStart:6 }}>{leads.length}</span>}</h3>
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'10px 0 16px' }}/>
            {leads.length===0
              ? <p style={{ color:MUTED, fontSize:14 }}>אין עדיין לידים. כל מי שממלא "בדיקת מוניטין חינם" בעמוד הנחיתה יופיע כאן אוטומטית.</p>
              : <>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
                    <thead><tr style={{ color:MUTED }}>
                      <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>עסק</th>
                      <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>איש קשר</th>
                      <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>טלפון</th>
                      <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>גוגל</th>
                      <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>תאריך</th>
                    </tr></thead>
                    <tbody>
                      {leads.map(l=>(
                        <tr key={l.id} style={{ borderTop:'1px solid '+LINE }}>
                          <td style={{ padding:'8px', color:INK, fontWeight:600 }}>{l.business_name}</td>
                          <td style={{ padding:'8px', color:INK }}>{l.contact_name||'—'}</td>
                          <td style={{ padding:'8px', color:PETROL, direction:'ltr', textAlign:'right' }}>{l.contact_phone||'—'}</td>
                          <td style={{ padding:'8px', color:MUTED }}>{l.google_rating!=null? '★'+l.google_rating+' · '+(l.google_reviews_count==null?0:l.google_reviews_count) : '—'}</td>
                          <td style={{ padding:'8px', color:MUTED, fontSize:12 }}>{new Date(l.created_at).toLocaleDateString('he-IL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button style={{ ...ghost, marginTop:12 }} onClick={exportLeadsCsv}>⬇ ייצוא CSV</button>
              </>}
          </div>
        )}

        {V('settings') && (
        <div style={{ ...panel, marginBottom:18 }} id="settings">
          <h3 style={h3}>הגדרות העסק</h3>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'10px 0 16px' }}/>
          <Settings business={business} onSave={async (b)=>{ const r=await post('/api/business', b, 'PATCH'); if(!r.ok){ alert(r.error||'שגיאה'); return false; } if(b.pro_url && b.pro_consent){ await post('/api/pro'); } await post('/api/google'); router.refresh(); return true; }} busy={busy} />
        </div>
        )}

        {V('dash') && (
        <div style={{ ...panel, textAlign:'center', background:'linear-gradient(135deg,#0b2330,'+PETROL+')', border:'none' }}>
          {sub && (sub.status==='trialing'||sub.status==='active')
            ? <p style={{ color:'#eafbf6', fontWeight:700, fontSize:15 }}>המנוי פעיל ✓ — {planLabel}</p>
            : <>
                <p style={{ color:'rgba(255,255,255,.92)', fontWeight:700, fontSize:15.5, marginBottom:4 }}>45 יום חינם — בלי התחייבות</p>
                <p style={{ color:'rgba(255,255,255,.82)', marginBottom:14, fontSize:14 }}>ואז: ₪300 + מע״מ לחודש &nbsp;·&nbsp; או ₪3,060 + מע״מ לשנה <span style={{ color:'#ffe6a8', fontWeight:700 }}>(15% הנחה — חיסכון ₪540)</span></p>
                <button style={{ ...btn, background:'#fff', color:PETROL }} disabled={busy} onClick={async()=>{ const r=await post('/api/checkout'); if(r.url) window.location.href=r.url; else alert(r.error||'שגיאה'); }}>הפעל מנוי (45 יום חינם)</button>
              </>}
        </div>
        )}

        <p style={{ textAlign:'center', color:'#9fb0b8', fontSize:12, marginTop:18 }}>RepuCare · ניהול מוניטין לעסקי שירות</p>
      </main>

      <style>{`@media(max-width:1080px){.rc-kpis{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:900px){.rc-shell{grid-template-columns:1fr!important}.rc-side{display:none!important}.rc-2col{grid-template-columns:1fr!important}}@media print{.rc-side{display:none!important}.rc-shell{grid-template-columns:1fr!important;background:#fff!important}.rc-noprint{display:none!important}#report{box-shadow:none!important;border:none!important}}`}</style>
    </div>
  );
}

function Kpi({ icon, label, value, small, extra, delta, flat }) {
  return (
    <div style={{ ...panel, padding:'16px 16px 14px' }}>
      <div style={{ color:MUTED, fontSize:12.5, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ width:26, height:26, borderRadius:8, background:'linear-gradient(135deg,rgba(15,167,163,.13),rgba(11,111,142,.13))', display:'flex', alignItems:'center', justifyContent:'center' }}><Ico d={icon} s={15} stroke={PETROL}/></span>
        {label}
      </div>
      <div style={{ fontSize:27, fontWeight:800, letterSpacing:'-.02em', lineHeight:1 }}>{value}{small && <small style={{ fontSize:15, color:MUTED, fontWeight:600 }}>{small}</small>} {extra}</div>
      <div style={{ fontSize:12, fontWeight:600, marginTop:6, color: flat?MUTED:POS }}>{delta}</div>
    </div>
  );
}

function GrowthChart({ months, maxReq }) {
  const W=600, H=220, padL=36, padR=14, padB=28, padT=14;
  const innerW = W-padL-padR, innerH = H-padT-padB;
  const n = months.length;
  const step = innerW / n;
  const barW = Math.min(46, step*0.5);
  const yReq = (v)=> padT + innerH - (v/maxReq)*innerH;
  const yRate = (v)=> padT + innerH - (v/5)*innerH;
  const cx = (i)=> padL + step*i + step/2;
  const linePts = months.map((m,i)=> m.ratingAvg!=null ? (cx(i)+','+yRate(m.ratingAvg)) : null).filter(Boolean).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto' }}>
      <g stroke="#eef3f6" strokeWidth="1">
        {[0,0.25,0.5,0.75,1].map((p,i)=><line key={i} x1={padL} y1={padT+innerH*p} x2={W-padR} y2={padT+innerH*p}/>)}
      </g>
      <g fill={TEAL} opacity="0.9">
        {months.map((m,i)=>{ return <rect key={i} x={cx(i)-barW/2} y={yReq(m.reqN)} width={barW} height={Math.max(0,padT+innerH-yReq(m.reqN))} rx="6"/>; })}
      </g>
      {linePts && <polyline points={linePts} fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}
      <g fill={GOLD}>{months.map((m,i)=> m.ratingAvg!=null ? <circle key={i} cx={cx(i)} cy={yRate(m.ratingAvg)} r="4"/> : null)}</g>
      <g fill="#7d8d96" fontSize="13" fontFamily="Rubik" textAnchor="middle">
        {months.map((m,i)=><text key={i} x={cx(i)} y={H-8}>{m.label}</text>)}
      </g>
    </svg>
  );
}

function Src({ name, val, max, color, border, children, soonLabel }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid '+LINE }}>
      <div style={{ width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flex:'none', background:color, ...(border?{border:'1px solid '+LINE}:{}) }}>{children}</div>
      <div style={{ fontSize:13, color:MUTED, minWidth:74 }}>{name}</div>
      {soonLabel
        ? <><div style={{ flex:1, height:8, borderRadius:999, background:'#eef3f6' }}/><span style={soon}>{soonLabel}</span></>
        : <><div style={{ flex:1, height:8, borderRadius:999, background:'#eef3f6', overflow:'hidden' }}><i style={{ display:'block', height:'100%', borderRadius:999, width:((val/max)*100)+'%', background:'linear-gradient(90deg,'+TEAL+','+PETROL+')' }}/></div><b style={{ fontSize:14 }}>{val}</b></>}
    </div>
  );
}

function Customers({ customers = [], post, router, busy }) {
  const [rows, setRows] = useState([]);
  const [consent, setConsent] = useState(false);
  const [sel, setSel] = useState({});
  const [msg, setMsg] = useState(null);

  function parseList(text) {
    const out = [];
    String(text || '').split(/\r?\n/).forEach(line => {
      const t = line.trim(); if (!t) return;
      if (/^(name|שם|phone|טלפון|נייד)/i.test(t)) return;
      const parts = t.split(/[,;\t]/).map(s => s.trim()).filter(Boolean);
      if (!parts.length) return;
      let phone = parts.find(p => p.replace(/[^\d]/g, '').length >= 9);
      let name = parts.find(p => p !== phone) || '';
      if (parts.length === 1) { phone = parts[0]; name = ''; }
      if (phone) out.push({ name, phone });
    });
    return out;
  }
  function onFile(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setRows(parseList(String(r.result))); r.readAsText(f);
  }
  async function doImport() {
    if (!rows.length) { alert('אין שורות לייבוא'); return; }
    if (!consent) { alert('צריך לאשר שיש לך הסכמת הלקוחות'); return; }
    const r = await post('/api/customers', { action: 'import', customers: rows, consent: true });
    if (r && r.ok) { setMsg('יובאו ' + r.imported + ' לקוחות' + (r.skipped ? ' (' + r.skipped + ' דולגו)' : '')); setRows([]); setConsent(false); router.refresh(); }
    else alert((r && r.error) || 'שגיאה בייבוא');
  }
  const ids = Object.keys(sel).filter(k => sel[k]);
  const sendable = customers.filter(c => !c.do_not_contact);
  function toggleAll() { if (ids.length === sendable.length && sendable.length) setSel({}); else { const n = {}; sendable.forEach(c => n[c.id] = true); setSel(n); } }
  async function doSend() {
    if (!ids.length) { alert('סמן לפחות לקוח אחד'); return; }
    const r = await post('/api/send', { ids });
    if (r && r.ok) {
      setMsg(r.pendingProvider
        ? ('נרשמו ' + r.queued + ' בקשות בתור — יישלחו אוטומטית ברגע שנחבר את WhatsApp')
        : ('נשלחו ' + r.sent + ' הודעות' + (r.failed ? ' · ' + r.failed + ' נכשלו' : '')));
      setSel({}); router.refresh();
    } else alert((r && r.error) || 'שגיאה בשליחה');
  }

  return (
    <div>
      <div style={{ background:'#f7fbfc', border:'1px solid #e7f0f3', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:INK, marginBottom:8 }}>ייבוא רשימת לקוחות</div>
        <p style={{ fontSize:12.5, color:MUTED, marginBottom:10 }}>העלה קובץ CSV או הדבק שורות בפורמט <b>שם,טלפון</b> (שורה לכל לקוח).</p>
        <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} style={{ fontSize:13, marginBottom:8, display:'block' }} />
        <textarea placeholder={"דנה לוי,050-1234567\nיוסי כהן,0529876543"} onChange={e=>setRows(parseList(e.target.value))} style={{ ...inp, minHeight:70, direction:'ltr', textAlign:'left' }} />
        <label style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:12.5, color:MUTED, cursor:'pointer', margin:'2px 0 10px' }}>
          <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} style={{ width:'auto', marginTop:3, flex:'none' }} />
          <span>אני מאשר/ת שקיבלתי את הסכמת הלקוחות לקבל הודעות מהעסק (חוק התקשורת — תיקון 40).</span>
        </label>
        <button style={{ ...btn, opacity: busy?0.7:1 }} disabled={busy} onClick={doImport}>ייבא {rows.length ? '(' + rows.length + ')' : ''}</button>
      </div>

      {msg && <div style={{ marginBottom:12, padding:'9px 13px', borderRadius:10, fontSize:13, background:'#eafaf4', border:'1px solid #cdeede', color:INK }}>{msg}</div>}

      {customers.length === 0
        ? <p style={{ color:MUTED, fontSize:14 }}>עוד אין לקוחות. ייבא רשימה למעלה כדי להתחיל.</p>
        : <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              <button style={ghost} onClick={toggleAll}>{ids.length === sendable.length && sendable.length ? 'נקה בחירה' : 'בחר הכל'}</button>
              <button style={{ ...btn, opacity:(busy||!ids.length)?0.6:1 }} disabled={busy||!ids.length} onClick={doSend}>שגר לנבחרים ({ids.length})</button>
            </div>
            <div style={{ overflowX:'auto', maxHeight:360, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
                <thead><tr style={{ color:MUTED }}>
                  <th style={{ padding:'6px 8px' }}></th>
                  <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>שם</th>
                  <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>טלפון</th>
                  <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>ביקורים</th>
                  <th style={{ padding:'6px 8px', fontWeight:600, textAlign:'right' }}>סטטוס</th>
                </tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} style={{ borderTop:'1px solid '+LINE, opacity:c.do_not_contact?0.5:1 }}>
                      <td style={{ padding:'7px 8px' }}><input type="checkbox" disabled={c.do_not_contact} checked={!!sel[c.id]} onChange={e=>setSel(s=>({ ...s, [c.id]: e.target.checked }))} /></td>
                      <td style={{ padding:'7px 8px', color:INK }}>{c.name || '—'}</td>
                      <td style={{ padding:'7px 8px', color:PETROL, direction:'ltr', textAlign:'right' }}>{c.phone}</td>
                      <td style={{ padding:'7px 8px', color:MUTED }}>{c.visit_count || 1}</td>
                      <td style={{ padding:'7px 8px' }}>
                        {c.do_not_contact
                          ? <span style={{ fontSize:11, color:'#c0552d' }}>הוסר</span>
                          : <span style={{ fontSize:11.5, color:PETROL, cursor:'pointer' }} onClick={async()=>{ await post('/api/customers',{action:'optout',id:c.id,value:true}); router.refresh(); }}>הסר</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize:11.5, color:MUTED, marginTop:10 }}>שליחה אוטומטית ב‑WhatsApp תופעל ברגע שנחבר את חשבון השליחה; עד אז הבקשות נרשמות בתור.</p>
          </>}
    </div>
  );
}

function SendRequest({ onSend, busy }) {
  const [name,setName]=useState(''); const [contact,setContact]=useState(''); const [channel,setChannel]=useState('sms'); const [msg,setMsg]=useState(null);
  return (
    <div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ flex:1, minWidth:140 }}><label style={{ fontSize:13, fontWeight:600, color:INK }}>שם הלקוח</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} /></div>
        <div style={{ flex:1, minWidth:140 }}><label style={{ fontSize:13, fontWeight:600, color:INK }}>טלפון / מייל</label><input style={inp} value={contact} onChange={e=>setContact(e.target.value)} /></div>
        <select style={{ ...inp, width:120 }} value={channel} onChange={e=>setChannel(e.target.value)}><option value="sms">SMS</option><option value="email">אימייל</option><option value="whatsapp">וואטסאפ</option></select>
        <button style={btn} disabled={busy} onClick={async()=>{ if(!name&&!contact){alert('מלא שם או טלפון');return;} const r=await onSend({name,contact,channel}); if(r&&r.ok){ setMsg(r.returning ? { t:'returning', v:r.visitCount } : { t:'new' }); setName(''); setContact(''); } }}>שלח בקשה</button>
      </div>
      {msg && (
        <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12, fontSize:13.5, lineHeight:1.6,
          background: msg.t==='returning' ? '#fff7e8' : '#eafaf4',
          border:'1px solid '+(msg.t==='returning' ? '#f0e2c0' : '#cdeede'), color:INK }}>
          {msg.t==='returning'
            ? <>👋 <b>לקוח חוזר</b> (ביקור מס׳ {msg.v})! מומלץ לשלוח לו <b>"תודה שבחרת בנו שוב"</b> — ואם כבר השאיר ביקורת בעבר, אין צורך לבקש שוב.</>
            : <>✓ נשלחה בקשת ביקורת ללקוח חדש.</>}
        </div>
      )}
    </div>
  );
}

function Settings({ business, onSave, busy }) {
  const [name,setName]=useState(business.name||''); const [city,setCity]=useState(business.city||'');
  const [type,setType]=useState(business.business_type||'dental'); const [google,setGoogle]=useState(business.google_review_url||'');
  const [pro,setPro]=useState(business.pro_url||''); const [proC,setProC]=useState(!!business.pro_consent);
  const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  async function handleSave(){ setSaving(true); const ok=await onSave({ name, city, business_type:type, google_review_url:google, pro_url:pro, pro_consent:proC }); setSaving(false); if(ok!==false){ setSaved(true); setTimeout(()=>setSaved(false),2500); } }
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div><label style={{ fontSize:13, fontWeight:600, color:INK }}>שם העסק</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><label style={{ fontSize:13, fontWeight:600, color:INK }}>עיר</label><input style={inp} value={city} onChange={e=>setCity(e.target.value)} /></div>
        <div><label style={{ fontSize:13, fontWeight:600, color:INK }}>סוג עסק</label><select style={inp} value={type} onChange={e=>setType(e.target.value)}>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={{ fontSize:13, fontWeight:600, color:INK }}>קישור ביקורת בגוגל</label><input style={{ ...inp, direction:'ltr', textAlign:'left' }} value={google} onChange={e=>setGoogle(e.target.value)} placeholder="https://g.page/r/..." /></div>
      </div>
      <div style={{ marginTop:6, paddingTop:12, borderTop:'1px solid '+LINE }}>
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>קישור פרופיל המקצוענים (pro.co.il) — אופציונלי</label>
        <input style={{ ...inp, direction:'ltr', textAlign:'left' }} value={pro} onChange={e=>setPro(e.target.value)} placeholder="https://www.pro.co.il/.../business-id-..." />
        <label style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:12.5, color:MUTED, cursor:'pointer', marginTop:2 }}>
          <input type="checkbox" checked={proC} onChange={e=>setProC(e.target.checked)} style={{ width:'auto', marginTop:3, flex:'none' }} />
          <span>אני מאשר/ת שזהו עמוד העסק שלי במקצוענים, ושמותר ל‑RepuCare להציג ממנו דירוג וביקורות.</span>
        </label>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
        <button style={btn} disabled={saving} onClick={handleSave}>{saving?'שומר…':'שמור שינויים'}</button>
        {saved && <span style={{ color:POS, fontWeight:700, fontSize:14 }}>✓ נשמר</span>}
      </div>
    </div>
  );
}

function Onboard({ onCreate, email, logout, busy }) {
  const [name,setName]=useState(''); const [city,setCity]=useState(''); const [type,setType]=useState('salon'); const [google,setGoogle]=useState('');
  const page = { minHeight:'100vh', direction:'rtl', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(125% 125% at 50% 0%, #f4fafb 0%, #e7eff4 55%, #dde8ee 100%)', padding:'24px 16px', fontFamily:'Rubik, system-ui, Arial, sans-serif' };
  return (
    <main style={page}>
      <div style={{ ...panel, width:'100%', maxWidth:520 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}><RcMark s={34}/><span style={{ fontWeight:800, fontSize:23, letterSpacing:'-.03em' }}><span style={{ color:PETROL }}>Repu</span><span style={{ color:TEAL }}>Care</span></span></div>
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'14px 0 16px' }}/>
        <h2 style={{ fontSize:20, fontWeight:800, color:INK }}>ברוך הבא ל‑RepuCare 👋</h2>
        <p style={{ color:MUTED, margin:'6px 0 16px' }}>בוא נקים את העסק שלך (דקה).</p>
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>שם העסק</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} />
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>עיר</label><input style={inp} value={city} onChange={e=>setCity(e.target.value)} />
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>סוג עסק</label>
        <select style={inp} value={type} onChange={e=>setType(e.target.value)}>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>קישור ביקורת בגוגל (אפשר בהמשך)</label><input style={{ ...inp, direction:'ltr', textAlign:'left' }} value={google} onChange={e=>setGoogle(e.target.value)} placeholder="https://g.page/r/..." />
        <button style={{ ...btn, width:'100%', justifyContent:'center', marginTop:4 }} disabled={busy} onClick={()=>{ if(!name){alert('מלא שם עסק');return;} onCreate({ name, city, business_type:type, google_review_url:google }); }}>צור עסק</button>
        <div style={{ marginTop:12, fontSize:12, color:MUTED }}>{email} · <span style={{ cursor:'pointer', color:PETROL }} onClick={logout}>יציאה</span></div>
      </div>
    </main>
  );
}


function BusinessReport({ business, avgRating, allRatings, requestsSent, conversion, caughtPrivate, SURVEY_Q, surveyAvg, surveyCount }) {
  const g = business.google_rating!=null ? Number(business.google_rating) : null;
  const gc = business.google_reviews_count;
  const pr = business.pro_rating!=null ? Number(business.pro_rating) : null;
  const today = new Date().toLocaleDateString('he-IL',{ day:'numeric', month:'long', year:'numeric' });
  const narrative = g!=null
    ? (g>=4.4 ? 'המוניטין שלך מצוין — '+g.toFixed(1)+'★ בגוגל. המיקוד עכשיו: להגדיל את כמות הביקורות כדי לבלוט מעל המתחרים.'
       : g>=3.8 ? 'מצב טוב עם מקום לשיפור ('+g.toFixed(1)+'★). RepuCare מפנה לקוחות מרוצים לגוגל וחוסם תלונות בפרטי — וכך הדירוג מטפס.'
       : 'הדירוג ('+g.toFixed(1)+'★) דורש תשומת לב. הצעד הראשון: לתפוס פידבק שלילי בפרטי לפני שהוא מגיע לגוגל — בדיוק מה ש-RepuCare עושה אוטומטית.')
    : 'עדיין לא סונכרן דירוג גוגל. היכנס להגדרות ושמור, או לחץ "סנכרן" בכרטיס הגוגל בדשבורד — ונביא את הדירוג והביקורות האמיתיים שלך.';
  const L = [];
  L.push('📊 דוח מצב מוניטין — '+(business.name||''));
  L.push(today);
  if (g!=null) L.push('דירוג גוגל: ★'+g.toFixed(1)+(gc!=null?' ('+gc+' ביקורות)':''));
  if (pr!=null) L.push('דירוג המקצוענים: ★'+pr.toFixed(2));
  if (avgRating!=null) L.push('דירוג ממוצע (סקרים): '+avgRating.toFixed(1)+'/5');
  L.push('בקשות ביקורת שנשלחו: '+requestsSent);
  if (conversion!=null) L.push('שיעור המרה לביקורת: '+conversion+'%');
  L.push('פידבק פרטי שנתפס (נחסם מפומבי): '+caughtPrivate);
  L.push('— נוצר ע״י RepuCare');
  const shareText = L.join('\n');
  const wa = 'https://wa.me/?text='+encodeURIComponent(shareText);
  const mail = 'mailto:?subject='+encodeURIComponent('דוח מצב מוניטין — '+(business.name||''))+'&body='+encodeURIComponent(shareText);
  const card = { background:'#f7fbfc', border:'1px solid #e7f0f3', borderRadius:14, padding:'14px 16px' };
  const big = { fontSize:26, fontWeight:800, color:INK, lineHeight:1, marginTop:4 };
  return (
    <div style={{ ...panel, marginBottom:18 }} id="report">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}><RcMark s={30}/><span style={{ fontWeight:800, fontSize:20 }}><span style={{ color:PETROL }}>Repu</span><span style={{ color:TEAL }}>Care</span></span></div>
          <h2 style={{ fontSize:21, fontWeight:800, color:INK, marginTop:10 }}>דוח מצב מוניטין</h2>
          <div style={{ color:MUTED, fontSize:13.5 }}>{business.name} · {today}</div>
        </div>
        <div className="rc-noprint" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={btn} onClick={()=>window.print()}>🖨 הורד / הדפס</button>
          <a style={ghost} href={wa} target="_blank" rel="noreferrer">💬 וואטסאפ</a>
          <a style={ghost} href={mail}>✉️ מייל</a>
        </div>
      </div>
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'14px 0 16px' }}/>
      <div style={{ background:'linear-gradient(135deg,#0b2330,'+PETROL+')', color:'#eafbf6', borderRadius:14, padding:'14px 16px', fontSize:14.5, lineHeight:1.6, marginBottom:16 }}>{narrative}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:16 }}>
        <div style={card}><div style={{ fontSize:13, color:MUTED }}>דירוג גוגל</div><div style={big}>{g!=null? '★ '+g.toFixed(1) : '—'}</div><div style={{ fontSize:12, color:MUTED, marginTop:4 }}>{gc!=null? gc+' ביקורות' : 'לא סונכרן'}</div></div>
        {pr!=null && <div style={card}><div style={{ fontSize:13, color:MUTED }}>המקצוענים</div><div style={big}>★ {pr.toFixed(2)}</div><div style={{ fontSize:12, color:MUTED, marginTop:4 }}>{business.pro_reviews_count!=null? business.pro_reviews_count+' ביקורות':''}</div></div>}
        <div style={card}><div style={{ fontSize:13, color:MUTED }}>דירוג ממוצע (סקרים)</div><div style={big}>{avgRating!=null? avgRating.toFixed(1) : '—'}<span style={{ fontSize:14, color:MUTED, fontWeight:600 }}> /5</span></div><div style={{ fontSize:12, color:MUTED, marginTop:4 }}>{allRatings.length} דירוגים</div></div>
        <div style={card}><div style={{ fontSize:13, color:MUTED }}>בקשות שנשלחו</div><div style={big}>{requestsSent}</div><div style={{ fontSize:12, color:MUTED, marginTop:4 }}>{conversion!=null? conversion+'% המרה':'—'}</div></div>
        <div style={card}><div style={{ fontSize:13, color:MUTED }}>נחסם מפומבי</div><div style={big}>{caughtPrivate}</div><div style={{ fontSize:12, color:MUTED, marginTop:4 }}>פידבק פרטי</div></div>
      </div>
      <h3 style={{ ...h3, marginBottom:10 }}>תובנות מהסקר {surveyCount>0 && <span style={{ fontSize:12, color:MUTED, fontWeight:500 }}>· {surveyCount} תשובות</span>}</h3>
      {surveyCount===0
        ? <p style={{ color:MUTED, fontSize:14 }}>עדיין אין תשובות סקר. ברגע שלקוחות ידרגו, יופיעו כאן הציונים הממוצעים לכל שאלה.</p>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:12 }}>
            {SURVEY_Q.map(([k,label])=>{ const a=surveyAvg(k); return (
              <div key={k} style={card}>
                <div style={{ fontSize:13, color:MUTED }}>{label}</div>
                <div style={{ fontSize:22, fontWeight:800, color: a!=null && a<3.5 ? '#c0552d' : INK, marginTop:3 }}>{a!=null? a.toFixed(1) : '—'}<span style={{ fontSize:13, color:MUTED, fontWeight:500 }}> /5</span></div>
                <div style={{ height:6, background:'#e7f0f3', borderRadius:99, marginTop:7, overflow:'hidden' }}><div style={{ height:'100%', width:((a||0)/5*100)+'%', background:'linear-gradient(90deg,'+TEAL+','+PETROL+')' }}/></div>
              </div> ); })}
          </div>}
      <p style={{ textAlign:'center', color:'#9fb0b8', fontSize:11.5, marginTop:18 }}>הופק אוטומטית ע״י RepuCare · {today}</p>
    </div>
  );
}
