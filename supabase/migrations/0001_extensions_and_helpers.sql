-- 0001 · Extensions and shared helpers
-- Additive foundation for all later migrations. Safe to re-run (idempotent where possible).

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Shared trigger to maintain updated_at. Attached per-table in later migrations.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger: stamps updated_at = now(). Attach to every table with an updated_at column.';

-- Convention note (documented, not enforced here):
--   * Enums are modeled as text + CHECK constraints (see DATA_MODEL.md §1.7) to ease evolution.
--   * Mass is stored in kilograms, distance in meters, duration in seconds, money in integer cents.
