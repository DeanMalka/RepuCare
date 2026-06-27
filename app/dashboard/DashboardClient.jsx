'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '../../lib/supabaseBrowser';

const TYPES = { dental:'מרפאת שיניים', salon:'מספרה / ברבר', dog:'מספרת כלבים', garage:'מוסך', play:'משחקייה', event:'אולם אירועים', aesthetic:'אסתטיקה' };

const INK = '#0a1c26', PETROL = '#0b6f8e', TEAL = '#0fa7a3', GOLD = '#c4a35a', MUTED = '#5a6b73';
const card = { background:'#fff', border:'1px solid #eef3f6', borderRadius:20, padding:24, boxShadow:'0 18px 44px -26px rgba(10,40,52,.28)', marginBottom:18 };
const inp = { width:'100%', padding:12, border:'1.5px solid #e2ecf1', borderRadius:12, fontSize:15, fontFamily:'inherit', marginBottom:10, outline:'none', background:'#fbfdfe', color:INK };
const btn = { padding:'11px 18px', border:'none', borderRadius:12, background:'linear-gradient(135deg,#0fa7a3,#0b6f8e)', color:'#fff', fontWeight:700, fontSize:14.5, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 12px 24px -12px rgba(11,111,142,.55)' };
const ghost = { padding:'10px 16px', border:'1px solid #dfeaef', borderRadius:12, background:'#fff', color:PETROL, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' };
const goldRule = { height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.5),transparent)', margin:'10px 0 16px' };
const h3 = { fontSize:16, fontWeight:800, color:INK, letterSpacing:'-.01em' };

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
      <svg width="38" height="38" viewBox="0 0 120 120" aria-hidden="true" style={{ display:'block', filter:'drop-shadow(0 6px 14px rgba(11,111,142,.3))' }}>
        <defs><linearGradient id="rcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#62d7d2"/><stop offset="1" stopColor="#0b6f8e"/></linearGradient></defs>
        <rect x="8" y="8" width="104" height="104" rx="28" fill="url(#rcg)"/>
        <circle cx="57" cy="55" r="29" fill="#fff"/>
        <path d="M40 74 L34 93 L58 79 Z" fill="#fff"/>
        <path d="M57 69c-9-6-17-11-17-19 0-5 4-8 8-8 4 0 7 2 9 6 2-4 5-6 9-6 4 0 8 3 8 8 0 8-8 13-17 19z" fill="#0b6f8e"/>
        <path d="M95 20 l3 9 9 3 -9 3 -3 9 -3-9 -9-3 9-3 z" fill="#fff"/>
      </svg>
      <span style={{ fontWeight:800, fontSize:23, letterSpacing:'-.03em' }}><span style={{ color:PETROL }}>Repu</span><span style={{ color:TEAL }}>Care</span></span>
    </div>
  );
}

export default function DashboardClient({ email, business, feedback, requests, sub, appUrl, leads = [] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function post(url, body, method='POST') {
    setBusy(true);
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{}) });
    setBusy(false);
    return r.json().catch(()=>({}));
  }
  async function logout(){ await browserClient().auth.signOut(); router.push('/login'); }

  if (!business) {
    return <Onboard onCreate={async (b)=>{ const r=await post('/api/business', b); if(r.ok) router.refresh(); else alert(r.error||'שגיאה'); }} email={email} logout={logout} busy={busy} />;
  }

  const openFb = feedback.filter(f=>f.status==='new').length;
  const ratingLink = (appUrl||'') + '/r/' + business.rating_token;
  const planLabel = sub ? (sub.status==='trialing' ? 'בתקופת ניסיון (45 יום)' : sub.status) : 'ללא מנוי פעיל';
  const page = { minHeight:'100vh', direction:'rtl', background:'radial-gradient(120% 90% at 50% 0%, #f4fafb 0%, #e9f1f5 45%, #e1ebf0 100%)', padding:'26px 18px 70px' };

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

  return (
    <main style={page}>
    <div style={{ maxWidth:1000, margin:'0 auto' }}>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <Logo/>
          <div style={{ color:MUTED, fontSize:13.5, marginTop:6 }}>{business.name} · {business.city} · {TYPES[business.business_type]||business.business_type}</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:12.5, color:PETROL, background:'#fff', border:'1px solid #dcebf0', borderRadius:999, padding:'6px 14px', fontWeight:600 }}>{planLabel}</span>
          <button style={ghost} onClick={logout}>יציאה</button>
        </div>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:4 }}>
        <Kpi label="בקשות שנשלחו" value={requests.length} accent={TEAL} />
        <Kpi label="פידבק פתוח לטיפול" value={openFb} accent={GOLD} />
        <Kpi label="סטטוס מנוי" value={sub ? (sub.status==='trialing'?'ניסיון':'פעיל') : '—'} accent={PETROL} />
      </div>

      <div style={card}>
        <h3 style={h3}>קישור הדירוג שלך</h3>
        <div style={goldRule}/>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input style={{ ...inp, marginBottom:0, flex:1, minWidth:240, direction:'ltr', textAlign:'left' }} readOnly value={ratingLink} />
          <button style={ghost} onClick={()=>{navigator.clipboard&&navigator.clipboard.writeText(ratingLink); alert('הקישור הועתק');}}>העתק</button>
          <a style={{ ...btn, textDecoration:'none', display:'inline-flex', alignItems:'center' }} href={'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(ratingLink)} target="_blank" rel="noreferrer">קוד QR</a>
        </div>
        <p style={{ fontSize:12.5, color:MUTED, marginTop:10 }}>תלו את ה‑QR בעסק או שלחו את הקישור ללקוחות אחרי השירות. דירוג גבוה → גוגל, נמוך → פידבק פרטי אליכם.</p>
      </div>

      <div style={card}>
        <h3 style={h3}>שליחת בקשת ביקורת ללקוח</h3>
        <div style={goldRule}/>
        <SendRequest onSend={async (b)=>{ const r=await post('/api/requests', b); if(r.ok) router.refresh(); else alert(r.error||'שגיאה'); return r; }} busy={busy} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div style={card}>
          <h3 style={h3}>פידבק פרטי {openFb>0 && <span style={{ fontSize:12, color:'#fff', background:GOLD, borderRadius:999, padding:'2px 9px', marginInlineStart:6 }}>{openFb} חדש</span>}</h3>
          <div style={goldRule}/>
          {feedback.length===0 && <p style={{ color:MUTED, fontSize:14 }}>אין פידבק עדיין.</p>}
          {feedback.map(f=>(
            <div key={f.id} style={{ padding:'11px 0', borderBottom:'1px solid #f0f5f7' }}>
              <div style={{ fontSize:14, color:INK, lineHeight:1.5 }}>{f.body || '(ללא טקסט)'} {f.rating?<span style={{ color:GOLD, fontWeight:700 }}>· {f.rating}★</span>:''}</div>
              <div style={{ fontSize:11.5, color:MUTED, marginTop:5 }}>
                {f.status==='new'
                  ? <button style={{ ...ghost, padding:'4px 11px', fontSize:12 }} onClick={async()=>{ await post('/api/business',{markFeedback:f.id},'PATCH'); router.refresh(); }}>סמן כטופל</button>
                  : <span style={{ color:TEAL, fontWeight:600 }}>✓ טופל</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={card}>
          <h3 style={h3}>בקשות אחרונות</h3>
          <div style={goldRule}/>
          {requests.length===0 && <p style={{ color:MUTED, fontSize:14 }}>עדיין לא נשלחו בקשות.</p>}
          {requests.map(r=>(
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0f5f7', fontSize:14 }}>
              <span style={{ color:INK }}>{r.customer_name || r.contact || 'לקוח'}</span>
              <span style={{ color:MUTED, fontSize:12 }}>{r.status} · {r.channel}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <h3 style={h3}>תובנות מהסקר {surveyCount>0 && <span style={{ fontSize:12, color:MUTED, fontWeight:500 }}>· {surveyCount} תשובות</span>}</h3>
        <div style={goldRule}/>
        {surveyCount===0
          ? <p style={{ color:MUTED, fontSize:14 }}>עדיין אין תשובות סקר. ברגע שלקוחות ידרגו, כאן יופיעו הציונים הממוצעים לכל שאלה — ותדע מה הם אוהבים ומה פחות.</p>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:12 }}>
              {SURVEY_Q.map(([k,label])=>{ const a=surveyAvg(k); return (
                <div key={k} style={{ background:'#f7fbfc', border:'1px solid #e7f0f3', borderRadius:14, padding:'12px 14px' }}>
                  <div style={{ fontSize:13, color:MUTED }}>{label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color: a!=null && a<3.5 ? '#c0552d' : INK, marginTop:3 }}>{a!=null? a.toFixed(1) : '—'}<span style={{ fontSize:13, color:MUTED, fontWeight:500 }}> /5</span></div>
                  <div style={{ height:6, background:'#e7f0f3', borderRadius:99, marginTop:7, overflow:'hidden' }}><div style={{ height:'100%', width:((a||0)/5*100)+'%', background:'linear-gradient(90deg,#0fa7a3,#0b6f8e)' }}/></div>
                </div> ); })}
            </div>}
      </div>

      <div style={card}>
        <h3 style={h3}>לידים נכנסים {leads.length>0 && <span style={{ fontSize:12, color:'#fff', background:TEAL, borderRadius:999, padding:'2px 9px', marginInlineStart:6 }}>{leads.length}</span>}</h3>
        <div style={goldRule}/>
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
                    <tr key={l.id} style={{ borderTop:'1px solid #f0f5f7' }}>
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

      <div style={card}>
        <h3 style={h3}>הגדרות העסק</h3>
        <div style={goldRule}/>
        <Settings business={business} onSave={async (b)=>{ const r=await post('/api/business', b, 'PATCH'); if(r.ok) router.refresh(); else alert(r.error||'שגיאה'); }} busy={busy} />
      </div>

      <div style={{ ...card, textAlign:'center', background:'linear-gradient(135deg,#0b2330,#0b6f8e)', border:'none' }}>
        {sub && (sub.status==='trialing'||sub.status==='active')
          ? <p style={{ color:'#eafbf6', fontWeight:700, fontSize:15 }}>המנוי פעיל ✓ — {planLabel}</p>
          : <>
              <p style={{ color:'rgba(255,255,255,.92)', fontWeight:700, fontSize:15.5, marginBottom:4 }}>45 יום חינם — בלי התחייבות</p>
              <p style={{ color:'rgba(255,255,255,.82)', marginBottom:14, fontSize:14 }}>ואז: ₪349 לחודש &nbsp;·&nbsp; או ₪3,560 לשנה <span style={{ color:'#ffe6a8', fontWeight:700 }}>(15% הנחה — חיסכון ₪628)</span></p>
              <button style={{ ...btn, background:'#fff', color:PETROL }} disabled={busy} onClick={async()=>{ const r=await post('/api/checkout'); if(r.url) window.location.href=r.url; else alert(r.error||'שגיאה'); }}>הפעל מנוי (45 יום חינם)</button>
            </>}
      </div>

      <p style={{ textAlign:'center', color:'#9fb0b8', fontSize:12, marginTop:18 }}>RepuCare · ניהול מוניטין לעסקי שירות</p>
    </div>
    </main>
  );
}

function Kpi({ label, value, accent }) {
  return (
    <div style={{ ...card, marginBottom:18, padding:0, overflow:'hidden' }}>
      <div style={{ height:4, background:accent }}/>
      <div style={{ padding:'18px 22px' }}>
        <div style={{ color:MUTED, fontSize:12.5 }}>{label}</div>
        <div style={{ fontSize:30, fontWeight:800, marginTop:4, color:INK, letterSpacing:'-.02em' }}>{value}</div>
      </div>
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
            ? <>👋 <b>לקוח חוזר</b> (ביקור מס׳ {msg.v})! לקוח שחוזר = סימן ששירותכם טוב. מומלץ לשלוח לו <b>"תודה שבחרת בנו שוב"</b> — ואם כבר השאיר ביקורת בעבר, אין צורך לבקש שוב.</>
            : <>✓ נשלחה בקשת ביקורת ללקוח חדש.</>}
        </div>
      )}
    </div>
  );
}
function Settings({ business, onSave, busy }) {
  const [name,setName]=useState(business.name||''); const [city,setCity]=useState(business.city||'');
  const [type,setType]=useState(business.business_type||'dental'); const [google,setGoogle]=useState(business.google_review_url||'');
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div><label style={{ fontSize:13, fontWeight:600, color:INK }}>שם העסק</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><label style={{ fontSize:13, fontWeight:600, color:INK }}>עיר</label><input style={inp} value={city} onChange={e=>setCity(e.target.value)} /></div>
        <div><label style={{ fontSize:13, fontWeight:600, color:INK }}>סוג עסק</label><select style={inp} value={type} onChange={e=>setType(e.target.value)}>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={{ fontSize:13, fontWeight:600, color:INK }}>קישור ביקורת בגוגל</label><input style={{ ...inp, direction:'ltr', textAlign:'left' }} value={google} onChange={e=>setGoogle(e.target.value)} placeholder="https://g.page/r/..." /></div>
      </div>
      <button style={btn} disabled={busy} onClick={()=>onSave({ name, city, business_type:type, google_review_url:google })}>שמור שינויים</button>
    </div>
  );
}
function Onboard({ onCreate, email, logout, busy }) {
  const [name,setName]=useState(''); const [city,setCity]=useState(''); const [type,setType]=useState('salon'); const [google,setGoogle]=useState('');
  const page = { minHeight:'100vh', direction:'rtl', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(125% 125% at 50% 0%, #f4fafb 0%, #e7eff4 55%, #dde8ee 100%)', padding:'24px 16px' };
  return (
    <main style={page}>
      <div style={{ ...card, width:'100%', maxWidth:520, marginBottom:0 }}>
        <Logo/>
        <div style={goldRule}/>
        <h2 style={{ fontSize:20, fontWeight:800, color:INK }}>ברוך הבא ל‑RepuCare 👋</h2>
        <p style={{ color:MUTED, margin:'6px 0 16px' }}>בוא נקים את העסק שלך (דקה).</p>
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>שם העסק</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} />
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>עיר</label><input style={inp} value={city} onChange={e=>setCity(e.target.value)} />
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>סוג עסק</label>
        <select style={inp} value={type} onChange={e=>setType(e.target.value)}>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <label style={{ fontSize:13, fontWeight:600, color:INK }}>קישור ביקורת בגוגל (אפשר בהמשך)</label><input style={{ ...inp, direction:'ltr', textAlign:'left' }} value={google} onChange={e=>setGoogle(e.target.value)} placeholder="https://g.page/r/..." />
        <button style={{ ...btn, width:'100%', marginTop:4 }} disabled={busy} onClick={()=>{ if(!name){alert('מלא שם עסק');return;} onCreate({ name, city, business_type:type, google_review_url:google }); }}>צור עסק</button>
        <div style={{ marginTop:12, fontSize:12, color:MUTED }}>{email} · <span style={{ cursor:'pointer', color:PETROL }} onClick={logout}>יציאה</span></div>
      </div>
    </main>
  );
}
