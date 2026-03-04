-- target_to_meta_axis: target_id 기준으로 target_slug 자동 설정
-- INSERT 또는 target_id 변경 시 natural_targets.slug를 조회하여 target_slug에 채움

CREATE OR REPLACE FUNCTION trg_target_to_meta_axis_sync_target_slug()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  SELECT slug INTO NEW.target_slug
  FROM natural_targets
  WHERE id = NEW.target_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_target_to_meta_axis_sync_slug ON target_to_meta_axis;

CREATE TRIGGER trg_target_to_meta_axis_sync_slug
  BEFORE INSERT OR UPDATE OF target_id
  ON target_to_meta_axis
  FOR EACH ROW
  EXECUTE FUNCTION trg_target_to_meta_axis_sync_target_slug();
