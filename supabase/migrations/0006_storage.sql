insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('products',   'products',   true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('categories', 'categories', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('banners',    'banners',    true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('avatars',    'avatars',    false, 2097152, array['image/jpeg','image/png','image/webp']);

-- public buckets: public read, admin-only write
create policy "products_bucket_public_read" on storage.objects
  for select using (bucket_id = 'products');
create policy "products_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'products' and public.is_admin());
create policy "products_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'products' and public.is_admin());
create policy "products_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'products' and public.is_admin());

create policy "categories_bucket_public_read" on storage.objects
  for select using (bucket_id = 'categories');
create policy "categories_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'categories' and public.is_admin());
create policy "categories_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'categories' and public.is_admin());
create policy "categories_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'categories' and public.is_admin());

create policy "banners_bucket_public_read" on storage.objects
  for select using (bucket_id = 'banners');
create policy "banners_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'banners' and public.is_admin());
create policy "banners_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'banners' and public.is_admin());
create policy "banners_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'banners' and public.is_admin());

-- avatars: private, per-user folder ({user_id}/...), admin can read all
create policy "avatars_read_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
create policy "avatars_write_own" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
