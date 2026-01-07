-- Fix grid_options unique constraint
-- Change from "one active per category" to "no duplicate templates per category"
-- This allows multiple active templates in the same category

-- 1) Drop the problematic unique index
DROP INDEX IF EXISTS public.grid_options_user_category_active_idx;

-- 2) Create unique index for template options (prevent duplicate templates)
CREATE UNIQUE INDEX IF NOT EXISTS grid_options_user_category_template_uidx
ON public.grid_options(user_id, category, template_id)
WHERE template_id IS NOT NULL;

-- 3) Create unique index for preset options (prevent duplicate labels)
CREATE UNIQUE INDEX IF NOT EXISTS grid_options_user_category_label_uidx
ON public.grid_options(user_id, category, label)
WHERE template_id IS NULL;

