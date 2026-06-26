import { admin } from '../../../lib/supabase';
import { notFound } from 'next/navigation';
import RatingClient from './RatingClient';

export const dynamic = 'force-dynamic';

export default async function RatingPage({ params }) {
  const supa = admin();
  const { data: biz } = await supa
    .from('businesses')
    .select('id,name,business_type,google_review_url')
    .eq('rating_token', params.token)
    .maybeSingle();
  if (!biz) notFound();
  return (
    <RatingClient
      token={params.token}
      name={biz.name}
      type={biz.business_type || 'dental'}
      google={biz.google_review_url || '#'}
    />
  );
}
