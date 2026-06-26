'use client';
import { useState } from 'react';
import { browserClient } from '../../lib/supabaseBrowser';
export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  async function send(e) {
    e.preventDefault();
    const supa = browserClient();
    const { error } = await supa.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/auth/callback' } });
    if (error) setErr(error.message); else setSent(true);
  }
  const box = { maxWidth: 380, margin: '90px auto', padding: 28, background: '#fff', border: '1px solid #e2ecf1', borderRadius: 18, boxShadow: '0 14px 36px -18px rgba(10,40,52,.22)' };
  const inp = { width: '100%', padding: 13, border: '1.5px solid #e2ecf1', borderRadius: 12, fontSize: 16, fontFamily: 'inherit', marginTop: 8 };
  const btn = { width: '100%', marginTop: 14, padding: 13, border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#0fa7a3,#0b6f8e)', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' };
  return (
    <main style={box}>
      <div style={{ fontWeight: 900, fontSize: 24, letterSpacing: '-.02em', textAlign: 'center' }}>RepuCare</div>
      {sent ? (
        <p style={{ textAlign: 'center', color: '#586b74', marginTop: 16 }}>שלחנו לך קישור התחברות למייל ✉️<br />פתח אותו מאותו דפדפן.</p>
      ) : (
        <form onSubmit={send}>
          <label style={{ fontWeight: 600, fontSize: 14 }}>אימייל</label>
          <input style={inp} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.co.il" />
          <button style={btn} type="submit">שלח לי קישור התחברות</button>
          {err && <p style={{ color: '#d9534f', fontSize: 13, marginTop: 10 }}>{err}</p>}
        </form>
      )}
    </main>
  );
}
