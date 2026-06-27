'use client';
import { useEffect, useState } from 'react';
import { browserClient } from '../../../lib/supabaseBrowser';

export default function AuthCallback() {
  const [msg, setMsg] = useState('מתחבר…');
useEffect(() => {
const supa = browserClient();
(async () => {
try {
const code = new URL(window.location.href).searchParams.get('code');
if (code) {
const { error } = await supa.auth.exchangeCodeForSession(code);
if (error) throw error;
}
const { data: { session } } = await supa.auth.getSession();
if (session) { window.location.replace('/dashboard'); return; }
setMsg('ההתחברות לא הושלמה. מעביר לכניסה מחדש…');
setTimeout(() => window.location.replace('/login'), 1800);
} catch (e) {
setMsg('שגיאת התחברות. מעביר לכניסה מחדש…');
setTimeout(() => window.location.replace('/login'), 2200);
}
})();
}, []);
return (
  <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl', fontFamily:'inherit', color:'#586b74', background:'#eef4f8' }}>
  <div style={{ textAlign:'center' }}>
  <div style={{ fontSize:34 }}>RepuCare</div>
  <p style={{ marginTop:10, fontSize:15 }}>{msg}</p>
  </div>
  </main>
  );
}
