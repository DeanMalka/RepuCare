import { serverClient } from '../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Branches = independent Google locations under one paying business.
// All queries run through the auth-aware client, so RLS guarantees the owner
// can only ever touch branches under their own business.

async function ownerBiz(supa) {
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { error: 'unauth', status: 401 };
  const { data: biz } = await supa.from('businesses').select('id, name').eq('owner_id', user.id).maybeSingle();
  if (!biz) return { error: 'no_business', status: 400 };
  return { user, biz };
}

const FIELDS = ['name', 'city', 'address', 'google_review_url', 'pro_url', 'pro_consent'];
function pick(b) {
  const out = {};
  FIELDS.forEach((k) => { if (b[k] !== undefined) out[k] = b[k]; });
  return out;
}

// List
export async function GET() {
  const supa = serverClient();
  const ctx = await ownerBiz(supa);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { data, error } = await supa.from('branches')
    .select('*').eq('business_id', ctx.biz.id).order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, branches: data || [] });
}

// Create
export async function POST(req) {
  const supa = serverClient();
  const ctx = await ownerBiz(supa);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim().slice(0, 160);
  if (!name) return NextResponse.json({ error: 'missing_name' }, { status: 400 });
  const row = { ...pick(b), name, business_id: ctx.biz.id };
  const { data, error } = await supa.from('branches').insert(row).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, branch: data });
}

// Update
export async function PATCH(req) {
  const supa = serverClient();
  const ctx = await ownerBiz(supa);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  const patch = pick(b);
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  const { error } = await supa.from('branches').update(patch).eq('id', b.id).eq('business_id', ctx.biz.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// Delete
export async function DELETE(req) {
  const supa = serverClient();
  const ctx = await ownerBiz(supa);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  const { error } = await supa.from('branches').delete().eq('id', b.id).eq('business_id', ctx.biz.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
