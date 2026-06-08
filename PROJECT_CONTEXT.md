# PROJECT_CONTEXT.md — v2
> 회복의 숲 — 산림청 공공데이터 활용 AI 경진대회 (마감 2026-06-14)
> 기획(채팅)과 구현(Claude Code)의 **단일 진실원**. 전략이 바뀌면 이 파일을 먼저 고치고, 코드는 이 파일을 따른다.
>
> **v2 주요 변경(2026-06-08):**
> ① **FastAPI 폐기** — React Router 7 **단일 TS 앱**(server action / resource route)로 확정.
> ② **엔진** = `prescription_engine.py`·`phytoncide_index.py`를 **TS 포팅**(파이썬 출력으로 동치 검증).
> ③ **설문 = ESAS-r 검증판**(`설문_설계_확정.md`) — 척도 방향 통일(0=최상, 10=최악), 사전·사후 페어링.
> ④ **추천 출력에 숲나들e 딥링크**(`program_url`) — 예약/상세로 바로 연결.
> ⑤ **"효과 검증" 단정 주장 금지**(§10) — "측정·관찰·시뮬레이션"까지만.
> ★ 데이터 수집 **종료**(§4). 새 데이터셋 탐색 금지.

---

## 0. 한 줄 정의
사용자의 상태(수면·피로·스트레스 등)와 위치를 받아, 전국 치유의숲 38개 중 **"왜 이 숲인지"를 과학적 근거로 설명하는 처방**을 내리고, 방문 전후 변화를 **국제 검증 척도(ESAS)로 측정·축적**하는 산림치유 추천·근거 엔진.

## 1. 대회 프레이밍 (이걸로 평가받는다)
- **추천이 메인**, 사전·사후 측정 데이터가 추천의 신뢰 근거.
- 차별화 핵심 = **공공데이터 융합**: 치유의숲 좌표 + 청정넷 실시간 기상/미세먼지 + 국립산림과학원 피톤치드 연구 + 숲나들e 딥링크.
- 발표 클라이맥스 = **유형별 정반대 추천**(인터뷰 근거). 같은 숲, 다른 사용자 → 다른 1등. (코드·테스트로 검증됨)
- 정직성 = 추정 지수는 "측정값 아님" 명시. 표본 작음·내부자 편향 인정. **"효과 검증"이 아니라 "검증 척도로 측정한 변화 데이터 축적"**(§10).

## 2. 사용자 유형 (실제 인터뷰 2명 기반, 2026-06)
정반대 선호 관찰 → **단일 랭킹 불가, 유형 분기 필수**.
- **comfort(편안함형, 디폴트·일반 타겟)**: 거리가 결정의 전부. 잠/편안함 중심. (여성/유방암경험자)
- **explorer(근거형)**: 거리 무관. 차별성·과학적 근거·특화 경험. (남성/내부자)
- 유형 감지 = **사전설문 1문항**("가까운 곳이 좋다 / 특별한 경험이 좋다") → `user_type`. 과설계 금지.
- 디폴트 comfort. explorer는 근거 레이어 정당화 보조.
- **킬러 아웃컴 = 수면.** 데모 페르소나 "잠 못 자던 사람이 숲에서 숙면".

## 3. 기술 스택 (TS 단일 앱 확정)
- 프론트+서버: **React Router 7** (server action / resource route). 코드는 전부 `app/features/recovery-forest/` 폴더에 격리(이식 가능).
- **처방·피톤치드 지수 로직 = TS 순수함수** (`app/features/recovery-forest/services/`). 루트 `*.py`는 레퍼런스 프로토타입 — 실제 로직은 TS 포팅 완료, **파이썬 출력과 동치 검증**.
- 오케스트레이션·실시간 수집·측정 알림: **n8n**
- DB: **Supabase**(Postgres) + Drizzle ORM
- ❌ **FastAPI/별도 Python 런타임 미사용**(§10). 새 도구 금지.

## 4. 데이터 소스 & 상태 (★ 수집 종료)
| 데이터 | 용도 | 상태 |
|---|---|---|
| 치유의숲 38개(좌표+현황) | 추천 대상 | ✅ Supabase 적재(`forest_places`) |
| 청정넷 실시간(미세먼지·온습도·풍속) | 시점·안전 점수 | 🔶 n8n 워크플로우 보유, 엔진 연결만 남음 |
| 피톤치드 연구(국립산림과학원) | 잠재력 지수 가중치 | ✅ TS 포팅 완료(`services/phytoncide-index.ts`) |
| 38개 수종 매핑 | 지수 입력 | 🔶 `forest_places.tree_species`(배열) 컬럼 존재 → 시딩만 |
| **숲나들e 딥링크** | 추천 출력 `program_url` | 🔶 숲별 URL 매핑 필요(forest_places.source_url 활용/보강) |
| ~~프로그램(④ 매칭)~~ | ~~프로그램 매칭~~ | ❌ 제외 확정(3소스 부적합). → V2 |
| 임상도 1:5000 | 수종 정밀화 | ⛔ V2. 대형 GIS 함정, 손대지 말 것 |

## 5. 처방 엔진 로직 (확정, v1 = 3축 · TS 구현 완료)
점수 축 3개(각 0~100) → 유형별 가중치 → 랭킹 → 처방전.
```
① 거리(접근성)   haversine (services/forest-ranking.ts). 데모는 직선거리
② 피톤치드 잠재력 services/phytoncide-index.ts (보고서 근거, consistencyCheck 정합성 고정)
③ 미세먼지 안전   청정넷 PM2.5 (낮을수록 가점, >35 회피)
```
가중치(합=1.0): ④ 프로그램(.15/.30) 제거분을 ①③에 재분배.
- comfort  = {거리 .50, 피톤치드 .20, 미세먼지 .30}
- explorer = {거리 .10, 피톤치드 .60, 미세먼지 .30}

처방전 출력: 추천 숲 + **숲나들e `program_url`** + 권장 시점(여름 정오 회피, 오전) + **왜 이 숲(근거 인용)** + 기대 변화 + 사후 측정 안내(ESAS).
구현 진입점: `services/forest-ranking.ts` 의 `prescribe()`(prescription_engine.py 동등) — `rankForests`(3축) + `buildWhy`(유형별 근거, 의료표현 금지) + `optimalTime`. 검증됨: comfort→가까운 잣향기, explorer→피톤치드 최고 편백.

## 6. 피톤치드 지수 근거 (발표 방어용, 출처 고정)
국립산림과학원「산림치유자원 연구보고서」(전국 30지역 117지점, 2017~2024):
- 수종 순위: **편백>소나무>낙엽송>잣나무>활엽수** (p.13, p.88)
- 기온↑·습도↑·풍속↓ → 농도↑ (p.88, p<.01)
- 계절: 여름 최고, 단 **편백=3월·낙엽송=5월** 예외 (p.79~80)
- 시간: 6~9월 **정오 최저**, 야간 높음 (p.80)
- ※ 수종 '순위'는 보고서 근거, 점수 '간격'은 설계값. **상대 지수(0~100), 절대농도 아님.**

## 6-1. 설문 설계 원칙 (ESAS, `설문_설계_확정.md` 요약)
- **척도 방향 통일**: 모든 증상 0~10, **0=없음/최상, 10=최악**. 개선=점수↓, **Δ = pre − post**(양수면 호전).
- **처방-측정 연결**: 모든 측정은 `prescription_id`에 묶임 → 그날 숲·피톤치드지수·날씨와 연결(★ 핵심 루프).
- **페어링 키**: `participant_id`(앱=로그인/전화). 이름 매칭 금지.
- **정적 1회 + 린 코어**: 프로필(암 정보 등)은 가입 시 1회, 매 방문은 ESAS 2분.
- ESAS 항목(7): 피로·통증·수면곤란(불면)·우울·불안·스트레스·전반. 추적(d3)은 수면곤란·피로 2개.

## 7. API 계약 (프론트 ↔ React Router 7 resource route)
**POST `/api/prescribe`** — 엔진(3축)을 감싸는 얇은 JSON API. 구현: `api/prescribe.tsx` → `forest-ranking.prescribe()`. 데모는 SAMPLE_FORESTS(운영시 forest_places 주입).
```jsonc
// req (네이티브 계약, prescribe.schema.ts)
{ "goal": "수면", "lat": 37.55, "lon": 126.97, "user_type": "comfort", "month": 7, "hour": 10 }
// res — ★ program_url 추가 예정(딥링크)
{ "ok": true, "data": {
  "pick": "잣향기 푸른숲", "score": 67.0, "program_url": "https://www.foresttrip.go.kr/...",
  "visit_time": "오전 9~11시 (여름 정오는 농도 최저라 회피)",
  "why": "집에서 약 48km로 가깝고 ...",
  "target_outcome": "수면질 향상(주관 수면점수 +20%)",
  "ranking": [ { "name":"...", "total":67.0, "phyto":52.1, "distance_km":48 } ] } }
```
**POST `/api/measure`** — ESAS 측정 저장(`prescription_id`에 묶임). phase=post 저장 시 pre와 묶어 Δ 반환.
```jsonc
{ "prescription_id": "...", "phase": "pre",   // pre | post | d3
  "fatigue": 7, "pain": 3, "insomnia": 8, "depression": 4,
  "anxiety": 5, "stress": 7, "wellbeing": 6,
  "change_overall": null, "change_reason": null, "stay_min": null, "companion": null }
```
**GET `/api/report/{prescription_id}`** — 사전/사후 Δ + 그날 환경 컨텍스트(검증 주장 아님, 측정 데이터).
```jsonc
{ "deltas": { "stress": 2.6, "insomnia": 2.6, "fatigue": 1.8 },
  "context": { "forest": "...", "phyto_index": 92, "pm25": 12 },
  "persistence_d3": { "insomnia": 5.0, "fatigue": 4.5 } }
```
> ⚠ 현재 코드는 이 ESAS 계약을 **아직 미구현**. 추천(`/api/prescribe`)만 동작. measure/report는 §9 작업.

## 8. Supabase 스키마
### 8-A. v2 목표 스키마 (ESAS, `설문_설계_확정.md`)
```sql
participants(id pk, sex, age int, cancer_dx_year int, cancer_type text,
  tx_status text, sleep_hours numeric, exercise_freq text, supplements text, created_at)
prescriptions(id pk, participant_id fk, created_at, goal text, user_type text,
  lat float8, lon float8, forest_place_id fk,          -- 추천된 숲(코드: uuid)
  phyto_index_at_visit numeric,                        -- ★ 검증 신호: 그날 그 숲 피톤치드 지수
  pm25_at_visit numeric, temp numeric, humidity numeric, wind numeric, payload jsonb)
measurements(id pk, prescription_id fk, participant_id fk,
  phase text,                                          -- 'pre' | 'post' | 'd3'
  fatigue int, pain int, insomnia int, depression int,
  anxiety int, stress int, wellbeing int,              -- ESAS 0~10 (동일 항목)
  change_overall text, change_reason text,             -- post 전용
  stay_min int, companion text, at timestamptz)        -- post 전용(교란변수)
```
### 8-B. 현재 코드 스키마 (실제, `app/features/recovery-forest/db/schema.ts`)
```text
forest_places(... tree_species text[], baseline_phytoncide_pptv, accessibility_score, source_url ...)
journeys / journey_consents / pre_surveys / post_surveys / reports  — Evidence Engine 여정(익명 매직링크)
prescriptions(journey_id, forest_place_id, action_plan, target_outcome, ...)  — 여정 기반
recommendation_sessions / recommendation_feedback / external_api_logs
```
> ★ **갭(정직)**: 현재 코드는 **익명 journey_token + pre/post_surveys(sleep/fatigue/mood/stress, 방향 비통일)** 모델. v2는 **participant_id + ESAS(7항목, 방향 통일)** 모델로 전환 필요 — 식별 방식(익명↔로그인)과 측정 항목이 모두 바뀌는 마이그레이션. §9 작업, **DB 변경은 롤백 가능 마이그레이션 + 승인 후**(CLAUDE.md).

## 9. 지금 작업 큐 (우선순위) — 데모 완성
- [x] **3축 처방 엔진 TS 포팅 + `/api/prescribe`** (2026-06-08, 테스트 118 통과)
1. **추천 출력 `program_url`** — forest_places 숲나들e URL 매핑 → `prescribe()` 출력 + §7 res 반영
2. **ESAS 측정 루프** — `participants`·`measurements`(+`prescriptions` 확장) 마이그레이션(롤백 포함, 승인 후) → `/api/measure`·`/api/report` 구현
3. **더미 페어 데이터**(5~10명 사전/사후 ESAS) → 막대 비교 + `phyto_index ↔ Δstress` 산점도 (발표용)
4. 38개 `tree_species` 시딩 + `/api/prescribe`가 SAMPLE 대신 forest_places 주입
5. 청정넷 n8n → 엔진 연결(숲 최근접 관측소 매핑) → ③ 미세먼지 실시간화
6. 프론트 입력폼(ESAS 사전) ↔ `/api/prescribe` ↔ 처방전 화면 + 두 페르소나 데모

## 10. 하지 말 것 (함정 목록)
- **"효과 검증/효능 입증/치료 효과" 단정 주장**. 허용: "국제 검증 척도(ESAS)로 측정한 사전-사후 변화", "관찰·가설·시뮬레이션". 의료표현(치료/효능/진단) 금지와 동일선상.
- **새 데이터셋 탐색**(수집 종료). 눈에 띄는 데이터는 V2 슬라이드 한 줄 재료.
- **FastAPI/Python 런타임 신설**(TS 단일 앱 확정). 엔진은 TS, API는 RR7 라우트.
- ④ 프로그램 축 부활(3소스 검증 완료, 부적합)
- 임상도 GIS 정밀 처리 (V2)
- 카카오 길찾기 실제 이동시간 (데모는 직선거리로 충분)
- 피톤치드 지수를 ML/회귀로 (순서 지수면 충분)
- 공간인덱스/PostGIS 최적화 (38행, 풀스캔 충분)
- ESAS 척도 방향 뒤집기·항목 임의 추가(검증판 문구 유지)
- 기능 추가 욕심. 정리하고 가볍게.

## 11. 동기화 규칙 (운영용)
- 전략·범위 변경 → **이 파일 먼저 수정** → Claude Code에 "PROJECT_CONTEXT.md 갱신됨, 반영" 지시.
- 새 결정은 §9 작업 큐 / §10 함정 목록 / (코드면) §7·§8에 반영.
- 코드 사실(스택·스키마·파일 경로)은 Claude Code가 실제 코드에 맞춰 유지(§3·§5·§7·§8). 목표와 현재 코드가 다르면 **갭을 명시**(§8-B).
