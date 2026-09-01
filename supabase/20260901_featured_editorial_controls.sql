alter table public.articles add column if not exists is_featured boolean not null default false;
alter table public.articles add column if not exists featured_order integer not null default 0;
create index if not exists articles_featured_idx on public.articles(is_featured, featured_order, published_at desc);

drop policy if exists "members_update_own_articles" on public.articles;
create policy "members_update_own_articles" on public.articles
for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()) and status in ('draft','pending','rejected'));
