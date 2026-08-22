-- Молочные Традиции: структура базы и правила безопасности.
-- Выполните файл целиком в Supabase → SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  price numeric(12, 2),
  old_price numeric(12, 2),
  unit text,
  category_id text not null references public.categories(id),
  availability text not null default 'in_stock'
    check (availability in ('in_stock', 'out_of_stock', 'coming_soon')),
  badge text not null default 'none'
    check (badge in ('none', 'promo', 'price_down', 'price_up', 'new')),
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.admin_mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when exists (
      select 1 from auth.mfa_factors
      where user_id = (select auth.uid()) and status = 'verified'
    )
    then coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
    else true
  end;
$$;

create or replace function public.can_admin_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select public.is_admin()) and (select public.admin_mfa_satisfied());
$$;

revoke all on function public.admin_mfa_satisfied() from public;
revoke all on function public.can_admin_write() from public;
grant execute on function public.admin_mfa_satisfied() to authenticated;
grant execute on function public.can_admin_write() to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Категории видны всем" on public.categories;
create policy "Категории видны всем"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Администратор управляет категориями" on public.categories;
create policy "Администратор управляет категориями"
on public.categories for all
to authenticated
using ((select public.can_admin_write()))
with check ((select public.can_admin_write()));

drop policy if exists "Опубликованные товары видны всем" on public.products;
create policy "Опубликованные товары видны всем"
on public.products for select
to anon, authenticated
using (published or (select public.is_admin()));

drop policy if exists "Администратор добавляет товары" on public.products;
create policy "Администратор добавляет товары"
on public.products for insert
to authenticated
with check ((select public.can_admin_write()));

drop policy if exists "Администратор изменяет товары" on public.products;
create policy "Администратор изменяет товары"
on public.products for update
to authenticated
using ((select public.can_admin_write()))
with check ((select public.can_admin_write()));

drop policy if exists "Администратор удаляет товары" on public.products;
create policy "Администратор удаляет товары"
on public.products for delete
to authenticated
using ((select public.can_admin_write()));

drop policy if exists "Фото опубликованных товаров видны всем" on public.product_images;
create policy "Фото опубликованных товаров видны всем"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and (products.published or (select public.is_admin()))
  )
);

drop policy if exists "Администратор добавляет фото" on public.product_images;
create policy "Администратор добавляет фото"
on public.product_images for insert
to authenticated
with check ((select public.can_admin_write()));

drop policy if exists "Администратор изменяет фото" on public.product_images;
create policy "Администратор изменяет фото"
on public.product_images for update
to authenticated
using ((select public.can_admin_write()))
with check ((select public.can_admin_write()));

drop policy if exists "Администратор удаляет фото" on public.product_images;
create policy "Администратор удаляет фото"
on public.product_images for delete
to authenticated
using ((select public.can_admin_write()));

drop policy if exists "Администратор видит свой доступ" on public.admin_users;
create policy "Администратор видит свой доступ"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images to anon;
grant select, insert, update, delete on public.categories, public.products, public.product_images to authenticated;
grant select on public.admin_users to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Фото товаров доступны публично" on storage.objects;
create policy "Фото товаров доступны публично"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Администратор загружает фото товаров" on storage.objects;
create policy "Администратор загружает фото товаров"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and (select public.can_admin_write()));

drop policy if exists "Администратор изменяет фото товаров" on storage.objects;
create policy "Администратор изменяет фото товаров"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and (select public.can_admin_write()))
with check (bucket_id = 'product-images' and (select public.can_admin_write()));

drop policy if exists "Администратор удаляет фото товаров" on storage.objects;
create policy "Администратор удаляет фото товаров"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and (select public.can_admin_write()));

-- После создания пользователя в Authentication → Users выполните отдельно:
-- insert into public.admin_users (user_id) values ('UUID-ПОЛЬЗОВАТЕЛЯ');
