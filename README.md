# RepuCare — Backend (Next.js + Supabase + Stripe)

מסלול א' (קוד מלא, רב-לקוחות). זה ה-scaffold; הקוד של ה-App נבנה בשלבים (ראו Roadmap).

## 🔴 אבטחה — לפני הכל
- **סובב את ה-Secret Key של Stripe** ששותף בצ'אט (Dashboard → Developers → API keys → Roll). אל תשתמש בו עד שתסובב.
- כל מפתח `sk_`/`service_role` נשמר רק ב-`.env.local` (לא נכנס ל-Git). `.gitignore` כבר אמור לכלול `.env*`.
- מפתחות `pk_`/`anon` ציבוריים ומותר לחשוף.

## הסטאק
- **Frontend/Backend:** Next.js (App Router) על Vercel
- **DB + Auth:** Supabase (Postgres + RLS + Auth magic-link)
- **תשלומים:** Stripe Checkout (מנוי ₪349/ח׳ + 45 יום trial) + Webhook
- **מייל (שלב 2):** Resend
- **אוטומציה (שלב 2):** Make/n8n לשליחת בקשות

## ארכיטקטורה
```
לקוח-קצה ← /r/[token] (דף דירוג ציבורי, server-side, service-role)
        4–5★ ← redirect ל-Google review · 1–3★ ← feedback פרטי ל-DB
בעל עסק ← Login (magic link) ← Dashboard ← בקשות/ביקורות/פידבק/דוחות/הגדרות
Stripe Checkout ← webhook ← טבלת subscriptions (service-role)
```

## התקנה (סדר הרצה)
1. **Supabase:** צור פרויקט → SQL Editor → הרץ `supabase/schema.sql`.
2. **Stripe:** צור Product "RepuCare" → Price חוזר **₪349/חודש**, עם **trial_period_days = 45**. שמור את `price_id`.
3. **Env:** העתק `.env.example` ל-`.env.local` ומלא ערכים (Supabase URL/anon/service, Stripe pk/sk/price, webhook secret).
4. **קוד האפליקציה:** ייבנה בצ'אט (ראו Roadmap) — תדביק לריפו שחיברת.
5. **Vercel:** חבר את הריפו, הגדר את אותם env vars, פרוס.
6. **Webhook:** ב-Stripe → Developers → Webhooks → endpoint `https://<app>/api/webhooks/stripe` → אירועים: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Roadmap (סדר בנייה)
- [x] סכמת DB + RLS (`supabase/schema.sql`)
- [x] `.env.example`
- [ ] שלד Next.js (package.json, layout, lib/supabase, lib/stripe)
- [ ] דף דירוג ציבורי `/r/[token]` + API (`/api/rate`, `/api/feedback`) — הליבה
- [ ] Auth (magic link) + Dashboard (העברת ה-UI שכבר עיצבנו ל-React)
- [ ] Stripe Checkout (`/api/checkout`) + Webhook (`/api/webhooks/stripe`)
- [ ] שליחת בקשות (ידני/CSV) + מייל (Resend) — שלב 2

## מודל נתונים (תמצית)
profiles · businesses(business_type, rating_token) · review_requests(token,status) · feedback · reviews_tracked · subscriptions · events_log. כולן RLS owner-scoped; דף הדירוג והוובהוקים עובדים עם service-role בצד שרת בלבד.
