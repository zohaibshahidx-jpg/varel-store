-- Reference schema applied to the VAREL Supabase project. Run via a controlled migration.
create table public.orders (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict, status text not null default 'pending' check (status in ('pending','paid','expired','failed')), currency text not null check (currency = 'usd'), subtotal_cents integer not null check (subtotal_cents > 0), items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50), stripe_session_id text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), paid_at timestamptz);
create index orders_user_created_idx on public.orders (user_id, created_at desc);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
create policy "Customers read their orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
