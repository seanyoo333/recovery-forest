CREATE OR REPLACE FUNCTION study_type_rank(study_type text)
RETURNS int
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE study_type
    WHEN 'systematic_review' THEN 6
    WHEN 'rct' THEN 5
    WHEN 'human_observational' THEN 4
    WHEN 'case_report' THEN 3
    WHEN 'animal' THEN 2
    WHEN 'cell' THEN 1
    WHEN 'mechanistic' THEN 0
    ELSE 0
  END;
$$;
