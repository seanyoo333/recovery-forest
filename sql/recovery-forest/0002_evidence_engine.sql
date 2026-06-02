-- =========================================================
-- 회복의 숲 Evidence Engine 스키마 (Prescribe → Measure → Learn)
-- 마이그레이션: 0002_evidence_engine
--
-- 매직링크 토큰으로 식별되는 다단계 여정(journey)을 추가한다.
-- 기존 단발성 recommendation_sessions 흐름은 건드리지 않는다.
--
-- RLS = service-role 전용. 모든 여정 테이블은 RLS 를 켜되 anon 정책을
-- 두지 않는다(= anon 키로는 접근 불가). 여정 관련 server action / loader 는
-- makeRecoveryServiceClient() (service-role) 로만 접근하므로, 프로덕션 DB 에
-- 적용해도 신규 테이블이 anon 에 노출되지 않는다.
-- =========================================================

-- ---------------------------------------------------------
-- 1. 여정 애그리거트 (상태 머신 루트)
-- ---------------------------------------------------------
create table if not exists journeys (
  id uuid primary key default gen_random_uuid(),
  journey_token text not null unique,
  email text,
  status text not null default 'consented' check (
    status in (
      'consented', 'pre_surveyed', 'prescribed',
      'in_program', 'post_surveyed', 'reported', 'failed'
    )
  ),
  consent_version text,
  consented_at timestamptz,
  program_started_at timestamptz,
  program_ended_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journeys_token on journeys (journey_token);
create index if not exists idx_journeys_status on journeys (status);

alter table journeys enable row level security;
-- service-role only; no anon policy

-- ---------------------------------------------------------
-- 2. 동의 감사 로그
-- ---------------------------------------------------------
create table if not exists journey_consents (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references journeys(id) on delete cascade,
  consent_version text not null,
  text_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_journey_consents_journey
  on journey_consents (journey_id);

alter table journey_consents enable row level security;
-- service-role only; no anon policy

-- ---------------------------------------------------------
-- 3. 사전 설문 (자가보고 웰니스 + 추천 입력) — 여정당 1건
-- ---------------------------------------------------------
create table if not exists pre_surveys (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null unique references journeys(id) on delete cascade,
  sleep_score integer check (sleep_score between 1 and 10),
  fatigue_score integer check (fatigue_score between 1 and 10),
  mood_score integer check (mood_score between 1 and 10),
  stress_score integer check (stress_score between 1 and 10),
  months_since_treatment integer,
  self_report_payload jsonb,
  recommendation_input jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pre_surveys_journey on pre_surveys (journey_id);

alter table pre_surveys enable row level security;
-- service-role only; no anon policy

-- ---------------------------------------------------------
-- 4. 처방전 (가설 target_outcome 포함)
-- ---------------------------------------------------------
create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references journeys(id) on delete cascade,
  forest_place_id uuid references forest_places(id),
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed')
  ),
  weather_snapshot jsonb,
  air_quality_snapshot jsonb,
  action_plan jsonb,
  target_outcome jsonb,
  post_measurement_plan jsonb,
  ai_summary text,
  caution text,
  llm_model text,
  llm_prompt_version text,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_prescriptions_journey on prescriptions (journey_id);
create index if not exists idx_prescriptions_status on prescriptions (status);

alter table prescriptions enable row level security;
-- service-role only; no anon policy

-- ---------------------------------------------------------
-- 5. 근거 논문 카탈로그 (Evidence Base ites 의 로컬 stand-in)
-- ---------------------------------------------------------
create table if not exists forest_evidence_sources (
  id uuid primary key default gen_random_uuid(),
  mechanism text not null,
  title text not null,
  authors text,
  year integer,
  source_url text,
  summary text,
  external_ites_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_forest_evidence_mechanism
  on forest_evidence_sources (mechanism);

alter table forest_evidence_sources enable row level security;
-- service-role only; no anon policy

-- ---------------------------------------------------------
-- 6. 처방 ↔ 근거 인용 연결
-- ---------------------------------------------------------
create table if not exists prescription_citations (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  evidence_source_id uuid references forest_evidence_sources(id),
  mechanism text,
  relevance_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_prescription_citations_prescription
  on prescription_citations (prescription_id);

alter table prescription_citations enable row level security;
-- service-role only; no anon policy

-- ---------------------------------------------------------
-- 7. 사후 설문 — 여정당 1건 (사전과 동일 웰니스 축)
-- ---------------------------------------------------------
create table if not exists post_surveys (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null unique references journeys(id) on delete cascade,
  sleep_score integer check (sleep_score between 1 and 10),
  fatigue_score integer check (fatigue_score between 1 and 10),
  mood_score integer check (mood_score between 1 and 10),
  stress_score integer check (stress_score between 1 and 10),
  impression text,
  self_report_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_surveys_journey on post_surveys (journey_id);

alter table post_surveys enable row level security;
-- service-role only; no anon policy

-- ---------------------------------------------------------
-- 8. 건강 리포트 (사전/사후 비교 + 가설 적중) — 여정당 1건
-- ---------------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null unique references journeys(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed')
  ),
  delta_summary jsonb,
  hit_miss jsonb,
  narrative text,
  citations_snapshot jsonb,
  llm_model text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_journey on reports (journey_id);

alter table reports enable row level security;
-- service-role only; no anon policy
