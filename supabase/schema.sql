-- Economic Policy Lab member/article schema
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  excerpt text,
  content text not null,
  category text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','pending','published','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists articles_author_id_idx on public.articles(author_id);
create index if not exists articles_status_idx on public.articles(status);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.articles enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "published_articles_public_read" on public.articles;
create policy "published_articles_public_read" on public.articles for select to anon, authenticated using (status = 'published');

drop policy if exists "members_read_own_articles" on public.articles;
create policy "members_read_own_articles" on public.articles for select to authenticated using (author_id = auth.uid());

drop policy if exists "members_insert_own_articles" on public.articles;
create policy "members_insert_own_articles" on public.articles for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "members_update_own_articles" on public.articles;
create policy "members_update_own_articles" on public.articles for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "members_delete_own_articles" on public.articles;
create policy "members_delete_own_articles" on public.articles for delete to authenticated using (author_id = auth.uid());

drop policy if exists "admins_manage_articles" on public.articles;
create policy "admins_manage_articles" on public.articles for all to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
