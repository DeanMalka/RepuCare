import { createClient } from '@supabase/supabase-js';
// SERVER-ONLY admin client (service role bypasses RLS). Never import into client components.
export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
