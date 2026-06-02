-- =========================================================
-- 회복의 숲 Evidence Engine 시드 데이터
-- 마이그레이션: 0003_seed_evidence_and_demo
--
-- (1) forest_evidence_sources 6편 — Evidence Base ites 로 대체될 placeholder.
--     실제 논문은 추후 external_ites_id 로 연결/치환 예정.
-- (2) 완료된 더미 여정 5건 — "데이터 축적이 처방 품질을 높인다" insights 데모용.
--
-- 재실행 안전(idempotent): 고정 UUID + ON CONFLICT DO NOTHING.
-- =========================================================

-- ---------------------------------------------------------
-- (1) 근거 논문 카탈로그 (placeholder)
-- ---------------------------------------------------------
insert into forest_evidence_sources (id, mechanism, title, authors, year, source_url, summary)
values
  ('e0000000-0000-0000-0000-000000000001', 'phytoncide',
   'Forest environments and phytoncide exposure', 'Li Q.', 2010,
   'https://pubmed.ncbi.nlm.nih.gov/19568839/',
   '산림 환경의 피톤치드 노출과 면역 지표 변화 보고 (placeholder)'),
  ('e0000000-0000-0000-0000-000000000002', 'cortisol',
   'Physiological effects of Shinrin-yoku on salivary cortisol', 'Park B.J. et al.', 2010,
   'https://pubmed.ncbi.nlm.nih.gov/19568835/',
   '산림 노출 후 타액 코르티솔 변화 관찰 (placeholder)'),
  ('e0000000-0000-0000-0000-000000000003', 'nk_cell',
   'Forest bathing and natural killer cell activity', 'Li Q. et al.', 2008,
   'https://pubmed.ncbi.nlm.nih.gov/18336737/',
   '산림 체류와 NK세포 활성 관련 보고 (placeholder)'),
  ('e0000000-0000-0000-0000-000000000004', 'parasympathetic',
   'Forest walking and parasympathetic nervous activity', 'Lee J. et al.', 2011,
   'https://pubmed.ncbi.nlm.nih.gov/21431424/',
   '산림 보행과 부교감신경 활성 변화 (placeholder)'),
  ('e0000000-0000-0000-0000-000000000005', 'blood_pressure',
   'Forest therapy and blood pressure', 'Ideno Y. et al.', 2017,
   'https://pubmed.ncbi.nlm.nih.gov/28814305/',
   '산림치유와 혈압 지표 관련 메타분석 (placeholder)'),
  ('e0000000-0000-0000-0000-000000000006', 'sleep',
   'Forest environment and sleep quality', 'Morita E. et al.', 2011,
   'https://pubmed.ncbi.nlm.nih.gov/21796205/',
   '산림 환경과 수면의 질 관련 보고 (placeholder)')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- (2) 더미 여정 5건 (status=reported)
--     공통 가설: 수면 +2, 피로 -2.  코호트 적중 8/10 = 80%.
-- ---------------------------------------------------------

-- journeys
insert into journeys (id, journey_token, email, status, consent_version, consented_at, created_at, updated_at)
values
  ('d0000000-0000-0000-0000-000000000001', 'demo-journey-1', null, 'reported', 'consent-v1', now(), now(), now()),
  ('d0000000-0000-0000-0000-000000000002', 'demo-journey-2', null, 'reported', 'consent-v1', now(), now(), now()),
  ('d0000000-0000-0000-0000-000000000003', 'demo-journey-3', null, 'reported', 'consent-v1', now(), now(), now()),
  ('d0000000-0000-0000-0000-000000000004', 'demo-journey-4', null, 'reported', 'consent-v1', now(), now(), now()),
  ('d0000000-0000-0000-0000-000000000005', 'demo-journey-5', null, 'reported', 'consent-v1', now(), now(), now())
on conflict (id) do nothing;

-- pre_surveys
insert into pre_surveys (journey_id, sleep_score, fatigue_score, mood_score, stress_score, months_since_treatment, recommendation_input)
values
  ('d0000000-0000-0000-0000-000000000001', 4, 7, 5, 6, 12, '{"note":"demo"}'),
  ('d0000000-0000-0000-0000-000000000002', 5, 6, 4, 7, 8,  '{"note":"demo"}'),
  ('d0000000-0000-0000-0000-000000000003', 3, 8, 5, 6, 18, '{"note":"demo"}'),
  ('d0000000-0000-0000-0000-000000000004', 6, 7, 6, 5, 24, '{"note":"demo"}'),
  ('d0000000-0000-0000-0000-000000000005', 4, 6, 4, 7, 6,  '{"note":"demo"}')
on conflict (journey_id) do nothing;

-- prescriptions (target_outcome = 수면 +2, 피로 -2)
insert into prescriptions (id, journey_id, status, action_plan, target_outcome, post_measurement_plan, ai_summary, llm_model, completed_at)
values
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'completed',
   '{"place_name":"가까운 치유의 숲","visit_window":"이번 주 오전 9-11시","duration_min":90,"intensity":"moderate","steps":[]}',
   '[{"axis":"sleep","direction":"increase","expected_delta":2},{"axis":"fatigue","direction":"decrease","expected_delta":2}]',
   '{"axes":["sleep","fatigue"],"timing":"방문 3일 후"}',
   '맞춤 산림치유 처방 (demo)', 'stub', now()),
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'completed',
   '{"place_name":"가까운 치유의 숲","visit_window":"이번 주 오전 9-11시","duration_min":90,"intensity":"moderate","steps":[]}',
   '[{"axis":"sleep","direction":"increase","expected_delta":2},{"axis":"fatigue","direction":"decrease","expected_delta":2}]',
   '{"axes":["sleep","fatigue"],"timing":"방문 3일 후"}',
   '맞춤 산림치유 처방 (demo)', 'stub', now()),
  ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'completed',
   '{"place_name":"가까운 치유의 숲","visit_window":"이번 주 오전 9-11시","duration_min":60,"intensity":"low","steps":[]}',
   '[{"axis":"sleep","direction":"increase","expected_delta":2},{"axis":"fatigue","direction":"decrease","expected_delta":2}]',
   '{"axes":["sleep","fatigue"],"timing":"방문 3일 후"}',
   '맞춤 산림치유 처방 (demo)', 'stub', now()),
  ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'completed',
   '{"place_name":"가까운 치유의 숲","visit_window":"이번 주 오전 9-11시","duration_min":120,"intensity":"high","steps":[]}',
   '[{"axis":"sleep","direction":"increase","expected_delta":2},{"axis":"fatigue","direction":"decrease","expected_delta":2}]',
   '{"axes":["sleep","fatigue"],"timing":"방문 3일 후"}',
   '맞춤 산림치유 처방 (demo)', 'stub', now()),
  ('c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'completed',
   '{"place_name":"가까운 치유의 숲","visit_window":"이번 주 오전 9-11시","duration_min":90,"intensity":"moderate","steps":[]}',
   '[{"axis":"sleep","direction":"increase","expected_delta":2},{"axis":"fatigue","direction":"decrease","expected_delta":2}]',
   '{"axes":["sleep","fatigue"],"timing":"방문 3일 후"}',
   '맞춤 산림치유 처방 (demo)', 'stub', now())
on conflict (id) do nothing;

-- prescription_citations
insert into prescription_citations (prescription_id, evidence_source_id, mechanism)
values
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006', 'sleep'),
  ('c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'cortisol'),
  ('c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'phytoncide'),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'parasympathetic'),
  ('c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000003', 'nk_cell')
on conflict do nothing;

-- post_surveys
insert into post_surveys (journey_id, sleep_score, fatigue_score, mood_score, stress_score, impression)
values
  ('d0000000-0000-0000-0000-000000000001', 6, 5, 6, 5, '한결 가벼워졌어요'),
  ('d0000000-0000-0000-0000-000000000002', 7, 5, 6, 6, '잠이 잘 왔어요'),
  ('d0000000-0000-0000-0000-000000000003', 6, 6, 7, 4, '머리가 맑아졌어요'),
  ('d0000000-0000-0000-0000-000000000004', 7, 5, 6, 5, '개운했어요'),
  ('d0000000-0000-0000-0000-000000000005', 7, 4, 5, 5, '컨디션이 좋아졌어요')
on conflict (journey_id) do nothing;

-- reports (delta_summary 전체 4축, hit_miss 가설 2축)
insert into reports (journey_id, status, delta_summary, hit_miss, narrative, citations_snapshot, llm_model)
values
  ('d0000000-0000-0000-0000-000000000001', 'completed',
   '[{"axis":"sleep","pre":4,"post":6,"delta":2,"improved":true},{"axis":"fatigue","pre":7,"post":5,"delta":-2,"improved":true},{"axis":"mood","pre":5,"post":6,"delta":1,"improved":true},{"axis":"stress","pre":6,"post":5,"delta":-1,"improved":true}]',
   '[{"axis":"sleep","target_delta":2,"actual_delta":2,"hit":true},{"axis":"fatigue","target_delta":-2,"actual_delta":-2,"hit":true}]',
   '자가보고 기준으로 수면, 피로 항목에서 긍정적인 변화가 나타났어요.', '[]', 'stub'),
  ('d0000000-0000-0000-0000-000000000002', 'completed',
   '[{"axis":"sleep","pre":5,"post":7,"delta":2,"improved":true},{"axis":"fatigue","pre":6,"post":5,"delta":-1,"improved":true},{"axis":"mood","pre":4,"post":6,"delta":2,"improved":true},{"axis":"stress","pre":7,"post":6,"delta":-1,"improved":true}]',
   '[{"axis":"sleep","target_delta":2,"actual_delta":2,"hit":true},{"axis":"fatigue","target_delta":-2,"actual_delta":-1,"hit":false}]',
   '자가보고 기준으로 수면 항목에서 목표만큼 변화가 나타났어요.', '[]', 'stub'),
  ('d0000000-0000-0000-0000-000000000003', 'completed',
   '[{"axis":"sleep","pre":3,"post":6,"delta":3,"improved":true},{"axis":"fatigue","pre":8,"post":6,"delta":-2,"improved":true},{"axis":"mood","pre":5,"post":7,"delta":2,"improved":true},{"axis":"stress","pre":6,"post":4,"delta":-2,"improved":true}]',
   '[{"axis":"sleep","target_delta":2,"actual_delta":3,"hit":true},{"axis":"fatigue","target_delta":-2,"actual_delta":-2,"hit":true}]',
   '자가보고 기준으로 수면, 피로 항목에서 긍정적인 변화가 나타났어요.', '[]', 'stub'),
  ('d0000000-0000-0000-0000-000000000004', 'completed',
   '[{"axis":"sleep","pre":6,"post":7,"delta":1,"improved":true},{"axis":"fatigue","pre":7,"post":5,"delta":-2,"improved":true},{"axis":"mood","pre":6,"post":6,"delta":0,"improved":false},{"axis":"stress","pre":5,"post":5,"delta":0,"improved":false}]',
   '[{"axis":"sleep","target_delta":2,"actual_delta":1,"hit":false},{"axis":"fatigue","target_delta":-2,"actual_delta":-2,"hit":true}]',
   '자가보고 기준으로 피로 항목에서 목표만큼 변화가 나타났어요.', '[]', 'stub'),
  ('d0000000-0000-0000-0000-000000000005', 'completed',
   '[{"axis":"sleep","pre":4,"post":7,"delta":3,"improved":true},{"axis":"fatigue","pre":6,"post":4,"delta":-2,"improved":true},{"axis":"mood","pre":4,"post":5,"delta":1,"improved":true},{"axis":"stress","pre":7,"post":5,"delta":-2,"improved":true}]',
   '[{"axis":"sleep","target_delta":2,"actual_delta":3,"hit":true},{"axis":"fatigue","target_delta":-2,"actual_delta":-2,"hit":true}]',
   '자가보고 기준으로 수면, 피로 항목에서 긍정적인 변화가 나타났어요.', '[]', 'stub')
on conflict (journey_id) do nothing;
