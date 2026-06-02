# SPEC: 추천 엔진 (n8n 워크플로우)

## 1. 기능명

회복점수 계산 및 추천 이유 생성 엔진

## 2. 배경

사용자 입력을 받아 공공 API 5종을 호출하고 5축 점수를 산출, LLM으로 추천 이유와 주의사항을 생성한 뒤 TOP 5 결과를 반환해야 한다.

## 3. 대상 사용자

- 직접 사용자 없음 (서비스 내부 엔진)
- 결과의 소비자: 결과 페이지 / 숲 상세 페이지

## 4. 사용자 문제

- 외부 API가 가끔 실패한다.
- LLM 응답이 깨질 수 있다.
- 모든 사용자에게 같은 결과면 의미가 없다.

## 5. 목표

- 5축 점수가 사용자 우선순위에 따라 달라진다.
- 외부 API 1개 실패해도 결과 반환 가능 (baseline).
- LLM 응답은 항상 JSON 스키마를 통과한다.
- 평균 응답 2초, 최대 5초.

## 6. 범위

### 포함

- n8n Webhook endpoint
- Supabase 후보 숲 조회 (반경 + travel_time)
- 기상청 단기예보 호출
- 에어코리아 실시간 미세먼지 호출
- 산림청 치유의숲 / 둘레길 / 자연휴양림 호출
- 5축 점수 계산 (공기·기상·숲·운동·접근성)
- 사용자 우선순위 가중치 적용
- 4곳 치유의숲 피톤치드 데이터 기반 예측 (수종·온도·습도·풍속)
- OpenAI 추천 이유/주의사항 생성 (JSON Mode)
- 안전 필터 (금지 표현 차단)
- Supabase `recommendation_sessions` 업데이트
- 응답 JSON 반환

### 제외

- 사용자 인증
- 결과 페이지 렌더링
- 결제 / 예약

## 7. 사용자 흐름

```text
1. server action이 webhook 호출
2. n8n: 입력 검증
3. n8n: Supabase에서 후보 숲 조회
4. n8n: 5개 외부 API 병렬 호출
5. n8n: 5축 점수 계산
6. n8n: 우선순위 가중치 적용 → 총점 산출
7. n8n: TOP 5 선정
8. n8n: OpenAI에 prompt + 후보 데이터 전달 → JSON 응답
9. n8n: 안전 필터 통과 확인
10. n8n: Supabase에 결과 저장 (status='completed')
11. n8n: webhook 응답 반환
```

## 8. 입력 데이터

```json
{
  "session_id": "uuid-v4",
  "user_region": "서울 강북구",
  "user_lat": 37.62,
  "user_lng": 127.04,
  "user_priorities": ["air", "stress", "accessibility"],
  "user_fitness_level": "low",
  "user_travel_time_min": 60,
  "user_preferred_activity": "walking",
  "requested_at": "ISO8601"
}
```

## 9. 출력/화면 결과

```json
{
  "session_id": "...",
  "status": "completed",
  "recommended_at": "ISO8601",
  "results": [
    {
      "rank": 1,
      "forest_id": "uuid",
      "name": "○○치유의숲",
      "type": "healing_forest",
      "region": "경기 가평",
      "total_score": 86,
      "scores": {
        "air": 92,
        "weather": 80,
        "forest": 75,
        "exercise": 88,
        "accessibility": 95
      },
      "predicted_phytoncide_pptv": 1820,
      "current_pm25": 12,
      "current_temp_c": 19,
      "current_humidity": 58,
      "current_wind_ms": 1.2,
      "travel_time_min": 55,
      "reason": "...",
      "caution": "...",
      "recommended_activity": "30분 저강도 산책 + 벤치 호흡명상",
      "programs": [{"id": "uuid", "name": "..."}]
    }
  ]
}
```

## 10. 수용 기준

- [ ] 5개 외부 API 모두 호출되고 로그가 `external_api_logs`에 남는다
- [ ] 외부 API 1개 실패해도 fallback baseline으로 점수 산출
- [ ] 우선순위 조합이 다르면 결과 순위가 달라진다
- [ ] 사용자 좌표 반경 + travel_time 내 후보만 추천
- [ ] LLM 응답이 JSON 스키마 위반 시 fallback 텍스트 사용
- [ ] 금지 표현 ("치료", "효능 단정") 감지 시 fallback 사용
- [ ] 평균 응답 2초 이내
- [ ] `recommendation_sessions.status`가 `completed` 또는 `failed`

## 11. 오류/빈 상태

- 후보 숲 0개: results 빈 배열 + status='completed' + empty 표시
- API 모두 실패: status='failed', last_error 기록, 사용자에게 재시도 안내
- LLM 실패: fallback 텍스트로 응답 (점수는 정상)
- Webhook 타임아웃 (10초): server action이 status='timeout' 처리

## 12. 보안/권한

- Webhook에 `N8N_WEBHOOK_SECRET` 헤더 검증
- API 키는 n8n 환경변수
- 사용자 좌표는 응답 후 폐기 (Supabase에 영구 저장 X)

## 13. 의료/법적 안전 기준

- 추천 이유에 "치료" "효능 단정" 금지
- LLM 프롬프트에 안전 가이드라인 명시
- 사후 안전 필터로 한 번 더 검증
- 응답에 데이터 출처 명시

## 14. 테스트 계획

### Unit

- score-formatter.test.ts: 5축 점수 정규화
- recommendation.schema.test.ts: JSON 응답 검증
- 가중치 적용: 같은 후보 + 다른 우선순위 → 다른 총점

### Integration

- server action → mock webhook → 결과 DB 저장 → 응답 검증
- LLM 응답 mock: valid JSON / invalid JSON / 금지 표현

### E2E

- 입력 폼 → 실제 n8n 호출 → 결과 카드 표시 (스테이징 환경)

## 15. 완료 후 문서 업데이트

- [ ] PRD 업데이트 필요 없음
- [ ] TRD 업데이트 필요 없음
- [ ] REQUIREMENTS 업데이트 필요 없음
- [ ] TESTING 업데이트 필요 없음
