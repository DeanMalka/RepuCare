'use client';
import { useState } from 'react';

const TYPES = {
  dental:    { emoji:'🦷', title:'תודה שביקרת אצלנו!',  sub:'איך היה הביקור שלך ב' },
  salon:     { emoji:'✂️', title:'יצאת מהמם/ה?',         sub:'איך הייתה החוויה ב' },
  dog:       { emoji:'🐾', title:'הפרוותן יצא מטופח?',    sub:'איך הייתה החוויה ב' },
  garage:    { emoji:'🚗', title:'הרכב חזר לכביש',        sub:'איך היה השירות ב' },
  play:      { emoji:'🎈', title:'נהניתם אצלנו?',         sub:'איך הייתה החוויה ב' },
  event:     { emoji:'🎊', title:'תודה שחגגתם איתנו!',    sub:'איך היה האירוע ב' },
  aesthetic: { emoji:'✨', title:'מרגישים מחודשים?',      sub:'איך הייתה החוויה ב' },
};

function Logo() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
      <svg width="40" height="40" viewBox="0 0 120 120" aria-hidden="true" style={{display:'block',filter:'drop-shadow(0 6px 14px rgba(11,111,142,.3))'}}>
        <defs><linearGradient id="rcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#62d7d2"/><stop offset="1" stopColor="#0b6f8e"/></linearGradient></defs>
        <rect x="8" y="8" width="104" height="104" rx="28" fill="url(#rcg)"/>
        <circle cx="57" cy="55" r="29" fill="#fff"/>
        <path d="M40 74 L34 93 L58 79 Z" fill="#fff"/>
        <path d="M57 69c-9-6-17-11-17-19 0-5 4-8 8-8 4 0 7 2 9 6 2-4 5-6 9-6 4 0 8 3 8 8 0 8-8 13-17 19z" fill="#0b6f8e"/>
        <path d="M95 20 l3 9 9 3 -9 3 -3 9 -3-9 -9-3 9-3 z" fill="#fff"/>
      </svg>
      <span style={{fontWeight:800,fontSize:25,letterSpacing:'-.03em'}}>
        <span style={{color:'#0b6f8e'}}>Repu</span><span style={{color:'#0fa7a3'}}>Care</span>
      </span>
    </div>
  );
}

export default function RatingClient({ token, name, type, google }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const p = TYPES[type] || TYPES.dental;

  async function pick(n) {
    setRating(n);
    if (n >= 4) {
      try { await fetch('/api/rate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, rating:n }) }); } catch(e){}
      window.location.href = google;
    }
  }
  async function sendFeedback() {
    setSending(true);
    try { await fetch('/api/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, rating, body }) }); } catch(e){}
    setDone(true);
  }

  const page = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', background:'radial-gradient(125% 125% at 50% 0%, #f4fafb 0%, #e7eff4 55%, #dde8ee 100%)' };
  const card = { width:'100%', maxWidth:400, background:'#fff', borderRadius:24, padding:'34px 26px 28px', textAlign:'center', boxShadow:'0 34px 80px -34px rgba(10,40,52,.4), 0 1px 0 rgba(255,255,255,.7) inset', border:'1px solid #ebf2f6' };
  const goldRule = { height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.55),transparent)', margin:'17px auto 19px', maxWidth:210 };
  const cta = { display:'block', width:'100%', background:'linear-gradient(135deg,#0fa7a3,#0b6f8e)', color:'#fff', padding:'14px', borderRadius:14, fontWeight:700, fontSize:15.5, border:'none', marginTop:12, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 14px 28px -12px rgba(11,111,142,.6)' };

  if (done) return (
    <main style={page}><div style={card}>
      <Logo/>
      <div style={goldRule}/>
      <div style={{fontSize:50, margin:'6px 0 6px'}}>🙏</div>
      <h2 style={{fontSize:22,fontWeight:800,color:'#0a1c26',letterSpacing:'-.02em'}}>תודה על הכנות!</h2>
      <p style={{color:'#586b74',marginTop:9,lineHeight:1.55,fontSize:15.5}}>הפידבק הגיע ישירות לעסק.<br/>נשמח לתקן ולהשתפר. 💙</p>
    </div></main>
  );

  return (
    <main style={page}><div style={card}>
      <Logo/>
      <div style={goldRule}/>
      <div style={{fontSize:38,lineHeight:1,marginBottom:6}}>{p.emoji}</div>
      <h1 style={{fontSize:23,fontWeight:800,color:'#0a1c26',letterSpacing:'-.02em'}}>{p.title}</h1>
      <p style={{color:'#586b74',marginTop:9,fontSize:16}}>{p.sub}<b style={{color:'#15242c'}}>{name}</b>?</p>

      <div style={{margin:'24px 0 4px',display:'flex',justifyContent:'center',gap:7,direction:'ltr'}} onMouseLeave={()=>setHover(0)}>
        {[1,2,3,4,5].map(n => {
          const lit = n <= (hover || rating);
          return (
            <span key={n} role="button" tabIndex={0} aria-label={`${n} כוכבים`}
              onMouseEnter={()=>setHover(n)} onClick={()=>pick(n)}
              style={{ fontSize:42, cursor:'pointer', lineHeight:1, userSelect:'none',
                       color: lit ? '#f5b50a' : '#dde5ea',
                       transform: lit ? 'scale(1.14)' : 'scale(1)',
                       transition:'transform .13s ease, color .13s ease',
                       textShadow: lit ? '0 5px 14px rgba(245,181,10,.45)' : 'none' }}>★</span>
          );
        })}
      </div>
      {rating === 0 && <p style={{fontSize:13,color:'#9bacb4',marginTop:10}}>בחרו דירוג מ‑1 עד 5 כוכבים</p>}

      {rating > 0 && rating <= 3 && (
        <div style={{marginTop:16,textAlign:'right'}}>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="ספרו לנו מה אפשר לשפר..."
            style={{width:'100%',padding:13,border:'1.5px solid #e2ecf1',borderRadius:14,fontFamily:'inherit',fontSize:15,resize:'vertical',outline:'none',background:'#fbfdfe',color:'#15242c'}} />
          <button style={{...cta, opacity: sending?0.7:1}} onClick={sendFeedback} disabled={sending}>{sending ? 'שולח…' : 'שלח פידבק פרטי'}</button>
          <p style={{fontSize:11.5,color:'#9bacb4',marginTop:12,textAlign:'center'}}>🔒 הפידבק מגיע ישירות לעסק ולא מתפרסם.</p>
        </div>
      )}
    </main>
  );
}
