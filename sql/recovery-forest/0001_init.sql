-- =========================================================
-- 회복의 숲 초기 스키마 (Recovery Forest)
-- 마이그레이션: 0001_init
-- =========================================================

create extension if not exists "pgcrypto";
create extension if not exists "cube";
create extension if not exists "earthdistance";

-- ---------------------------------------------------------
-- 1. 산림치유 공간 카탈로그
-- ---------------------------------------------------------
create table if not exists forest_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (
    type in ('healing_forest', 'recreation_forest', 'urban_forest', 'trail')
  ),
  region text not null,
  sido text not null,
  sigungu text not null,
  latitude double precision not null,
  longitude double precision not null,
  altitude_m integer,
  area_ha numeric,
  tree_species text[] not null default '{}',
  trail_length_km numeric,
  trail_difficulty text check (trail_difficulty in ('easy', 'moderate', 'hard')),
  exercise_intensity_met numeric,
  accessibility_score integer check (accessibility_score between 0 and 100),
  baseline_phytoncide_pptv numeric,
  description text,
  image_url text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_forest_places_region on forest_places (sido, sigungu);
create index if not exists idx_forest_places_type on forest_places (type);
create index if not exists idx_forest_places_location
  on forest_places using gist (ll_to_earth(latitude, longitude));

alter table forest_places enable row level security;

drop policy if exists "anon_read_forest_places" on forest_places;
create policy "anon_read_forest_places" on forest_places
  for select to anon using (true);

-- ---------------------------------------------------------
-- 2. 산림치유 프로그램
-- ---------------------------------------------------------
create table if not exists healing_programs (
  id uuid primary key default gen_random_uuid(),
  forest_place_id uuid references forest_places(id) on delete cascade,
  name text not null,
  target_group text,
  duration_min integer,
  schedule_text text,
  fee_krw integer,
  description text,
  contact text,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_healing_programs_forest
  on healing_programs (forest_place_id);

alter table healing_programs enable row level security;
drop policy if exists "anon_read_healing_programs" on healing_programs;
create policy "anon_read_healing_programs" on healing_programs
  for select to anon using (true);

-- ---------------------------------------------------------
-- 3. 추천 세션 (익명)
-- ---------------------------------------------------------
create table if not exists recommendation_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  input_payload jsonb not null,
  user_priorities text[] not null,
  user_region text,
  user_fitness_level text check (user_fitness_level in ('low', 'mid', 'high')),
  user_travel_time_min integer,
  weather_snapshot jsonb,
  air_quality_snapshot jsonb,
  results jsonb,
  ai_summary text,
  llm_model text,
  llm_prompt_version text,
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed')
  ),
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_rec_sessions_session_id
  on recommendation_sessions (session_id);
create index if not exists idx_rec_sessions_status
  on recommendation_sessions (status);

alter table recommendation_sessions enable row level security;

drop policy if exists "anon_insert_sessions" on recommendation_sessions;
create policy "anon_insert_sessions" on recommendation_sessions
  for insert to anon with check (true);

drop policy if exists "anon_read_sessions" on recommendation_sessions;
create policy "anon_read_sessions" on recommendation_sessions
  for select to anon using (true);

-- ---------------------------------------------------------
-- 4. 추천 피드백 (선택)
-- ---------------------------------------------------------
create table if not exists recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  forest_place_id uuid references forest_places(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_session on recommendation_feedback (session_id);

alter table recommendation_feedback enable row level security;
drop policy if exists "anon_insert_feedback" on recommendation_feedback;
create policy "anon_insert_feedback" on recommendation_feedback
  for insert to anon with check (true);

-- ---------------------------------------------------------
-- 5. 외부 API 호출 로그 (관찰)
-- ---------------------------------------------------------
create table if not exists external_api_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  provider text not null check (
    provider in ('kma', 'airkorea', 'forest_kr', 'openai', 'supabase')
  ),
  endpoint text,
  request_payload jsonb,
  response_status integer,
  response_summary jsonb,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_logs_session on external_api_logs (session_id);
create index if not exists idx_api_logs_provider on external_api_logs (provider, created_at desc);

alter table external_api_logs enable row level security;
-- service role only; no anon policy
