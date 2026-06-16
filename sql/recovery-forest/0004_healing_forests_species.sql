-- =====================================================================
-- 0004_healing_forests_species
-- healing_forests 를 처방 엔진(3축) 소스로 사용하기 위해 수종(species) 컬럼과
-- 수종 base 점수 룩업(species_base_scores)을 추가한다.
--   - species: 피톤치드 잠재력 지수의 주(主) 동인. 수종 검토 CSV(seq 매핑) 기준.
--   - species_base_scores: phytoncide-index.ts 의 SPECIES_BASE 를 DB 로 미러링
--     (숲 증가·점수 튜닝을 코드 재배포 없이 가능하게).
-- =====================================================================

-- UP -----------------------------------------------------------------
alter table public.healing_forests
  add column if not exists species text,
  add column if not exists species_confidence text;

create table if not exists public.species_base_scores (
  species text primary key,
  base integer not null,
  note text
);
alter table public.species_base_scores enable row level security;
drop policy if exists "species_base_scores public read" on public.species_base_scores;
create policy "species_base_scores public read" on public.species_base_scores
  for select to anon, authenticated using (true);

insert into public.species_base_scores (species, base, note) values
  ('편백', 85, '침엽 우세종 최고(보고서 p.88: 동일 기온서도 최고)'),
  ('소나무', 65, '보고서 순위 2위'),
  ('리기다소나무', 62, '소나무속'),
  ('낙엽송', 48, '보고서 순위 3위'),
  ('잣나무', 40, '보고서 순위 4위'),
  ('침활혼효림', 35, '침활 혼합'),
  ('자작나무', 26, '활엽 상위'),
  ('기타활엽수', 22, '활엽 기본'),
  ('상수리나무', 18, '참나무류'),
  ('졸참나무', 18, '참나무류'),
  ('굴참나무', 18, '참나무류'),
  ('신갈나무', 18, '참나무류'),
  ('갈참나무', 18, '참나무류'),
  ('참나무', 18, '참나무류'),
  ('층층나무', 16, '활엽 하위'),
  ('미상', 28, '임상도 미확인 잠정값(DEFAULT_BASE)')
on conflict (species) do update set base = excluded.base, note = excluded.note;

-- 수종 검토 CSV(seq 매핑): 자동 4곳(편백 seq 23·26·34, 잣나무 seq 3), 나머지 기타활엽수(잠정)
update public.healing_forests set species = '기타활엽수', species_confidence = '잠정';
update public.healing_forests set species = '편백', species_confidence = '자동' where seq in (23, 26, 34);
update public.healing_forests set species = '잣나무', species_confidence = '자동' where seq = 3;

-- DOWN ---------------------------------------------------------------
-- drop policy if exists "species_base_scores public read" on public.species_base_scores;
-- drop table if exists public.species_base_scores;
-- alter table public.healing_forests drop column if exists species_confidence;
-- alter table public.healing_forests drop column if exists species;
