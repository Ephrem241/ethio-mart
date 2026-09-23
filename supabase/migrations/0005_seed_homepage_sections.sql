insert into public.homepage_sections (section_key, content) values
('hero', jsonb_build_object(
  'headline', 'Find something you''ll love.',
  'subtext', 'Discover everyday products, special offers, and carefully selected essentials.',
  'cta_label', 'Shop Now',
  'cta_href', '/shop',
  'secondary_cta_label', 'Explore Categories',
  'secondary_cta_href', '/categories'
)),
('promo', jsonb_build_object(
  'eyebrow', 'Flash sale',
  'headline', 'Save on selected items, for a limited time',
  'subtext', 'Discounts across fashion, electronics, kitchen, and more.',
  'cta_label', 'Shop the deals',
  'cta_href', '#flash-deals'
));
