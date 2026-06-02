import {
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const forestPlaces = pgTable(
  "forest_places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    region: text("region").notNull(),
    sido: text("sido").notNull(),
    sigungu: text("sigungu").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    altitudeM: integer("altitude_m"),
    areaHa: numeric("area_ha"),
    treeSpecies: text("tree_species").array().notNull().default([]),
    trailLengthKm: numeric("trail_length_km"),
    trailDifficulty: text("trail_difficulty"),
    exerciseIntensityMet: numeric("exercise_intensity_met"),
    accessibilityScore: integer("accessibility_score"),
    baselinePhytoncidePptv: numeric("baseline_phytoncide_pptv"),
    description: text("description"),
    imageUrl: text("image_url"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    regionIdx: index("idx_forest_places_region").on(t.sido, t.sigungu),
    typeIdx: index("idx_forest_places_type").on(t.type),
  }),
);

export const healingPrograms = pgTable(
  "healing_programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    forestPlaceId: uuid("forest_place_id").references(() => forestPlaces.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    targetGroup: text("target_group"),
    durationMin: integer("duration_min"),
    scheduleText: text("schedule_text"),
    feeKrw: integer("fee_krw"),
    description: text("description"),
    contact: text("contact"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    forestIdx: index("idx_healing_programs_forest").on(t.forestPlaceId),
  }),
);

export const recommendationSessions = pgTable(
  "recommendation_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull().unique(),
    inputPayload: jsonb("input_payload").notNull(),
    userPriorities: text("user_priorities").array().notNull(),
    userRegion: text("user_region"),
    userFitnessLevel: text("user_fitness_level"),
    userTravelTimeMin: integer("user_travel_time_min"),
    weatherSnapshot: jsonb("weather_snapshot"),
    airQualitySnapshot: jsonb("air_quality_snapshot"),
    results: jsonb("results"),
    aiSummary: text("ai_summary"),
    llmModel: text("llm_model"),
    llmPromptVersion: text("llm_prompt_version"),
    status: text("status").notNull().default("pending"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    sessionIdIdx: index("idx_rec_sessions_session_id").on(t.sessionId),
    statusIdx: index("idx_rec_sessions_status").on(t.status),
  }),
);

export const recommendationFeedback = pgTable(
  "recommendation_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id"),
    forestPlaceId: uuid("forest_place_id").references(() => forestPlaces.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("idx_feedback_session").on(t.sessionId),
  }),
);

export const externalApiLogs = pgTable(
  "external_api_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id"),
    provider: text("provider").notNull(),
    endpoint: text("endpoint"),
    requestPayload: jsonb("request_payload"),
    responseStatus: integer("response_status"),
    responseSummary: jsonb("response_summary"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("idx_api_logs_session").on(t.sessionId),
    providerIdx: index("idx_api_logs_provider").on(t.provider, t.createdAt),
  }),
);

// =========================================================
// Evidence Engine: Prescribe → Measure → Learn 여정(journey)
// 매직링크 토큰으로 식별되는 다단계 애그리거트. 기존 단발성
// recommendation_sessions 와 독립적으로 동작한다.
// =========================================================

// 1. 여정 애그리거트 (상태 머신의 루트)
export const journeys = pgTable(
  "journeys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyToken: text("journey_token").notNull().unique(),
    email: text("email"),
    // consented | pre_surveyed | prescribed | in_program | post_surveyed | reported | failed
    status: text("status").notNull().default("consented"),
    consentVersion: text("consent_version"),
    consentedAt: timestamp("consented_at", { withTimezone: true }),
    programStartedAt: timestamp("program_started_at", { withTimezone: true }),
    programEndedAt: timestamp("program_ended_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: index("idx_journeys_token").on(t.journeyToken),
    statusIdx: index("idx_journeys_status").on(t.status),
  }),
);

// 2. 동의 감사 로그 (동의 버전/문구 해시 보관)
export const journeyConsents = pgTable(
  "journey_consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    consentVersion: text("consent_version").notNull(),
    textHash: text("text_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    journeyIdx: index("idx_journey_consents_journey").on(t.journeyId),
  }),
);

// 3. 사전 설문 (자가보고 웰니스 + 추천 입력) — 여정당 1건
export const preSurveys = pgTable(
  "pre_surveys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .unique()
      .references(() => journeys.id, { onDelete: "cascade" }),
    sleepScore: integer("sleep_score"),
    fatigueScore: integer("fatigue_score"),
    moodScore: integer("mood_score"),
    stressScore: integer("stress_score"),
    monthsSinceTreatment: integer("months_since_treatment"),
    selfReportPayload: jsonb("self_report_payload"),
    recommendationInput: jsonb("recommendation_input").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    journeyIdx: index("idx_pre_surveys_journey").on(t.journeyId),
  }),
);

// 4. 처방전 (가설 target_outcome 포함)
export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    forestPlaceId: uuid("forest_place_id").references(() => forestPlaces.id),
    status: text("status").notNull().default("pending"),
    weatherSnapshot: jsonb("weather_snapshot"),
    airQualitySnapshot: jsonb("air_quality_snapshot"),
    actionPlan: jsonb("action_plan"),
    targetOutcome: jsonb("target_outcome"),
    postMeasurementPlan: jsonb("post_measurement_plan"),
    aiSummary: text("ai_summary"),
    caution: text("caution"),
    llmModel: text("llm_model"),
    llmPromptVersion: text("llm_prompt_version"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    journeyIdx: index("idx_prescriptions_journey").on(t.journeyId),
    statusIdx: index("idx_prescriptions_status").on(t.status),
  }),
);

// 5. 근거 논문 카탈로그 (Evidence Base ites 의 로컬 stand-in)
export const forestEvidenceSources = pgTable(
  "forest_evidence_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mechanism: text("mechanism").notNull(),
    title: text("title").notNull(),
    authors: text("authors"),
    year: integer("year"),
    sourceUrl: text("source_url"),
    summary: text("summary"),
    // evidencebase1 의 ingredient_target_evidence_sources(ites) 행과의 연결 seam
    externalItesId: text("external_ites_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    mechanismIdx: index("idx_forest_evidence_mechanism").on(t.mechanism),
  }),
);

// 6. 처방 ↔ 근거 인용 연결
export const prescriptionCitations = pgTable(
  "prescription_citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prescriptionId: uuid("prescription_id")
      .notNull()
      .references(() => prescriptions.id, { onDelete: "cascade" }),
    evidenceSourceId: uuid("evidence_source_id").references(
      () => forestEvidenceSources.id,
    ),
    mechanism: text("mechanism"),
    relevanceNote: text("relevance_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    prescriptionIdx: index("idx_prescription_citations_prescription").on(
      t.prescriptionId,
    ),
  }),
);

// 7. 사후 설문 — 여정당 1건 (사전과 동일 웰니스 축)
export const postSurveys = pgTable(
  "post_surveys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .unique()
      .references(() => journeys.id, { onDelete: "cascade" }),
    sleepScore: integer("sleep_score"),
    fatigueScore: integer("fatigue_score"),
    moodScore: integer("mood_score"),
    stressScore: integer("stress_score"),
    impression: text("impression"),
    selfReportPayload: jsonb("self_report_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    journeyIdx: index("idx_post_surveys_journey").on(t.journeyId),
  }),
);

// 8. 건강 리포트 (사전/사후 비교 + 가설 적중) — 여정당 1건
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .unique()
      .references(() => journeys.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    deltaSummary: jsonb("delta_summary"),
    hitMiss: jsonb("hit_miss"),
    narrative: text("narrative"),
    citationsSnapshot: jsonb("citations_snapshot"),
    llmModel: text("llm_model"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    journeyIdx: index("idx_reports_journey").on(t.journeyId),
  }),
);
