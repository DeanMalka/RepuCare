// Best-effort in-memory rate limiter for RepuCare API routes.
// Serverless instances don't share memory, so treat this as a lightweight guard
// against bursts/abuse — the real protection is Supabase Auth + RLS.
const hits = new Map();

// Extract the caller IP from a Next.js Request (works behind Vercel's proxy).
export function clientIp(req) {
  try {
    const h = req && req.headers;
    if (!h) return 'unknown';
    const get = (k) => (typeof h.get === 'function' ? h.get(k) : h[k]) || '';
    const xff = get('x-forwarded-for');
    if (xff) return String(xff).split(',')[0].trim();
    return get('x-real-ip') || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

// Returns true if this key is still under `max` requests within `windowSec`.
export async function rateLimit(key, max = 20, windowSec = 60) {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const rec = hits.get(key);
  if (!rec || now - rec.start >= windowMs) {
    hits.set(key, { start: now, count: 1 });
    if (hits.size > 5000) { for (const [k, v] of hits) { if (now - v.start >= windowMs) hits.delete(k); } }
    return true;
  }
  if (rec.count >= max) return false;
  rec.count += 1;
  return true;
}
