-- 의무기록사본 저장: patient_health_profiles에 medical_record_transcripts JSONB 컬럼 추가
-- 구조: [{ test_date, test_content, clinical_information, finding, conclusion }]

ALTER TABLE patient_health_profiles
ADD COLUMN IF NOT EXISTS medical_record_transcripts jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN patient_health_profiles.medical_record_transcripts IS '의무기록사본 OCR 결과 배열. 각 항목: test_date, test_content, clinical_information, finding, conclusion';
