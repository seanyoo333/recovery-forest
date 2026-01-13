CREATE OR REPLACE FUNCTION trg_recompute_primary_after_ites_change()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_ite_id uuid;
BEGIN
  v_ite_id := COALESCE(NEW.ingredient_target_evidence_id, OLD.ingredient_target_evidence_id);
  PERFORM recompute_primary_for_ite(v_ite_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS ites_recompute_primary_ins ON ingredient_target_evidence_sources;
DROP TRIGGER IF EXISTS ites_recompute_primary_upd ON ingredient_target_evidence_sources;
DROP TRIGGER IF EXISTS ites_recompute_primary_del ON ingredient_target_evidence_sources;

CREATE TRIGGER ites_recompute_primary_ins
AFTER INSERT ON ingredient_target_evidence_sources
FOR EACH ROW EXECUTE FUNCTION trg_recompute_primary_after_ites_change();

CREATE TRIGGER ites_recompute_primary_upd
AFTER UPDATE ON ingredient_target_evidence_sources
FOR EACH ROW EXECUTE FUNCTION trg_recompute_primary_after_ites_change();

CREATE TRIGGER ites_recompute_primary_del
AFTER DELETE ON ingredient_target_evidence_sources
FOR EACH ROW EXECUTE FUNCTION trg_recompute_primary_after_ites_change();
