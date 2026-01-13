# Seeding 파일 실행 순서

레이더 차트가 정상 작동하려면 다음 순서로 SQL 파일을 실행해야 합니다:

## 실행 순서

1. **natural_targets.sql**
   - 타겟 데이터 삽입
   - `target_to_meta_axis` 및 `natural_targets` 삭제 후 재삽입

2. **natural_ingredients.sql**
   - 천연물 성분 데이터 삽입
   - `ingredient_target_evidence_sources`, `ingredient_target_evidence`, `natural_ingredients` 삭제 후 재삽입

3. **target_to_meta_axis.sql**
   - 타겟 → 메타축 매핑 데이터 삽입
   - `target_to_meta_axis` 삭제 후 재삽입
   - 새로운 5축 구조에 맞게 매핑

4. **ingredient_target_evidence.sql**
   - 성분 → 타겟 근거 데이터 삽입
   - 레이더 차트 계산을 위한 핵심 데이터

## 선택적 파일

- **ingredient_target_evidence_sources.sql** (선택적)
  - VIEW 작동에는 필수 아님 (LEFT JOIN 사용)
  - 논문 출처 정보가 필요한 경우에만 실행

## 실행 방법

```bash
# Supabase SQL Editor 또는 psql에서 순서대로 실행
psql -U postgres -d your_database -f sql/seeds/natural_targets.sql
psql -U postgres -d your_database -f sql/seeds/natural_ingredients.sql
psql -U postgres -d your_database -f sql/seeds/target_to_meta_axis.sql
psql -U postgres -d your_database -f sql/seeds/ingredient_target_evidence.sql
```

## 데이터 구조

### natural_targets
- 타겟 정의 (NF-κB, AMPK, EGFR 등)
- 총 77개 타겟

### natural_ingredients
- 천연물 성분 정의 (커큐민, 베르베린, 레스베라트롤 등)
- 총 30개 이상 성분

### target_to_meta_axis
- 타겟 → 5축 매핑
  - `metabolic_pressure`: 대사 안정화 (22개 타겟)
  - `immune_balance`: 면역 균형 (7개 타겟)
  - `abnormal_signals`: 비정상 신호조절 (12개 타겟)
  - `neuro_stress`: 신경·스트레스 (현재 타겟 없음)
  - `recovery`: 회복증진 (16개 타겟)

### ingredient_target_evidence
- 성분 → 타겟 근거 데이터
- `strength`: 0~1 범위
- `study_type`: 연구 유형 (systematic_review, rct, human_observational, case_report, animal, cell, mechanistic)

## VIEW 확인

모든 데이터 삽입 후 다음 VIEW가 정상 작동해야 합니다:

```sql
SELECT * FROM ingredient_target_evidence_full_view LIMIT 10;
```

이 VIEW는 레이더 차트 계산에 사용됩니다.

