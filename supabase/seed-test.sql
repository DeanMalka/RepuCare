-- RepuCare — seed for testing the public rating page (/r/[token]).
-- STEP 1: Supabase → Authentication → Users → Add user (email+password). Copy the user UID.
-- STEP 2: replace <USER_UID> below (2 places) with that UID, then Run.
insert into profiles (id, email, full_name)
values ('<USER_UID>', 'owner@example.com', 'בעל עסק לדוגמה')
on conflict (id) do nothing;

insert into businesses (owner_id, name, city, business_type, google_review_url, rating_token)
values ('<USER_UID>', 'מספרת דניאל (דמו)', 'קרית מוצקין', 'salon',
        'https://www.google.com/maps/search/?api=1&query=Daniel+Salon+Kiryat+Motzkin',
        '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

-- STEP 3: visit  /r/11111111-1111-1111-1111-111111111111
-- 4-5★ → redirects to google_review_url · 1-3★ → feedback saved (check the 'feedback' table).
