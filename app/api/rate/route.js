import { admin } from '../../../lib/supabase';
import { resolveRatingTarget } from '../../../lib/ratingTarget';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { token, rating } = await req.json();
  if (!token || !rating) return NextResponse.json({ error:'bad request' }, { status:400 });
  const supa = admin();
  const t = await resolveRatingTarget(supa, token);
  if (!t) return NextResponse.json({ error:'not found' }, { status:404 });
  await supa.from('events_log').insert({ business_id: t.businessId, branch_id: t.branchId, type:'rating', meta:{ rating } });
  return NextResponse.json({ ok:true, redirect: rating >= 4 ? t.google : null });
}
