// Resolve a public /r/[token] rating link to either a business or one of its
// branches. Branches own their own rating_token so survey + private feedback
// attribute to the specific location. Pass any Supabase client (admin in the
// public routes). Returns null if the token matches nothing.
export async function resolveRatingTarget(supa, token) {
  if (!token) return null;

  const { data: biz } = await supa
    .from('businesses')
    .select('id, name, business_type, google_review_url')
    .eq('rating_token', token).maybeSingle();
  if (biz) {
    return {
      businessId: biz.id, branchId: null,
      name: biz.name, type: biz.business_type || 'dental',
      google: biz.google_review_url || null,
    };
  }

  const { data: br } = await supa
    .from('branches')
    .select('id, business_id, name, google_review_url')
    .eq('rating_token', token).maybeSingle();
  if (br) {
    const { data: parent } = await supa
      .from('businesses')
      .select('business_type, google_review_url')
      .eq('id', br.business_id).maybeSingle();
    return {
      businessId: br.business_id, branchId: br.id,
      name: br.name, type: (parent && parent.business_type) || 'dental',
      google: br.google_review_url || (parent && parent.google_review_url) || null,
    };
  }

  return null;
}
