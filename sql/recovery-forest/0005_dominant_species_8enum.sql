-- =====================================================================
-- 0005_dominant_species_8enum
-- 수종 분류를 단일 enum 컬럼(dominant_species, 8값)으로 정리한다.
--   - species → dominant_species 로 rename, species_confidence 제거(V2 로 미룸).
--   - 개별 활엽수(참나무류·자작나무·층층나무 등) → 기타활엽수, 리기다소나무·곰솔·전나무 → 기타침엽수,
--     침활혼효림/우점없음 → 혼효림 으로 통합.
--   - species_base_scores 를 8값 체계로 재정의(근거 4종 + 설계값 4종).
--   - 근거 강도는 note 로 구분(편백·소나무·낙엽송·잣나무만 '보고서 근거', 나머지는 '설계값').
-- =====================================================================

-- UP -----------------------------------------------------------------
alter table public.healing_forests rename column species to dominant_species;
alter table public.healing_forests drop column if exists species_confidence;

update public.healing_forests set dominant_species = '기타활엽수'
  where dominant_species in ('상수리나무','졸참나무','굴참나무','신갈나무','갈참나무','참나무','자작나무','층층나무');
update public.healing_forests set dominant_species = '기타침엽수'
  where dominant_species in ('리기다소나무','곰솔','전나무');
update public.healing_forests set dominant_species = '혼효림'
  where dominant_species in ('침활혼효림','우점없음');
update public.healing_forests set dominant_species = '미상'
  where dominant_species = '';

alter table public.healing_forests drop constraint if exists healing_forests_dominant_species_chk;
alter table public.healing_forests add constraint healing_forests_dominant_species_chk
  check (dominant_species is null or dominant_species in
    ('편백','소나무','낙엽송','잣나무','기타침엽수','기타활엽수','혼효림','미상'));

delete from public.species_base_scores;
insert into public.species_base_scores (species, base, note) values
  ('편백', 85, '보고서 순위 1위 (국립산림과학원, p.88)'),
  ('소나무', 65, '보고서 순위 2위'),
  ('낙엽송', 48, '보고서 순위 3위'),
  ('잣나무', 40, '보고서 순위 4위'),
  ('기타침엽수', 50, '설계값 (침엽수 보조분류, 낮은 확신도)'),
  ('기타활엽수', 22, '설계값 (활엽수 보조분류, 낮은 확신도)'),
  ('혼효림', 35, '설계값 (침엽+활엽 혼합, 중간값)'),
  ('미상', 30, '중립 기본값');

-- V2(임상도 1:5000 연동 시 추가, 지금은 미구현):
--   forest_type(침엽수림/활엽수림/혼효림/죽림), dominant_species_ratio(우점 %),
--   species_source(forest_map/facility_page/manual), species_confidence(high/medium/low)

-- DOWN ---------------------------------------------------------------
-- alter table public.healing_forests drop constraint if exists healing_forests_dominant_species_chk;
-- alter table public.healing_forests rename column dominant_species to species;
-- alter table public.healing_forests add column if not exists species_confidence text;
-- (species_base_scores 는 0004 시드로 복원)
