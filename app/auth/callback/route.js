import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const store = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return store.getAll(); }, setAll(list) { list.forEach(({ name, value, options }) => store.set(name, value, options)); } } }
  );
  if (code) await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(url.origin + '/dashboard');
}
