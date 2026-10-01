-- ---------------------------------------------------------------------------
-- 0021: new delivery pricing (the owner's decision, 2026-10-01).
--
-- - Free delivery for orders over 5,000 ETB (was 2,000). "Over" means strictly
--   above, as place_order applies it (0014): 5,000 exactly still pays.
-- - Delivery costs 700 ETB to every city, and to "Other" places (was 100–250
--   depending on the city).
--
-- The checkout, the cart, the product page, the announcement bar and the
-- Delivery page all read these two settings, so nothing else changes.
-- Previous values, for reference: threshold 2000; Addis Ababa 100, Adama 150,
-- Other 150, Bahir Dar / Dire Dawa / Gondar / Hawassa / Jimma 200, Mekelle 250.
-- ---------------------------------------------------------------------------

update public.store_settings
set value = '5000'::jsonb
where key = 'free_delivery_threshold';

update public.delivery_fees
set fee = 700
where city in ('Addis Ababa', 'Adama', 'Bahir Dar', 'Hawassa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Jimma', 'Other');
