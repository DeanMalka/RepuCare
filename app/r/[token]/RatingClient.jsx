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

export default function RatingClient({ token, name, type, google }) {
  const [rating, setRating] = useState(0);
  const [done, setDone] = useState(false);
  const [body, setBody] = useState('');
  const p = TYPES[type] || TYPES.dental;

  async function pick(n) {
    setRating(n);
    if (n >= 4) {
      try { await fetch('/api/rate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, rating:n }) }); } catch(e){}
      window.location.href = google;
    }
  }
  async function sendFeedback() {
    try {
      await fetch('/api/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, rating, body }) });
    } catch(e){}
    setDone(true);
  }

  const wrap = { maxWidth:380, margin:'0 auto', padding:'40px 22px', textAlign:'center' };
  const star = (lit) => ({ fontSize:38, cursor:'pointer', color: lit ? 'var(--star)' : '#d8e0e4', transition:'.15s' });
  const cta = { display:'block', width:'100%', background:'linear-gradient(135deg,var(--tl),var(--tl-d))', color:'#fff', padding:13, borderRadius:12, fontWeight:600, fontSize:15, border:'none', marginTop:10, cursor:'pointer', fontFamily:'inherit' };

  if (done) return (
    <main style={wrap}><div style={{fontSize:40}}>🙏</div><h2 style={{marginTop:10}}>תודה על הכנות!</h2><p style={{color:'var(--muted)',marginTop:6}}>הפידבק הגיע ישירות לעסק. נשמח לתקן ולהשתפר.</p></main>
  );

  return (
    <main style={wrap}>
      <div style={{fontWeight:800,fontSize:22,letterSpacing:'-.02em',marginBottom:14}}>RepuCare</div>
      <h2 style={{fontSize:20,fontWeight:800}}>{p.title} {p.emoji}</h2>
      <p style={{color:'var(--muted)',marginTop:6}}>{p.sub}{name}?</p>
      <div style={{margin:'20px 0',letterSpacing:6}}>
        {[1,2,3,4,5].map(n => (
          <span key={n} style={star(n <= rating)} onClick={() => pick(n)} role="button" aria-label={`${n} כוכבים`}>★</span>
        ))}
      </div>
      {rating > 0 && rating <= 3 && (
        <div>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="ספרו לנו מה אפשר לשפר..."
            style={{width:'100%',padding:12,border:'1.5px solid #e2ecf1',borderRadius:12,fontFamily:'inherit',fontSize:15}} />
          <button style={cta} onClick={sendFeedback}>שלח פידבק פרטי</button>
          <p style={{fontSize:11,color:'var(--muted)',marginTop:10}}>הפידבק מגיע ישירות לעסק ולא מתפרסם.</p>
        </div>
      )}
    </main>
  );
}
