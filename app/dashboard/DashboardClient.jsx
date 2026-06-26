'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '../../lib/supabaseBrowser';

const TYPES = { dental:'מרפאת שיניים', salon:'מספרה / ברבר', dog:'מספרת כלבים', garage:'מוסך', play:'משחקייה', event:'אולם אירועים', aesthetic:'אסתטיקה' };

const card = { background:'#fff', border:'1px solid #e2ecf1', borderRadius:18, padding:22, boxShadow:'0 14px 36px -18px rgba(10,40,52,.22)', marginBottom:18 };
const inp = { width:'100%', padding:11, border:'1.5px solid #e2ecf1', borderRadius:10, fontSize:15, fontFamily:'inherit', marginBottom:10 };
const btn = { padding:'11px 18px', border:'none', borderRadius:11, background:'linear-gradient(135deg,#0fa7a3,#0b6f8e)', color:'#fff', fontWeight:600, fontSize:14.5, cursor:'pointer', fontFamily:'inherit' };
const ghost = { ...btn, background:'#eef3f6', color:'#0b6f8e' };

export default function DashboardClient({ email, business, feedback, requests, sub, appUrl }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function post(url, body, method='POST') {
    setBusy(true);
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{}) });
    setBusy(false);
    return r.json().catch(()=>({}));
  }
  async function logout(){ await browserClient().auth.signOut(); router.push('/login'); }

  // ---------- ONBOARDING ----------
  if (!business) {
    return <Onboard onCreate={async (b)=>{ const r=await post('/api/business', b); if(r.ok) router.refresh(); else alert(r.error||'שגיאה'); }} email={email} logout={logout} busy={busy} />;
  }

  const openFb = feedback.filter(f=>f.status==='new').length;
  const ratingLink = (appUrl||'') + '/r/' + business.rating_token;
  const planLabel = sub ? (sub.status==='trialing' ? 'בתקופת ניסיון (45 יום)' : sub.status) : 'ללא מנוי פעיל';

  return (
    <main style={{ maxWidth:1000, margin:'0 auto', padding:'24px 20px 60px', direction:'rtl' }}>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontWeight:900, fontSize:24, letterSpacing:'-.02em' }}>RepuCare</div>
          <div style={{ color:'#586b74', fontSize:13 }}>{business.name} · {business.city} · {TYPES[business.business_type]||business.business_type}</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#586b74', border:'1px solid #e2ecf1', borderRadius:999, padding:'5px 12px' }}>{planLabel}</span>
          <button style={ghost} onClick={logout}>יציאה</button>
        </div>
      </header>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:18 }}>
        <Kpi label="בקשות שנשלחו" value={requests.length} />
        <Kpi label="פידבק פתוח לטיפול" value={openFb} />
        <Kpi label="סטטוס מנוי" value={sub ? (sub.status==='trialing'?'ניסיון':'פעיל') : '—'} />
      </div>

      {/* Rating link / QR */}
      <div style={card}>
        <h3 style={{ marginBottom:8, fontSize:16 }}>קישור הדירוג שלך</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input style={{ ...inp, marginBottom:0, flex:1, minWidth:240 }} readOnly value={ratingLink} />
          <button style={ghost} onClick={()=>{navigator.clipboard&&navigator.clipboard.writeText(ratingLink); alert('הועתק');}}>העתק</button>
          <a style={{ ...btn, textDecoration:'none' }} href={'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data='+encodeURIComponent(ratingLink)} target="_blank" rel="noreferrer">QR</a>
        </div>
        <p style={{ fontSize:12.5, color:'#586b74', marginTop:8 }}>תלו את ה-QR בעסק או שלחו את הקישור ללקוחות אחרי השירות.</p>
      </div>

      {/* Send request */}
      <div style={card}>
        <h3 style={{ marginBottom:12, fontSize:16 }}>שליחת בקשת ביקורת ללקוח</h3>
        <SendRequest onSend={async (b)=>{ const r=await post('/api/requests', b); if(r.ok) router.refresh(); else alert(r.error||'שגיאה'); }} busy={busy} />
      </div>

      {/* Feedback + Requests */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div style={card}>
          <h3 style={{ marginBottom:10, fontSize:16 }}>פידבק פרטי</h3>
          {feedback.length===0 && <p style={{ color:'#586b74' }}>אין פידבק עדיין.</p>}
          {feedback.map(f=>(
            <div key={f.id} style={{ padding:'10px 0', borderBottom:'1px solid #eef3f6' }}>
              <div style={{ fontSize:14 }}>{f.body || '(ללא טקסט)'} {f.rating?`· ${f.rating}★`:''}</div>
              <div style={{ fontSize:11.5, color:'#586b74', marginTop:3 }}>
                {f.status==='new'
                  ? <button style={{ ...ghost, padding:'4px 10px', fontSize:12 }} onClick={async()=>{ await post('/api/business',{markFeedback:f.id},'PATCH'); router.refresh(); }}>סמן כטופל</button>
                  : 'טופל'}
              </div>
            </div>
          ))}
        </div>
        <div style={card}>
          <h3 style={{ marginBottom:10, fontSize:16 }}>בקשות אחרונות</h3>
          {requests.length===0 && <p style={{ color:'#586b74' }}>עדיין לא נשלחו בקשות.</p>}
          {requests.map(r=>(
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #eef3f6', fontSize:14 }}>
              <span>{r.customer_name || r.contact || 'לקוח'}</span>
              <span style={{ color:'#586b74', fontSize:12 }}>{r.status} · {r.channel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings + Billing */}
      <div style={card}>
        <h3 style={{ marginBottom:12, fontSize:16 }}>הגדרות</h3>
        <Settings business={business} onSave={async (b)=>{ const r=await post('/api/business', b, 'PATCH'); if(r.ok) router.refresh(); else alert(r.error||'שגיאה'); }} busy={busy} />
      </div>

      <div style={{ ...card, textAlign:'center' }}>
        {sub && (sub.status==='trialing'||sub.status==='active')
          ? <p style={{ color:'#10936f', fontWeight:600 }}>המנוי פעיל ✓ ({planLabel})</p>
          : <>
              <p style={{ color:'#586b74', marginBottom:10 }}>הפעל מנוי: 45 יום חינם, ואז ₪349/חודש. בלי התחייבות.</p>
              <button style={btn} disabled={busy} onClick={async()=>{ const r=await post('/api/checkout'); if(r.url) window.location.href=r.url; else alert(r.error||'שגיאה'); }}>הפעל מנוי (45 יום חינם)</button>
            </>}
      </div>
    </main>
  );
}

function Kpi({ label, value }) {
  return <div style={card}><div style={{ color:'#586b74', fontSize:12.5 }}>{label}</div><div style={{ fontSize:28, fontWeight:800, marginTop:4 }}>{value}</div></div>;
}
function SendRequest({ onSend, busy }) {
  const [name,setName]=useState(''); const [contact,setContact]=useState(''); const [channel,setChannel]=useState('sms');
  return (
    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
      <div style={{ flex:1, minWidth:140 }}><label style={{ fontSize:13, fontWeight:600 }}>שם הלקוח</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} /></div>
      <div style={{ flex:1, minWidth:140 }}><label style={{ fontSize:13, fontWeight:600 }}>טלפון/מייל</label><input style={inp} value={contact} onChange={e=>setContact(e.target.value)} /></div>
      <select style={{ ...inp, width:120 }} value={channel} onChange={e=>setChannel(e.target.value)}><option value="sms">SMS</option><option value="email">אימייל</option><option value="whatsapp">וואטסאפ</option></select>
      <button style={btn} disabled={busy} onClick={()=>{ if(!name&&!contact){alert('מלא שם או טלפון');return;} onSend({name,contact,channel}); setName('');setContact(''); }}>שלח בקשה</button>
    </div>
  );
}
function Settings({ business, onSave, busy }) {
  const [name,setName]=useState(business.name||''); const [city,setCity]=useState(business.city||'');
  const [type,setType]=useState(business.business_type||'dental'); const [google,setGoogle]=useState(business.google_review_url||'');
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div><label style={{ fontSize:13, fontWeight:600 }}>שם העסק</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><label style={{ fontSize:13, fontWeight:600 }}>עיר</label><input style={inp} value={city} onChange={e=>setCity(e.target.value)} /></div>
        <div><label style={{ fontSize:13, fontWeight:600 }}>סוג עסק</label><select style={inp} value={type} onChange={e=>setType(e.target.value)}>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={{ fontSize:13, fontWeight:600 }}>קישור ביקורת בגוגל</label><input style={inp} value={google} onChange={e=>setGoogle(e.target.value)} placeholder="https://g.page/r/..." /></div>
      </div>
      <button style={btn} disabled={busy} onClick={()=>onSave({ name, city, business_type:type, google_review_url:google })}>שמור</button>
    </div>
  );
}
function Onboard({ onCreate, email, logout, busy }) {
  const [name,setName]=useState(''); const [city,setCity]=useState(''); const [type,setType]=useState('salon'); const [google,setGoogle]=useState('');
  return (
    <main style={{ maxWidth:520, margin:'60px auto', padding:'0 20px', direction:'rtl' }}>
      <div style={{ ...card }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>ברוך הבא ל-RepuCare 👋</h2>
        <p style={{ color:'#586b74', margin:'6px 0 16px' }}>בוא נקים את העסק שלך (דקה).</p>
        <label style={{ fontSize:13, fontWeight:600 }}>שם העסק</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} />
        <label style={{ fontSize:13, fontWeight:600 }}>עיר</label><input style={inp} value={city} onChange={e=>setCity(e.target.value)} />
        <label style={{ fontSize:13, fontWeight:600 }}>סוג עסק</label>
        <select style={inp} value={type} onChange={e=>setType(e.target.value)}>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <label style={{ fontSize:13, fontWeight:600 }}>קישור ביקורת בגוגל (אפשר בהמשך)</label><input style={inp} value={google} onChange={e=>setGoogle(e.target.value)} placeholder="https://g.page/r/..." />
        <button style={btn} disabled={busy} onClick={()=>{ if(!name){alert('מלא שם עסק');return;} onCreate({ name, city, business_type:type, google_review_url:google }); }}>צור עסק</button>
        <div style={{ marginTop:12, fontSize:12, color:'#586b74' }}>{email} · <span style={{ cursor:'pointer', color:'#0b6f8e' }} onClick={logout}>יציאה</span></div>
      </div>
    </main>
  );
}
