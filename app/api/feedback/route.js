import { admin } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { token, rating, body } = await req.json();
  if (!token) return NextResponse.json({ error:'bad request' }, { status:400 });
  const supa = admin();
  const { data: biz } = await supa.from('businesses').select('id').eq('rating_token', token).maybeSingle();
  if (!biz) return NextResponse.json({ error:'not found' }, { status:404 });
  await supa.from('feedback').insert({ business_id: biz.id, rating: rating || null, body: body || '', status:'new' });
  await supa.from('events_log').insert({ business_id: biz.id, type:'feedback', meta:{ rating } });
  return NextResponse.json({ ok:true });
}
