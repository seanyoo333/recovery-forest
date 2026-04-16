-- ingredient_experiences 선택 드롭다운 필드를 nullable로 전환
-- usage_goal 기타 입력을 위한 usage_goal_other 컬럼 추가
-- 사용 경험 댓글 테이블 추가

ALTER TABLE public.ingredient_experiences
  ALTER COLUMN usage_goal DROP NOT NULL,
  ALTER COLUMN usage_goal DROP DEFAULT,
  ALTER COLUMN duration_label DROP NOT NULL,
  ALTER COLUMN duration_label DROP DEFAULT,
  ALTER COLUMN form_factor DROP NOT NULL,
  ALTER COLUMN form_factor DROP DEFAULT,
  ALTER COLUMN summary_label DROP NOT NULL,
  ALTER COLUMN summary_label DROP DEFAULT;

ALTER TABLE public.ingredient_experiences
  ADD COLUMN IF NOT EXISTS usage_goal_other text;

CREATE TABLE IF NOT EXISTS public.ingredient_experience_replies (
  experience_reply_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  experience_id bigint NOT NULL REFERENCES public.ingredient_experiences(experience_id) ON DELETE CASCADE,
  parent_id bigint REFERENCES public.ingredient_experience_replies(experience_reply_id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
  reply text NOT NULL,
  created_at timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul'),
  updated_at timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')
);

ALTER TABLE public.ingredient_experience_replies
  ADD COLUMN IF NOT EXISTS parent_id bigint;

DO $$
BEGIN
  ALTER TABLE public.ingredient_experience_replies
    ADD CONSTRAINT ingredient_experience_replies_parent_id_fkey
    FOREIGN KEY (parent_id)
    REFERENCES public.ingredient_experience_replies(experience_reply_id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ingredient_experience_replies_experience_created_at_idx
  ON public.ingredient_experience_replies (experience_id, created_at DESC);

ALTER TABLE public.ingredient_experience_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredient-experience-replies-select-policy" ON public.ingredient_experience_replies;
CREATE POLICY "ingredient-experience-replies-select-policy"
  ON public.ingredient_experience_replies
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "ingredient-experience-replies-insert-policy" ON public.ingredient_experience_replies;
CREATE POLICY "ingredient-experience-replies-insert-policy"
  ON public.ingredient_experience_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "ingredient-experience-replies-update-policy" ON public.ingredient_experience_replies;
CREATE POLICY "ingredient-experience-replies-update-policy"
  ON public.ingredient_experience_replies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "ingredient-experience-replies-delete-policy" ON public.ingredient_experience_replies;
CREATE POLICY "ingredient-experience-replies-delete-policy"
  ON public.ingredient_experience_replies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);
