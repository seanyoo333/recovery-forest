# 트리거 파일 비교 분석

## 주요 차이점

### 1. **Role 처리 방식** (가장 중요한 차이)

**handle_sign_up.sql (작동 안 함):**
```sql
-- 14번 줄: 메타데이터에서 role을 가져오려고 시도
(new.raw_user_meta_data ->> 'role')::user_role
```
- 문제: role이 null이거나 잘못된 값일 경우 타입 변환 오류 발생
- 문제: `marketing_consent`도 null일 수 있음

**handle_sign_up1.sql (작동함):**
```sql
-- 12번 줄: 하드코딩된 role
'patient'
```
- 장점: 타입 변환 오류 없음
- 단점: 사용자가 선택한 role이 무시됨

### 2. **조건문 우선순위 문제** (두 파일 모두)

**11번 줄 (두 파일 모두):**
```sql
if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'email' OR new.raw_app_meta_data ->> 'provider' ='phone' then
```

이 조건문은 다음과 같이 해석됩니다:
```sql
(new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'email') 
OR 
(new.raw_app_meta_data ->> 'provider' ='phone')
```

즉, provider가 없어도 phone 조건만 만족하면 실행됩니다!

올바른 조건문:
```sql
if (new.raw_app_meta_data ? 'provider' AND (new.raw_app_meta_data ->> 'provider' = 'email' OR new.raw_app_meta_data ->> 'provider' = 'phone')) then
```

### 3. **구조적 문제**

**handle_sign_up.sql:**
- 21-34번 줄의 소셜 로그인 처리가 `if new.raw_app_meta_data is not null then` 블록 안에 있음
- 하지만 들여쓰기가 잘못되어 있어 혼란스러움
- 27번 줄: GitHub에 `marketing_consent` 누락 (NOT NULL 제약 위반 가능)
- 32번 줄: Google에 `marketing_consent` 누락 (NOT NULL 제약 위반 가능)

**handle_sign_up1.sql:**
- 구조는 비슷하지만 role을 하드코딩해서 오류를 피함
- 21번 줄: 문법 오류 (`preferred_username', ||` - 쉼표가 잘못됨)
- 25번 줄: GitHub에 `marketing_consent` 누락

### 4. **기본 Role 값**

- **handle_sign_up.sql**: `'other'`
- **handle_sign_up1.sql**: `'patient'`

## 왜 handle_sign_up1.sql이 작동하는가?

1. **Role 하드코딩**: 타입 변환 오류를 피함
2. **단순한 구조**: 복잡한 타입 변환 없이 작동

## 해결 방법

올바른 트리거 코드를 작성해야 합니다:

```sql
-- 조건문 수정
if (new.raw_app_meta_data is null OR NOT (new.raw_app_meta_data ? 'provider')) OR 
   (new.raw_app_meta_data ->> 'provider' = 'email' OR new.raw_app_meta_data ->> 'provider' = 'phone') then

-- Role 안전하게 처리
COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'patient'::user_role)

-- Marketing consent 안전하게 처리
COALESCE((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false)
```




