import { serverClient } from '../../lib/supabaseServer';
import { admin } from '../../lib/supabase';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
export const dynamic = 'force-dynamic';

// Who may see the "leads" panel (RepuCare's own sales prospects from the landing page).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export default async function Dashboard() {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');
  const isAdmin = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const { data: biz } = await supa.from('businesses').select('*').eq('owner_id', user.id).maybeSingle();
  let feedback = [], requests = [], sub = null, leads = [], reviews = [], events = [], customers = [];
  if (biz) {
    const a = admin();
    feedback = (await a.from('feedback').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(50)).data || [];
    requests = (await a.from('review_requests').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(50)).data || [];
    reviews  = (await a.from('reviews_tracked').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(20)).data || [];
    events   = (await a.from('events_log').select('type,meta,created_at').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(500)).data || [];
    sub = (await a.from('subscriptions').select('*').eq('business_id', biz.id).maybeSingle()).data || null;
    customers = (await a.from('customers').select('*').eq('business_id', biz.id).order('last_seen', { ascending: false, nullsFirst: false }).limit(1000)).data || [];
    // Leads belong to RepuCare (you), not to the customer's tenant — admin-only.
    leads = isAdmin
      ? ((await a.from('leads').select('*').order('created_at', { ascending: false }).limit(200)).data || [])
      : [];
  }
  return <DashboardClient
    email={user.email}
    isAdmin={isAdmin}
    business={biz}
    feedback={feedback}
    requests={requests}
    reviews={reviews}
    events={events}
    sub={sub}
    leads={leads}
    customers={customers}
    appUrl={process.env.NEXT_PUBLIC_APP_URL || ''}
  />;
}
