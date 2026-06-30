import { serverClient } from '../../../lib/supabaseServer';
import { NextResponse } from 'next/server';
export async function POST(req) {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const b = await req.json();
  await supa.from('profiles').upsert({ id: user.id, email: user.email });
  const { data, error } = await supa.from('businesses')
    .insert({ owner_id: user.id, name: b.name, city: b.city || null, business_type: b.business_type || 'dental', google_review_url: b.google_review_url || null })
    .select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, business: data });
}
export async function PATCH(req) {
  const supa = serverClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const b = await req.json();
  if (b.markFeedback) {
    const { data: biz } = await supa.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
    if (!biz) return NextResponse.json({ error: 'no business' }, { status: 400 });
    const { error } = await supa.from('feedback').update({ status: 'handled' }).eq('id', b.markFeedback).eq('business_id', biz.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const patch = {};
  ['name','city','business_type','google_review_url','google_place_id','message_template','channels','pro_url','pro_consent'].forEach(k => { if (b[k] !== undefined) patch[k] = b[k]; });
  const { error } = await supa.from('businesses').update(patch).eq('owner_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
