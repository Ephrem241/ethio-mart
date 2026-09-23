-- gen_random_uuid() is available by default on Supabase Postgres (pgcrypto),
-- but ensure it explicitly for portability.
create extension if not exists pgcrypto;

create type user_role as enum ('customer', 'admin');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');
create type payment_method as enum ('cod', 'manual');
create type payment_status as enum ('pending', 'paid', 'failed');
