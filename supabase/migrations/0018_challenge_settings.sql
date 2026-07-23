-- 0018 · Admin-controlled challenge start date
--
-- One shared challenge window everyone runs on (instead of per-user enrollment dates). The admin
-- sets the start date + length; every client reads the same values, so the day count, the start-date
-- banner, and the calendar window all line up for the whole crew.

create table if not exists public.challenge_settings (
  id          smallint primary key default 1,
  start_date  date not null default current_date,
  length_days int not null default 42,
  updated_at  timestamptz not null default now(),
  constraint challenge_settings_singleton check (id = 1)
);

insert into public.challenge_settings (id) values (1) on conflict (id) do nothing;

alter table public.challenge_settings enable row level security;

drop policy if exists challenge_settings_read on public.challenge_settings;
-- Everyone signed in reads the same window; writes go through the admin RPC only.
create policy challenge_settings_read on public.challenge_settings for select to authenticated using (true);

grant select on public.challenge_settings to authenticated;

create or replace function public.admin_set_challenge(p_start date, p_length int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  insert into public.challenge_settings (id, start_date, length_days, updated_at)
  values (1, p_start, greatest(p_length, 1), now())
  on conflict (id) do update
    set start_date = excluded.start_date,
        length_days = excluded.length_days,
        updated_at = now();
end;
$$;

grant execute on function public.admin_set_challenge(date, int) to authenticated;
