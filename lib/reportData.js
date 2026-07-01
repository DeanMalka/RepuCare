// Gathers a per-target (business OR branch) reputation snapshot for the report.
// Uses the auth-aware client → RLS guarantees owner-scoping automatically.

const SURVEY_Q = [
  ['q_service', 'שירות'],
  ['q_staff', 'יחס הצוות'],
  ['q_value', 'מחיר מול תמורה'],
  ['q_timeliness', 'מהירות / זמנים'],
];

export async function gatherReportData(supa, { branchId } = {}) {
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { error: 'unauth' };
  const { data: biz } = await supa.from('businesses').select('*').eq('owner_id', user.id).maybeSingle();
  if (!biz) return { error: 'no_business' };

  let target = biz, title = biz.name, city = biz.city;
  if (branchId) {
    const { data: br } = await supa.from('branches').select('*').eq('id', branchId).eq('business_id', biz.id).maybeSingle();
    if (!br) return { error: 'no_branch' };
    target = br; title = br.name; city = br.city;
  }

  // Survey + private-feedback scoped to this target (branch_id null = main business).
  let fbQ = supa.from('feedback').select('rating,q_service,q_staff,q_value,q_timeliness,status').eq('business_id', biz.id);
  fbQ = branchId ? fbQ.eq('branch_id', branchId) : fbQ.is('branch_id', null);
  const { data: feedback } = await fbQ;

  let rqQ = supa.from('review_requests').select('id').eq('business_id', biz.id);
  rqQ = branchId ? rqQ.eq('branch_id', branchId) : rqQ.is('branch_id', null);
  const { data: requests } = await rqQ;

  let evQ = supa.from('events_log').select('type,meta').eq('business_id', biz.id).eq('type', 'rating').limit(2000);
  evQ = branchId ? evQ.eq('branch_id', branchId) : evQ.is('branch_id', null);
  const { data: events } = await evQ;

  const fb = feedback || [];
  const avg = (k) => { const v = fb.map((f) => f[k]).filter((n) => typeof n === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const survey = SURVEY_Q.map(([k, label]) => ({ label, avg: avg(k) }));

  const ratingEvents = (events || []).map((e) => Number(e.meta && e.meta.rating)).filter((n) => n >= 1 && n <= 5);
  const fbRatings = fb.map((f) => f.rating).filter((n) => typeof n === 'number' && n >= 1 && n <= 5);
  const all = [...ratingEvents, ...fbRatings];

  const baseline = target.google_reviews_baseline_count;
  const count = target.google_reviews_count;
  const added = (baseline != null && count != null) ? Math.max(0, count - baseline) : null;

  return {
    title, city,
    generatedAt: new Date().toISOString(),
    google: {
      rating: target.google_rating != null ? Number(target.google_rating) : null,
      count: count != null ? Number(count) : null,
      added,
      baselineAt: target.google_baseline_at || null,
    },
    survey,
    reviews: Array.isArray(target.google_reviews) ? target.google_reviews : [],
    collected: {
      requestsSent: (requests || []).length,
      caughtPrivate: fb.length,
      avgRating: all.length ? all.reduce((a, b) => a + b, 0) / all.length : null,
      conversion: (requests || []).length ? Math.round((ratingEvents.length / (requests || []).length) * 100) : null,
    },
  };
}
