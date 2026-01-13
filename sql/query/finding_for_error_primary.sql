-- primary가 0개인 ite
SELECT ite.id, ni.slug AS ingredient, nt.slug AS target
FROM ingredient_target_evidence ite
JOIN natural_ingredients ni ON ni.id = ite.ingredient_id
JOIN natural_targets nt ON nt.id = ite.target_id
LEFT JOIN ingredient_target_evidence_sources ites
  ON ites.ingredient_target_evidence_id = ite.id AND ites.is_primary = true
WHERE ites.id IS NULL;

-- primary가 2개 이상인 ite (원래 인덱스가 막아야 정상)
SELECT ingredient_target_evidence_id, COUNT(*) 
FROM ingredient_target_evidence_sources
WHERE is_primary = true
GROUP BY 1
HAVING COUNT(*) > 1;
