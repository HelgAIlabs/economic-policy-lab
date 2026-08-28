-- Economic Policy Lab member/article/research schema
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  content_type text not null default 'article' check (content_type in ('article','research')),
  title text not null,
  excerpt text,
  content text not null,
  category text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','pending','published','rejected','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.articles add column if not exists author_name text;
alter table public.articles add column if not exists content_type text not null default 'article';
alter table public.articles alter column author_id drop not null;
alter table public.articles drop constraint if exists articles_content_type_check;
alter table public.articles add constraint articles_content_type_check check (content_type in ('article','research'));
alter table public.articles drop constraint if exists articles_status_check;
alter table public.articles add constraint articles_status_check check (status in ('draft','pending','published','rejected','archived'));
create index if not exists articles_author_id_idx on public.articles(author_id);
create index if not exists articles_status_idx on public.articles(status);
create index if not exists articles_content_type_idx on public.articles(content_type);
create index if not exists articles_content_type_status_idx on public.articles(content_type,status);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "published_articles_public_read" on public.articles;
create policy "published_articles_public_read" on public.articles for select to anon, authenticated using (status = 'published');
drop policy if exists "members_read_own_articles" on public.articles;
create policy "members_read_own_articles" on public.articles for select to authenticated using (author_id = (select auth.uid()));
drop policy if exists "members_insert_own_articles" on public.articles;
create policy "members_insert_own_articles" on public.articles for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "members_update_own_articles" on public.articles;
create policy "members_update_own_articles" on public.articles for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "members_delete_own_articles" on public.articles;
create policy "members_delete_own_articles" on public.articles for delete to authenticated using (author_id = (select auth.uid()));
drop policy if exists "admins_manage_articles" on public.articles;
drop policy if exists "admins_select_articles" on public.articles;
drop policy if exists "admins_update_articles" on public.articles;
drop policy if exists "admins_delete_articles" on public.articles;
create policy "admins_select_articles" on public.articles for select to authenticated using ((select public.is_admin()));
create policy "admins_update_articles" on public.articles for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins_delete_articles" on public.articles for delete to authenticated using ((select public.is_admin()));

-- The admin account is promoted during the project migration; keep member accounts as members by default.