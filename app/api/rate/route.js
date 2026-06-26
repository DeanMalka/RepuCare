import { admin } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { token, rating } = await req.json();
  if (!token || !rating) return NextResponse.json({ error:'bad request' }, { status:400 });
  const supa = admin();
  const { data: biz } = await supa.from('businesses').select('id,google_review_url').eq('rating_token', token).maybeSingle();
  if (!biz) return NextResponse.json({ error:'not found' }, { status:404 });
  await supa.from('events_log').insert({ business_id: biz.id, type:'rating', meta:{ rating } });
  return NextResponse.json({ ok:true, redirect: rating >= 4 ? biz.google_review_url : null });
}
