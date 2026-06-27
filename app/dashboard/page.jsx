import { serverClient } from '../../lib/supabaseServer';
import { admin } from '../../lib/supabase';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');
  const { data: biz } = await supa.from('businesses').select('*').eq('owner_id', user.id).maybeSingle();
  let feedback = [], requests = [], sub = null, leads = [];
  if (biz) {
    const a = admin();
    feedback = (await a.from('feedback').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(30)).data || [];
    requests = (await a.from('review_requests').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(30)).data || [];
    sub = (await a.from('subscriptions').select('*').eq('business_id', biz.id).maybeSingle()).data || null;
    leads = (await a.from('leads').select('*').order('created_at', { ascending: false }).limit(100)).data || [];
  }
  return <DashboardClient email={user.email} business={biz} feedback={feedback} requests={requests} sub={sub} leads={leads} appUrl={process.env.NEXT_PUBLIC_APP_URL || ''} />;
}
