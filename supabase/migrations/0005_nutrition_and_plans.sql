-- 0005 · Recipes & meal plans
-- AI may generate recipe IDEAS/STRUCTURE; macros are reconciled against the verified provider.

create table public.recipes (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null check (char_length(title) between 1 and 160),
  cuisine              text,
  prep_minutes         integer not null default 0 check (prep_minutes >= 0),
  servings             integer not null default 1 check (servings >= 1),
  calories_per_serving integer not null check (calories_per_serving >= 0),
  protein_per_serving_g numeric(6, 1) not null default 0 check (protein_per_serving_g >= 0),
  instructions         text,
  is_ai_generated      boolean not null default false,
  is_demo              boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger set_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id               uuid primary key default gen_random_uuid(),
  recipe_id        uuid not null references public.recipes (id) on delete cascade,
  label            text not null,
  provider_food_id text,
  quantity         numeric(8, 2) not null default 1 check (quantity > 0),
  unit             text not null default 'unit',
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);
create trigger set_updated_at before update on public.recipe_ingredients
  for each row execute function public.set_updated_at();

-- A user's plan over a date range, with the constraints snapshot that generated it.
create table public.meal_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid references public.challenges (id) on delete set null,
  start_date   date not null,
  end_date     date not null,
  constraints  jsonb not null default '{}'::jsonb, -- calorie/protein target, prefs, budget, etc.
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_date >= start_date)
);
create index meal_plans_user_idx on public.meal_plans (user_id);
create trigger set_updated_at before update on public.meal_plans
  for each row execute function public.set_updated_at();

create table public.meal_plan_days (
  id           uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  plan_date    date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (meal_plan_id, plan_date)
);
create index meal_plan_days_plan_idx on public.meal_plan_days (meal_plan_id);
create trigger set_updated_at before update on public.meal_plan_days
  for each row execute function public.set_updated_at();

create table public.meal_plan_meals (
  id               uuid primary key default gen_random_uuid(),
  meal_plan_day_id uuid not null references public.meal_plan_days (id) on delete cascade,
  slot             text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id        uuid references public.recipes (id) on delete set null,
  title            text not null,
  calories         integer not null check (calories >= 0),
  protein_g        numeric(6, 1) not null default 0 check (protein_g >= 0),
  completed        boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index meal_plan_meals_day_idx on public.meal_plan_meals (meal_plan_day_id);
create trigger set_updated_at before update on public.meal_plan_meals
  for each row execute function public.set_updated_at();
