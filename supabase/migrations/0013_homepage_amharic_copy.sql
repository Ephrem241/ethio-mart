-- ---------------------------------------------------------------------------
-- Phase 13 (Localization): the homepage hero and promo banner are editable
-- text stored as JSON in homepage_sections. Each visible text now has an
-- Amharic sibling key (`headline` -> `headline_am`, and so on); a missing or
-- empty Amharic value falls back to the English one in the storefront.
--
-- This gives the two seeded rows their Amharic copy. It is a plain data
-- update (no schema change) and it NEVER overwrites something an admin
-- already wrote: in `new || existing` the right-hand operand wins, so any
-- non-empty `*_am` value already present is kept. Empty-string `*_am` values
-- count as "not written" and are dropped first, so they don't block the
-- defaults from being filled in.
--
-- The Amharic wording is a first draft — have a native speaker review it
-- (the admin can edit every line under /admin/homepage without a migration).
-- ---------------------------------------------------------------------------

update public.homepage_sections hs
set content = jsonb_build_object(
  'headline_am', 'የሚወዱትን ያግኙ።',
  'subtext_am', 'የዕለት ተዕለት ምርቶችን፣ ልዩ ቅናሾችን እና በጥንቃቄ የተመረጡ አስፈላጊ ዕቃዎችን ያግኙ።',
  'cta_label_am', 'አሁን ይግዙ',
  'secondary_cta_label_am', 'ምድቦችን ያስሱ'
) || coalesce(
  (select jsonb_object_agg(e.key, e.value)
   from jsonb_each(hs.content) e
   where not (e.key like '%\_am' and e.value = '""'::jsonb)),
  '{}'::jsonb
)
where hs.section_key = 'hero';

update public.homepage_sections hs
set content = jsonb_build_object(
  'eyebrow_am', 'ፈጣን ቅናሽ',
  'headline_am', 'በተመረጡ ምርቶች ላይ ይቆጥቡ፣ ለተወሰነ ጊዜ ብቻ',
  'subtext_am', 'በፋሽን፣ በኤሌክትሮኒክስ፣ በወጥ ቤት ዕቃዎች እና በሌሎችም ላይ ቅናሾች።',
  'cta_label_am', 'ቅናሾችን ይመልከቱ'
) || coalesce(
  (select jsonb_object_agg(e.key, e.value)
   from jsonb_each(hs.content) e
   where not (e.key like '%\_am' and e.value = '""'::jsonb)),
  '{}'::jsonb
)
where hs.section_key = 'promo';
