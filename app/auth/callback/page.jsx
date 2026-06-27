'use client';
import { useEffect, useState } from 'react';
import { browserClient } from '../../../lib/supabaseBrowser';

export default function AuthCallback() {
  const [msg, setMsg] = useState('מתחבר…');
  useEffect(() => {
    const supa = browserClient();
    let done = false;
    const go = () => { if (!done) { done = true; window.location.replace('/dashboard'); } };
    const { data: sub } = supa.auth.onAuthStateChange((_e, session) => { if (session) go(); });
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          await supa.auth.exchangeCodeForSession(code);
        } else if (window.location.hash && window.location.hash.includes('access_token')) {
          const h = new URLSearchParams(window.location.hash.slice(1));
          const access_token = h.get('access_token');
          const refresh_token = h.get('refresh_token');
          if (access_token && refresh_token) { await supa.auth.setSession({ access_token, refresh_token }); }
        }
      } catch (e) {}
      for (let i = 0; i < 12 && !done; i++) {
        const { data: { session } } = await supa.auth.getSession();
        if (session) { go(); return; }
        await new Promise(r => setTimeout(r, 350));
      }
      if (!done) { setMsg('ההתחברות לא הושלמה. מעביר לכניסה מחדש…'); setTimeout(() => window.location.replace('/login'), 1500); }
    })();
    return () => { try { sub.subscription.unsubscribe(); } catch (e) {} };
  }, []);
  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl', fontFamily:'inherit', color:'#586b74', background:'#eef4f8' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:26, fontWeight:800, color:'#0b6f8e' }}>RepuCare</div>
        <p style={{ marginTop:10, fontSize:15 }}>{msg}</p>
      </div>
    </main>
  );
}
