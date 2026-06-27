'use client';
import { useState } from 'react';
import { browserClient } from '../../lib/supabaseBrowser';

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
      <svg width="38" height="38" viewBox="0 0 120 120" aria-hidden="true" style={{ display:'block', filter:'drop-shadow(0 6px 14px rgba(11,111,142,.3))' }}>
        <defs><linearGradient id="rcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#62d7d2"/><stop offset="1" stopColor="#0b6f8e"/></linearGradient></defs>
        <rect x="8" y="8" width="104" height="104" rx="28" fill="url(#rcg)"/>
        <circle cx="57" cy="55" r="29" fill="#fff"/>
        <path d="M40 74 L34 93 L58 79 Z" fill="#fff"/>
        <path d="M57 69c-9-6-17-11-17-19 0-5 4-8 8-8 4 0 7 2 9 6 2-4 5-6 9-6 4 0 8 3 8 8 0 8-8 13-17 19z" fill="#0b6f8e"/>
        <path d="M95 20 l3 9 9 3 -9 3 -3 9 -3-9 -9-3 9-3 z" fill="#fff"/>
      </svg>
      <span style={{ fontWeight:800, fontSize:25, letterSpacing:'-.03em' }}><span style={{ color:'#0b6f8e' }}>Repu</span><span style={{ color:'#0fa7a3' }}>Care</span></span>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function send(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const supa = browserClient();
    const { error } = await supa.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/auth/callback' } });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }
  const page = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', direction:'rtl', background:'radial-gradient(125% 125% at 50% 0%, #f4fafb 0%, #e7eff4 55%, #dde8ee 100%)' };
  const box = { width:'100%', maxWidth:400, padding:'34px 28px', background:'#fff', border:'1px solid #ebf2f6', borderRadius:24, boxShadow:'0 34px 80px -34px rgba(10,40,52,.4)' };
  const inp = { width:'100%', padding:13, border:'1.5px solid #e2ecf1', borderRadius:12, fontSize:16, fontFamily:'inherit', marginTop:8, outline:'none', background:'#fbfdfe', color:'#15242c' };
  const btn = { width:'100%', marginTop:14, padding:14, border:'none', borderRadius:14, background:'linear-gradient(135deg,#0fa7a3,#0b6f8e)', color:'#fff', fontWeight:700, fontSize:15.5, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 14px 28px -12px rgba(11,111,142,.6)' };
  return (
    <main style={page}><div style={box}>
      <Logo/>
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.55),transparent)', margin:'16px auto 18px', maxWidth:200 }}/>
      {sent ? (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:42 }}>✉️</div>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0a1c26', marginTop:8 }}>שלחנו לך קישור התחברות</h2>
          <p style={{ color:'#586b74', marginTop:8, lineHeight:1.55 }}>בדוק את המייל ({email}) ופתח את הקישור מאותו דפדפן.<br/>לא רואה? בדוק גם בתיקיית הספאם.</p>
        </div>
      ) : (
        <form onSubmit={send}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0a1c26', textAlign:'center', marginBottom:4 }}>כניסה לאזור האישי</h2>
          <p style={{ color:'#586b74', fontSize:13.5, textAlign:'center', marginBottom:16 }}>נשלח לך קישור התחברות חד-פעמי למייל</p>
          <label style={{ fontWeight:600, fontSize:14, color:'#15242c' }}>אימייל</label>
          <input style={inp} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.co.il" />
          <button style={{ ...btn, opacity: busy?0.7:1 }} type="submit" disabled={busy}>{busy ? 'שולח…' : 'שלח לי קישור התחברות'}</button>
          {err && <p style={{ color:'#d9534f', fontSize:13, marginTop:10, textAlign:'center' }}>{err}</p>}
        </form>
      )}
    </div></main>
  );
}
