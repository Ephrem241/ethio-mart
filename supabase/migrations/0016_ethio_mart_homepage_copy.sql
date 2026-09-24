-- ---------------------------------------------------------------------------
-- Ethio Mart storefront redesign: the homepage copy the redesign shows.
--
-- Homepage text is admin-editable (Admin -> Homepage, stored in
-- homepage_sections). This moves the two seeded rows from the original wording
-- to the Ethio Mart wording, in English and Amharic — but ONLY while a row still
-- has its original seed headline. If an admin has already rewritten it, it is
-- left exactly as they wrote it.
--
--   * `\n` in the hero headline is a deliberate line break.
--   * `{maxDiscount}` in the promo headline is replaced by the storefront with
--     the biggest discount among products really on sale, so the banner can't
--     promise a discount that doesn't exist.
--   * The promo's optional `ends_at` (an ISO date-time) is NOT set here: with no
--     end date the storefront shows no countdown. Set it in Admin -> Homepage
--     to start one.
--
-- The Amharic wording is a first draft; have a native speaker review it.
-- ---------------------------------------------------------------------------

update public.homepage_sections
set content = content || jsonb_build_object(
      'headline', E'Everything You Love,\nAll in One Place.',
      'headline_am', E'የሚወዱትን ሁሉ፣\nበአንድ ቦታ።',
      'subtext', 'Discover quality products for your home, kitchen, family, and everyday life.',
      'subtext_am', 'ለቤትዎ፣ ለወጥ ቤትዎ፣ ለቤተሰብዎ እና ለዕለት ተዕለት ኑሮዎ ጥራት ያላቸው ምርቶችን ያግኙ።',
      'cta_label_am', 'አሁን ይግዙ',
      'secondary_cta_label_am', 'ምድቦችን ያስሱ'
    ),
    updated_at = now()
where section_key = 'hero'
  and content ->> 'headline' = 'Find something you''ll love.';

update public.homepage_sections
set content = content || jsonb_build_object(
      'eyebrow', 'Today''s Special Deals',
      'eyebrow_am', 'የዛሬ ልዩ ቅናሾች',
      'headline', 'Up to {maxDiscount}% Off',
      'headline_am', 'እስከ {maxDiscount}% ቅናሽ',
      'subtext', 'On selected home, kitchen, and lifestyle products.',
      'subtext_am', 'በተመረጡ የቤት፣ የወጥ ቤት እና የአኗኗር ዘይቤ ምርቶች ላይ።',
      'cta_label', 'Shop Deals',
      'cta_label_am', 'ቅናሾችን ይግዙ',
      'cta_href', '/deals'
    ),
    updated_at = now()
where section_key = 'promo'
  and content ->> 'headline' = 'Save on selected items, for a limited time';

-- The navigation now has a "Home" link (the homepage) beside the category
-- links, so the "Home" category is named for what it holds.
update public.categories
set name_en = 'Home & Living',
    name_am = 'ቤት እና አኗኗር'
where slug = 'home' and name_en = 'Home';
