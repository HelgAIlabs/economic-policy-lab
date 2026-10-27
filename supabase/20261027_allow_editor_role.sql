-- Allow the editorial team role used by the Team Editor.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'admin', 'editor'));
