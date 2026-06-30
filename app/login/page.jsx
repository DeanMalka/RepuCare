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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ display:'block' }}>
      <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 15.6 2 8.3 6.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 46c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 36.9 26.9 38 24 38c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C8.2 41 15.5 46 24 46z"/>
      <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.5c-.5.4 6.2-4.5 6.2-15 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentMagic, setSentMagic] = useState(false);

  const redirectTo = (typeof window !== 'undefined' ? window.location.origin : '') + '/auth/callback';
  const showGoogle = process.env.NEXT_PUBLIC_GOOGLE_AUTH === '1';

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setNote('');
    const supa = browserClient();
    if (mode === 'signup') {
      if (password.length < 6) { setBusy(false); setErr('הסיסמה חייבת לפחות 6 תווים'); return; }
      const { data, error } = await supa.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      if (error) { setBusy(false); setErr(error.message.includes('already') ? 'כבר קיים חשבון עם האימייל הזה — עבור/י להתחברות' : error.message); return; }
      if (data.session) { window.location.replace('/dashboard'); return; }
      setBusy(false); setNote('נרשמת! שלחנו מייל אימות — אשר/י אותו ואז התחבר/י עם הסיסמה.');
      return;
    }
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); setErr('אימייל או סיסמה שגויים'); return; }
    window.location.replace('/dashboard');
  }

  async function google() {
    setBusy(true); setErr(''); setNote('');
    const supa = browserClient();
    const { error } = await supa.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) { setBusy(false); setErr('כניסה עם Google אינה זמינה כרגע'); }
  }

  async function magic() {
    if (!email) { setErr('הקלד/י אימייל קודם'); return; }
    setBusy(true); setErr(''); setNote('');
    const supa = browserClient();
    const { error } = await supa.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setBusy(false);
    if (error) setErr(error.message); else setSentMagic(true);
  }

  const page = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', direction:'rtl', background:'radial-gradient(125% 125% at 50% 0%, #f4fafb 0%, #e7eff4 55%, #dde8ee 100%)' };
  const box = { width:'100%', maxWidth:400, padding:'34px 28px', background:'#fff', border:'1px solid #ebf2f6', borderRadius:24, boxShadow:'0 34px 80px -34px rgba(10,40,52,.4)' };
  const inp = { width:'100%', padding:13, border:'1.5px solid #e2ecf1', borderRadius:12, fontSize:16, fontFamily:'inherit', marginTop:6, marginBottom:12, outline:'none', background:'#fbfdfe', color:'#15242c' };
  const btn = { width:'100%', marginTop:4, padding:14, border:'none', borderRadius:14, background:'linear-gradient(135deg,#0fa7a3,#0b6f8e)', color:'#fff', fontWeight:700, fontSize:15.5, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 14px 28px -12px rgba(11,111,142,.6)' };
  const gbtn = { width:'100%', padding:12, border:'1.5px solid #e2ecf1', borderRadius:14, background:'#fff', color:'#15242c', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:9 };
  const tab = (on) => ({ flex:1, padding:'9px 0', textAlign:'center', fontWeight:700, fontSize:14.5, cursor:'pointer', borderRadius:10, background: on?'#fff':'transparent', color: on?'#0b6f8e':'#7c8b93', boxShadow: on?'0 2px 8px -3px rgba(10,40,52,.25)':'none' });

  return (
    <main style={page}><div style={box}>
      <Logo/>
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,163,90,.55),transparent)', margin:'16px auto 18px', maxWidth:200 }}/>

      <div style={{ display:'flex', gap:4, background:'#eef4f7', padding:4, borderRadius:13, marginBottom:18 }}>
        <div style={tab(mode==='login')} onClick={()=>{ setMode('login'); setErr(''); setNote(''); }}>התחברות</div>
        <div style={tab(mode==='signup')} onClick={()=>{ setMode('signup'); setErr(''); setNote(''); }}>הרשמה</div>
      </div>

      {showGoogle && (<>
      <button style={{ ...gbtn, opacity: busy?0.7:1 }} onClick={google} disabled={busy}><GoogleIcon/> המשך עם Google</button>
      <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0' }}>
        <div style={{ flex:1, height:1, background:'#eef3f6' }}/>
        <span style={{ fontSize:12, color:'#9aa9b1' }}>או</span>
        <div style={{ flex:1, height:1, background:'#eef3f6' }}/>
      </div>
      </>)}

      <form onSubmit={submit}>
        <label style={{ fontWeight:600, fontSize:14, color:'#15242c' }}>אימייל</label>
        <input style={inp} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.co.il" />
        <label style={{ fontWeight:600, fontSize:14, color:'#15242c' }}>סיסמה</label>
        <input style={inp} type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={mode==='signup' ? 'לפחות 6 תווים' : '••••••••'} />
        <button style={{ ...btn, opacity: busy?0.7:1 }} type="submit" disabled={busy}>{busy ? 'רגע…' : (mode==='signup' ? 'צור חשבון' : 'התחבר')}</button>
        {err && <p style={{ color:'#d9534f', fontSize:13, marginTop:10, textAlign:'center' }}>{err}</p>}
        {note && <p style={{ color:'#0b6f8e', fontSize:13, marginTop:10, textAlign:'center' }}>{note}</p>}
      </form>

      <div style={{ height:1, background:'#eef3f6', margin:'18px 0 12px' }}/>
      {sentMagic
        ? <p style={{ color:'#586b74', fontSize:13, textAlign:'center' }}>שלחנו קישור התחברות למייל ✉️</p>
        : <p style={{ textAlign:'center', fontSize:12.5, color:'#7c8b93' }}>
            {mode==='login' ? 'אין לך חשבון? ' : 'יש לך כבר חשבון? '}
            <span style={{ color:'#0b6f8e', cursor:'pointer', fontWeight:700 }} onClick={()=>{ setMode(mode==='login'?'signup':'login'); setErr(''); setNote(''); }}>{mode==='login' ? 'הרשמה' : 'התחברות'}</span>
            {' · '}
            <span style={{ color:'#0b6f8e', cursor:'pointer' }} onClick={magic}>קישור למייל</span>
          </p>}
    </div></main>
  );
}
