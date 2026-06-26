import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Auth-aware server client (respects RLS via the user's session cookies).
export function serverClient() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return store.getAll(); },
        setAll(list) { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch (e) {} },
      },
    }
  );
}
