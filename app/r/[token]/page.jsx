import { admin } from '../../../lib/supabase';
import { resolveRatingTarget } from '../../../lib/ratingTarget';
import { notFound } from 'next/navigation';
import RatingClient from './RatingClient';

export const dynamic = 'force-dynamic';

export default async function RatingPage({ params }) {
  const supa = admin();
  const t = await resolveRatingTarget(supa, params.token);
  if (!t) notFound();
  return (
    <RatingClient
      token={params.token}
      name={t.name}
      type={t.type || 'dental'}
      google={t.google || '#'}
    />
  );
}
