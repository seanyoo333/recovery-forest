# SPEC: 추천 결과 페이지

## 1. 기능명

회복 숲 추천 결과 페이지 (`/recommend/results/:sessionId`)

## 2. 배경

추천 엔진이 반환한 TOP 5 숲을 사용자가 한 화면에서 비교하고 다음 행동(숲 상세)으로 이동할 수 있어야 한다.

## 3. 대상 사용자

- Primary: 회복기 중장년 모바일 사용자
- Secondary: 대회 심사위원

## 4. 사용자 문제

- 단순 목록만 보여주면 비교가 어렵다.
- "왜 이게 1위인지" 모르면 신뢰하지 않는다.
- 모바일에서 카드가 잘려 보이면 답답하다.

## 5. 목표

- TOP 5를 한 화면에서 스크롤로 비교 가능
- 1위 카드는 즉시 보임 (above the fold)
- 점수 시각화(레이더 차트)로 5축 차이 직관 표시

## 6. 범위

### 포함

- sessionId 기반 결과 로드
- 각 카드: 순위 / 숲 이름·종류·지역 / 회복점수 / 5축 레이더 / 추천 이유 / 주의사항 / 추천 활동 / 예상 피톤치드 / 현재 기상·미세먼지 / 이동 시간 / "자세히 보기" 링크
- "다시 추천 받기" 버튼 → `/recommend`로
- "공유하기" 버튼 (카카오톡/링크 복사, 선택)
- 데이터 출처 footer

### 제외

- 회원가입 / 저장 (MVP 외)
- 결제 / 예약
- 후속 챗봇 (Phase 2)

## 7. 사용자 흐름

```text
1. `/recommend/results/:sessionId` 진입
2. Loader가 Supabase에서 session 조회
3. status='pending'이면 polling (2초 간격, 최대 30초)
4. status='completed'이면 TOP 5 카드 렌더
5. status='failed'이면 에러 표시 + 재시도 버튼
6. 사용자가 카드 클릭 → `/forests/:forestId` 이동
```

## 8. 입력 데이터

- URL param: `sessionId`
- Supabase `recommendation_sessions` row 조회

## 9. 출력/화면 결과

- 헤더: "오늘의 회복 숲 추천 TOP 5"
- 5개 카드 (mobile: 1열 stacked, desktop: 1열 wider)
- 각 카드는 score-radar 컴포넌트 포함
- footer: 데이터 출처, 추천 시각

## 10. 수용 기준

- [ ] sessionId 유효 → TOP 5 카드 표시
- [ ] sessionId 무효 → 404 또는 "추천을 찾을 수 없어요"
- [ ] status='pending' → 로딩 상태 + polling
- [ ] status='failed' → 에러 메시지 + 재시도 CTA
- [ ] 모바일 360px에서 카드 깨지지 않음
- [ ] 레이더 차트 접근성 (alt text)
- [ ] 결과가 빈 배열이면 "조건에 맞는 숲을 찾지 못했어요" empty state
- [ ] 카드 클릭 시 `/forests/:forestId` 이동

## 11. 오류/빈 상태

- Loading: 카드 5개 skeleton
- Empty: "조건에 맞는 숲을 찾지 못했어요" + 조건 변경 안내
- Error: "결과를 가져오지 못했어요" + 재시도 + 처음 화면 링크
- Unauthorized: 해당 없음
- Polling timeout (30초): "예상보다 오래 걸려요. 잠시 후 다시 확인" + reload

## 12. 보안/권한

- session_id는 URL에 노출되지만 익명. 민감 정보 미포함.
- 다른 사용자의 session_id를 추측해도 의미 있는 개인정보 없음

## 13. 의료/법적 안전 기준

- 카드의 reason/caution은 LLM 출력 그대로 노출 금지 → 안전 필터 통과한 텍스트만
- "효능 보장" 단정 금지
- 데이터 출처 표기 의무 (산림청·기상청·에어코리아)

## 14. 테스트 계획

### Unit

- score-radar 컴포넌트 렌더링
- result-card 컴포넌트 데이터 binding

### Integration

- loader: sessionId → DB 조회 → 데이터 반환
- polling 로직 (status 전환)

### E2E

- 입력 → 결과 페이지 → 카드 1개 클릭 → 상세 이동

## 15. 완료 후 문서 업데이트

- [ ] PRD 업데이트 필요 없음
- [ ] TRD 업데이트 필요 없음
- [ ] REQUIREMENTS 업데이트 필요 없음
- [ ] TESTING 업데이트 필요 없음
