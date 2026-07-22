-- 0015 · Admin: invite allowlist + reversible access control
--
-- Adds an admin role and a pilot-friendly access model that needs NO service-role key (so it runs
-- entirely against the public web app):
--   • profiles.is_admin  — who can manage the challenge
--   • profiles.disabled  — reversibly revoke a challenger's access (enforced by the app on launch)
--   • allowlist          — only invited emails may create an account
-- All management happens through admin-only SECURITY DEFINER RPCs; the tables stay locked by RLS.

alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists disabled boolean not null default false;

-- The founding admin (the pilot owner). Promote the existing account if it already exists…
update public.profiles p
set is_admin = true
from auth.users u
where u.id = p.id and lower(u.email) = 'jakemanson5@yahoo.com';

-- …and make sure a fresh signup with that email also lands as admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, is_admin)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'Challenger'),
    lower(new.email) = 'jakemanson5@yahoo.com'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Invite allowlist. Only emails present here may create an account.
create table if not exists public.allowlist (
  email      text primary key,
  note       text,
  added_by   uuid references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.allowlist enable row level security; -- no direct access; RPCs only

insert into public.allowlist (email, note)
values ('jakemanson5@yahoo.com', 'Founding admin')
on conflict (email) do nothing;

-- Is the current caller an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Public pre-check the signup screen calls so it can show a friendly message.
create or replace function public.is_email_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowlist a where lower(a.email) = lower(trim(p_email))
  );
$$;

-- Hard backstop: block any signup whose email isn't invited (defense in depth).
create or replace function public.enforce_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.allowlist a where lower(a.email) = lower(new.email)) then
    raise exception 'This email has not been invited to the challenge yet.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_allowlist_trg on auth.users;
create trigger enforce_allowlist_trg
  before insert on auth.users
  for each row execute function public.enforce_allowlist();

-- Admin RPCs (every one gated on is_admin()).
create or replace function public.admin_list_members()
returns table (
  user_id uuid, email text, display_name text, state text,
  disabled boolean, is_admin boolean, created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, u.email, p.display_name,
         nullif(s.state -> 'profile' ->> 'state', ''),
         p.disabled, p.is_admin, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.user_app_state s on s.user_id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

create or replace function public.admin_set_disabled(target uuid, val boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if target = auth.uid() then raise exception 'you cannot disable your own admin account'; end if;
  update public.profiles set disabled = val, updated_at = now() where id = target;
end;
$$;

create or replace function public.admin_list_allowlist()
returns table (email text, note text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.email, a.note, a.created_at
  from public.allowlist a
  where public.is_admin()
  order by a.created_at desc;
$$;

create or replace function public.admin_add_allowlist(p_email text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  insert into public.allowlist (email, note, added_by)
  values (lower(trim(p_email)), p_note, auth.uid())
  on conflict (email) do update set note = excluded.note;
end;
$$;

create or replace function public.admin_remove_allowlist(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  delete from public.allowlist where email = lower(trim(p_email));
end;
$$;

-- The app calls this on launch: if disabled, it signs the user out.
create or replace function public.my_access()
returns table (disabled boolean, is_admin boolean)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p.disabled, false), coalesce(p.is_admin, false)
  from public.profiles p
  where p.id = auth.uid();
$$;

-- Keep disabled challengers off the leaderboard/map too.
create or replace function public.get_leaderboard()
returns table (
  user_id uuid, display_name text, state text, pct_lost numeric, active_recent boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      s.user_id,
      coalesce(
        nullif(s.state -> 'profile' ->> 'firstName', ''),
        nullif(s.state -> 'profile' ->> 'displayName', ''),
        p.display_name,
        'Challenger'
      ) as display_name,
      nullif(s.state -> 'profile' ->> 'state', '') as state,
      nullif(s.state -> 'profile' ->> 'startWeightKg', '')::numeric  as start_kg,
      nullif(s.state -> 'profile' ->> 'latestWeightKg', '')::numeric as latest_kg,
      s.updated_at
    from public.user_app_state s
    left join public.profiles p on p.id = s.user_id
    where coalesce((s.state -> 'profile' ->> 'enrolled')::boolean, false) = true
      and coalesce(p.disabled, false) = false
  )
  select
    base.user_id,
    base.display_name,
    base.state,
    case
      when base.start_kg is null or base.start_kg <= 0 then 0::numeric
      else round(((base.start_kg - coalesce(base.latest_kg, base.start_kg)) / base.start_kg) * 100, 1)
    end as pct_lost,
    (base.updated_at > now() - interval '24 hours') as active_recent
  from base
  order by pct_lost desc, base.updated_at desc;
$$;

grant execute on function
  public.is_admin(),
  public.is_email_allowed(text),
  public.admin_list_members(),
  public.admin_set_disabled(uuid, boolean),
  public.admin_list_allowlist(),
  public.admin_add_allowlist(text, text),
  public.admin_remove_allowlist(text),
  public.my_access(),
  public.get_leaderboard()
to authenticated;

-- The signup pre-check must be callable before login.
grant execute on function public.is_email_allowed(text) to anon;
