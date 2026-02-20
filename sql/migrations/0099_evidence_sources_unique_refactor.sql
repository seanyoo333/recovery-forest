-- evidence_sources: title_norm/canonical_id 제거, doi_norm/pmid/title_year_key 유니크로 관리
-- Step 1: 기존 유니크 인덱스 제거
DROP INDEX IF EXISTS evidence_sources_pmid_unique_idx;
--> statement-breakpoint
DROP INDEX IF EXISTS evidence_sources_pmid_unique;
--> statement-breakpoint
DROP INDEX IF EXISTS evidence_sources_doi_unique_idx;
--> statement-breakpoint
DROP INDEX IF EXISTS evidence_sources_doi_norm_unique;
--> statement-breakpoint
DROP INDEX IF EXISTS evidence_sources_title_year_key_unique;
--> statement-breakpoint

-- Step 2: title_norm, canonical_id 컬럼 제거
ALTER TABLE evidence_sources DROP COLUMN IF EXISTS title_norm;
--> statement-breakpoint
ALTER TABLE evidence_sources DROP COLUMN IF EXISTS canonical_id;
--> statement-breakpoint

-- Step 3: doi_norm 컬럼 추가 및 doi → doi_norm 마이그레이션
ALTER TABLE evidence_sources ADD COLUMN IF NOT EXISTS doi_norm text;
--> statement-breakpoint
UPDATE evidence_sources SET doi_norm = doi WHERE doi_norm IS NULL AND doi IS NOT NULL AND doi != '';
--> statement-breakpoint

-- Step 4: title_year_key 생성 컬럼 추가 (doi_norm, pmid가 null일 때 title:year로 유니크)
-- year가 text로 저장되어 ''일 수 있어, regex로 숫자만 허용 (invalid input syntax for integer 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'evidence_sources' AND column_name = 'title_year_key'
  ) THEN
    ALTER TABLE evidence_sources
    ADD COLUMN title_year_key text
    GENERATED ALWAYS AS (
      CASE
        WHEN (doi_norm IS NULL AND pmid IS NULL AND title IS NOT NULL AND trim(title) != ''
          AND year IS NOT NULL AND year::text ~ '^\d{1,5}$')
        THEN (trim(title) || ':' || year::text)
        ELSE NULL
      END
    ) STORED;
  END IF;
END $$;
--> statement-breakpoint

-- Step 5: 빈 문자열을 NULL로 정규화 (plain UNIQUE 시 NULL 중복 허용)
UPDATE evidence_sources SET doi_norm = NULL WHERE doi_norm = '';
--> statement-breakpoint

-- Step 6: 기존 check 제약 제거 후 새 제약 추가
ALTER TABLE evidence_sources DROP CONSTRAINT IF EXISTS evidence_sources_pmid_or_doi_check;
--> statement-breakpoint
ALTER TABLE evidence_sources DROP CONSTRAINT IF EXISTS evidence_sources_identifier_check;
--> statement-breakpoint
ALTER TABLE evidence_sources ADD CONSTRAINT evidence_sources_identifier_check
  CHECK (("pmid" IS NOT NULL) OR ("doi_norm" IS NOT NULL AND "doi_norm" != '') OR ("title" IS NOT NULL AND "title" != '' AND "year" IS NOT NULL));
--> statement-breakpoint

-- Step 7: plain UNIQUE 인덱스 생성 (Supabase REST on_conflict 매칭용)
-- Postgres UNIQUE는 NULL 자동 중복 허용하므로 WHERE 불필요
CREATE UNIQUE INDEX IF NOT EXISTS evidence_sources_doi_norm_unique
  ON public.evidence_sources (doi_norm);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS evidence_sources_pmid_unique
  ON public.evidence_sources (pmid);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS evidence_sources_title_year_key_unique
  ON public.evidence_sources (title_year_key);
