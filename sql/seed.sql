-- Seed data for Supaplate database
-- Profile ID to use: 'd54d4893-d74f-429c-9b4a-f84ce0607552'

-- Reset sequences to ensure consistent IDs
ALTER SEQUENCE "topics_topic_id_seq" RESTART WITH 1;
ALTER SEQUENCE "products_product_id_seq" RESTART WITH 1;
ALTER SEQUENCE "posts_post_id_seq" RESTART WITH 1;
ALTER SEQUENCE "post_replies_post_reply_id_seq" RESTART WITH 1;
ALTER SEQUENCE "clinics_clinic_id_seq" RESTART WITH 1;
ALTER SEQUENCE "clinic_photos_photo_id_seq" RESTART WITH 1;
ALTER SEQUENCE "categories_category_id_seq" RESTART WITH 1;
ALTER SEQUENCE "reviews_review_id_seq" RESTART WITH 1;
ALTER SEQUENCE "team_team_id_seq" RESTART WITH 1;
ALTER SEQUENCE "message_rooms_message_room_id_seq" RESTART WITH 1;
ALTER SEQUENCE "messages_message_id_seq" RESTART WITH 1;
ALTER SEQUENCE "notifications_notification_id_seq" RESTART WITH 1;
ALTER SEQUENCE "payments_payment_id_seq" RESTART WITH 1;

-- Topics table (5 rows)
INSERT INTO "topics" ("name", "slug") VALUES
('건강 관리', 'health-management'),
('영양 및 다이어트', 'nutrition-diet'),
('운동 및 피트니스', 'exercise-fitness'),
('정신 건강', 'mental-health'),
('의료 정보', 'medical-info');

-- Categories table (5 rows)
INSERT INTO "categories" ("name", "description") VALUES
('건강 관리', '전반적인 건강 관리 제품 및 서비스'),
('영양 보조제', '비타민, 미네랄, 영양 보조제'),
('운동 장비', '홈 운동 및 피트니스 장비'),
('웰빙 제품', '정신 건강 및 웰빙 관련 제품'),
('의료 기기', '가정용 의료 기기 및 모니터링 도구');

-- Clinics table (5 rows)
INSERT INTO "clinics" ("position", "overview", "responsibilities", "qualifications", "benefits", "skills", "clinic_name", "clinic_logo", "clinic_location", "apply_url", "clinic_type", "location", "level") VALUES
('내과 전문의', '종합 내과 진료 및 건강 관리', '환자 진료, 건강 상담, 예방 의학', '의사 면허, 내과 전문의 자격', '의료보험, 퇴직연금, 연차휴가', '진단, 치료, 환자 관리', '서울내과의원', 'https://example.com/logo1.png', '서울시 강남구', 'https://example.com/apply1', 'university', 'seoul', '5'),
('영양사', '개인 맞춤 영양 상담 및 다이어트 관리', '영양 평가, 식단 설계, 영양 교육', '영양사 자격증, 관련 경력 3년 이상', '의료보험, 성과급, 교육 지원', '영양 분석, 식단 설계, 상담', '건강영양센터', 'https://example.com/logo2.png', '경기도 성남시', 'https://example.com/apply2', 'functional', 'gyeonggi', '4'),
('물리치료사', '재활 치료 및 운동 처방', '재활 평가, 운동 처방, 치료 진행', '물리치료사 자격증, 관련 경력 2년 이상', '의료보험, 퇴직연금, 연차휴가', '재활 치료, 운동 처방, 환자 관리', '부산재활의원', 'https://example.com/logo3.png', '부산시 해운대구', 'https://example.com/apply3', 'nursing', 'busan', '3'),
('한의사', '전통 한의학 진료 및 건강 관리', '한의 진단, 침구 치료, 한약 처방', '한의사 면허, 관련 경력 5년 이상', '의료보험, 퇴직연금, 연차휴가', '한의 진단, 침구, 한약', '전통한의원', 'https://example.com/logo4.png', '서울시 종로구', 'https://example.com/apply4', 'traditional', 'seoul', '4'),
('간호사', '환자 간호 및 건강 관리', '환자 간호, 건강 교육, 의료 보조', '간호사 면허, 관련 경력 1년 이상', '의료보험, 퇴직연금, 연차휴가', '환자 간호, 건강 교육, 의료 보조', '건강간호센터', 'https://example.com/logo5.png', '경기도 수원시', 'https://example.com/apply5', 'nursing', 'gyeonggi', '2');

-- Products table (5 rows)
INSERT INTO "products" ("name", "tagline", "description", "how_it_works", "price", "icon", "url", "stats", "profile_id", "category_id") VALUES
('헬스 트래커 Pro', '24시간 건강 모니터링', '심박수, 걸음 수, 수면 품질을 실시간으로 추적하는 스마트 워치', '블루투스 연결로 스마트폰과 연동하여 건강 데이터를 자동으로 기록하고 분석합니다.', 299000, 'https://example.com/icon1.png', 'https://example.com/product1', '{"views": 1250, "reviews": 89, "upvotes": 156}', 'd54d4893-d74f-429c-9b4a-f84ce0607552', 1),
('프리미엄 멀티비타민', '완벽한 영양 보충', '50가지 이상의 필수 비타민과 미네랄을 포함한 종합 영양제', '하루 1정씩 식사와 함께 복용하여 부족한 영양소를 보충합니다.', 89000, 'https://example.com/icon2.png', 'https://example.com/product2', '{"views": 2100, "reviews": 234, "upvotes": 445}', 'd54d4893-d74f-429c-9b4a-f84ce0607552', 2),
('스마트 요가 매트', 'AI 기반 자세 교정', '내장 센서로 요가 자세를 실시간 분석하고 교정해주는 스마트 매트', '매트에 내장된 센서가 자세를 감지하고 스마트폰 앱을 통해 실시간 피드백을 제공합니다.', 159000, 'https://example.com/icon3.png', 'https://example.com/product3', '{"views": 890, "reviews": 67, "upvotes": 123}', 'd54d4893-d74f-429c-9b4a-f84ce0607552', 3),
('명상 앱 Premium', '마음의 평화를 찾으세요', '가이드 명상, 수면 음악, 스트레스 관리 기능을 제공하는 종합 웰빙 앱', '앱을 실행하고 원하는 명상 프로그램을 선택하여 가이드에 따라 명상합니다.', 59000, 'https://example.com/icon4.png', 'https://example.com/product4', '{"views": 3400, "reviews": 567, "upvotes": 789}', 'd54d4893-d74f-429c-9b4a-f84ce0607552', 4),
('혈압 모니터링 키트', '정확한 혈압 측정', '집에서 정확한 혈압을 측정할 수 있는 디지털 혈압계와 앱 연동 키트', '혈압계를 착용하고 앱을 실행한 후 측정 버튼을 눌러 혈압을 측정합니다.', 129000, 'https://example.com/icon5.png', 'https://example.com/product5', '{"views": 1560, "reviews": 123, "upvotes": 234}', 'd54d4893-d74f-429c-9b4a-f84ce0607552', 5);

-- Posts table (5 rows)
INSERT INTO "posts" ("title", "content", "upvotes", "topic_id", "profile_id") VALUES
('건강한 아침 루틴 만들기', '매일 아침 30분 운동과 건강한 아침 식사로 하루를 시작하는 방법을 공유합니다. 물 한 잔부터 시작해서 스트레칭, 가벼운 운동, 그리고 균형 잡힌 아침 식사까지!', 15, 1, 'd54d4893-d74f-429c-9b4a-f84ce0607552'),
('영양 보조제 선택 가이드', '다양한 영양 보조제 중에서 본인에게 맞는 것을 선택하는 방법과 주의사항에 대해 설명합니다. 비타민, 미네랄, 오메가3 등 각각의 효과와 복용법을 알아보세요.', 23, 2, 'd54d4893-d74f-429c-9b4a-f84ce0607552'),
('집에서 할 수 있는 효과적인 운동', '집에서도 충분히 효과적인 운동을 할 수 있습니다. 요가, 필라테스, 홈 트레이닝 등 장비 없이도 할 수 있는 운동들을 소개합니다.', 31, 3, 'd54d4893-d74f-429c-9b4a-f84ce0607552'),
('스트레스 관리 방법', '현대인의 가장 큰 적인 스트레스를 효과적으로 관리하는 방법들을 공유합니다. 명상, 호흡법, 취미 활동 등을 통한 스트레스 해소법을 알아보세요.', 18, 4, 'd54d4893-d74f-429c-9b4a-f84ce0607552'),
('혈압 관리의 중요성', '고혈압의 위험성과 일상생활에서 혈압을 관리하는 방법에 대해 설명합니다. 식습관, 운동, 스트레스 관리 등을 통한 혈압 조절법을 알아보세요.', 27, 5, 'd54d4893-d74f-429c-9b4a-f84ce0607552');

-- Post replies table (5 rows)
INSERT INTO "post_replies" ("post_id", "parent_id", "profile_id", "reply") VALUES
(1, NULL, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '정말 유용한 정보네요! 저도 아침 루틴을 바꿔보려고 하는데 도움이 많이 됐습니다.'),
(2, NULL, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '영양 보조제 선택할 때 항상 고민이었는데 이 글 덕분에 명확해졌어요. 감사합니다!'),
(3, NULL, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '집에서 운동하기 어려웠는데 이 방법들이 정말 실용적이네요. 바로 시작해보겠습니다.'),
(4, NULL, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '스트레스 관리가 정말 중요하다는 걸 다시 한번 느꼈어요. 명상부터 시작해보겠습니다.'),
(5, NULL, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '혈압 관리에 대한 정보가 정말 도움이 됐어요. 식습관부터 바꿔보겠습니다.');

-- Reviews table (5 rows)
INSERT INTO "reviews" ("product_id", "profile_id", "rating", "review") VALUES
(1, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 5, '정말 만족스러운 제품입니다. 심박수 측정이 정확하고 배터리도 오래 가네요.'),
(2, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 4, '영양 보조제 효과가 좋습니다. 복용 후 컨디션이 확실히 좋아졌어요.'),
(3, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 5, 'AI 자세 교정 기능이 정말 유용해요. 요가 초보자에게 완벽한 제품입니다.'),
(4, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 4, '명상 앱이 정말 잘 만들어졌네요. 다양한 명상 프로그램이 있어서 좋습니다.'),
(5, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 5, '혈압 측정이 정확하고 앱 연동도 잘 됩니다. 집에서 혈압 관리하기 좋아요.');

-- Team table (5 rows)
INSERT INTO "team" ("team_name", "team_size", "cost", "team_position", "target", "team_description") VALUES
('건강 관리 전문팀', 5, 5000000, 'doctor', '고혈압 환자', '고혈압 환자를 위한 종합 건강 관리 프로그램을 제공하는 전문 의료진입니다.'),
('영양 상담팀', 3, 3000000, 'nutritionist', '다이어트 희망자', '개인 맞춤 영양 상담과 다이어트 프로그램을 제공하는 영양사 팀입니다.'),
('재활 치료팀', 4, 4000000, 'nurse', '재활 환자', '재활 치료와 운동 처방을 담당하는 전문 간호사 팀입니다.'),
('웰빙 케어팀', 6, 6000000, 'foresttherapist', '스트레스 환자', '명상과 자연 치료를 통한 스트레스 관리를 제공하는 웰빙 전문가 팀입니다.'),
('예방 의학팀', 4, 4500000, 'doctor', '건강 검진 대상자', '정기 건강 검진과 예방 의학을 담당하는 의료진입니다.');

-- Message rooms table (5 rows)
INSERT INTO "message_rooms" ("created_at") VALUES
(NOW()),
(NOW()),
(NOW()),
(NOW()),
(NOW());

-- Messages table (5 rows)
INSERT INTO "messages" ("message_room_id", "sender_id", "content") VALUES
(1, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '안녕하세요! 건강 상담을 받고 싶습니다.'),
(2, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '영양 상담 예약하고 싶은데 가능한가요?'),
(3, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '재활 치료 프로그램에 대해 문의드립니다.'),
(4, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '스트레스 관리 프로그램이 궁금합니다.'),
(5, 'd54d4893-d74f-429c-9b4a-f84ce0607552', '건강 검진 예약하고 싶습니다.');

-- Notifications table (5 rows)
INSERT INTO "notifications" ("source_id", "product_id", "post_id", "target_id", "type") VALUES
('d54d4893-d74f-429c-9b4a-f84ce0607552', 1, NULL, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 'review'),
('d54d4893-d74f-429c-9b4a-f84ce0607552', NULL, 1, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 'reply'),
('d54d4893-d74f-429c-9b4a-f84ce0607552', 2, NULL, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 'review'),
('d54d4893-d74f-429c-9b4a-f84ce0607552', NULL, 2, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 'reply'),
('d54d4893-d74f-429c-9b4a-f84ce0607552', 3, NULL, 'd54d4893-d74f-429c-9b4a-f84ce0607552', 'review');

-- Payments table (5 rows)
INSERT INTO "payments" ("payment_key", "order_id", "order_name", "total_amount", "metadata", "raw_data", "receipt_url", "status", "profile_id", "approved_at", "requested_at") VALUES
('pay_1234567890', 'order_001', '헬스 트래커 Pro 구매', 299000, '{"product_id": 1, "product_name": "헬스 트래커 Pro"}', '{"payment_method": "card", "card_type": "credit"}', 'https://example.com/receipt1.pdf', 'approved', 'd54d4893-d74f-429c-9b4a-f84ce0607552', NOW(), NOW() - INTERVAL '1 hour'),
('pay_1234567891', 'order_002', '프리미엄 멀티비타민 구매', 89000, '{"product_id": 2, "product_name": "프리미엄 멀티비타민"}', '{"payment_method": "card", "card_type": "debit"}', 'https://example.com/receipt2.pdf', 'approved', 'd54d4893-d74f-429c-9b4a-f84ce0607552', NOW(), NOW() - INTERVAL '2 hours'),
('pay_1234567892', 'order_003', '스마트 요가 매트 구매', 159000, '{"product_id": 3, "product_name": "스마트 요가 매트"}', '{"payment_method": "card", "card_type": "credit"}', 'https://example.com/receipt3.pdf', 'approved', 'd54d4893-d74f-429c-9b4a-f84ce0607552', NOW(), NOW() - INTERVAL '3 hours'),
('pay_1234567893', 'order_004', '명상 앱 Premium 구독', 59000, '{"product_id": 4, "product_name": "명상 앱 Premium"}', '{"payment_method": "card", "card_type": "credit"}', 'https://example.com/receipt4.pdf', 'approved', 'd54d4893-d74f-429c-9b4a-f84ce0607552', NOW(), NOW() - INTERVAL '4 hours'),
('pay_1234567894', 'order_005', '혈압 모니터링 키트 구매', 129000, '{"product_id": 5, "product_name": "혈압 모니터링 키트"}', '{"payment_method": "card", "card_type": "debit"}', 'https://example.com/receipt5.pdf', 'approved', 'd54d4893-d74f-429c-9b4a-f84ce0607552', NOW(), NOW() - INTERVAL '5 hours');

-- Clinic photos table (5 rows)
INSERT INTO "clinic_photos" ("clinic_id", "photo_url", "photo_type", "photo_title", "photo_description", "file_name", "file_size", "mime_type", "is_primary") VALUES
(1, 'https://example.com/clinic1_exterior.jpg', 'exterior', '서울내과의원 외관', '깔끔하고 현대적인 외관', 'clinic1_exterior.jpg', 2048576, 'image/jpeg', true),
(2, 'https://example.com/clinic2_interior.jpg', 'interior', '건강영양센터 내부', '편안한 상담실', 'clinic2_interior.jpg', 1536000, 'image/jpeg', true),
(3, 'https://example.com/clinic3_equipment.jpg', 'equipment', '부산재활의원 장비', '최신 재활 치료 장비', 'clinic3_equipment.jpg', 3072000, 'image/jpeg', true),
(4, 'https://example.com/clinic4_staff.jpg', 'staff', '전통한의원 의료진', '경험 많은 한의사진', 'clinic4_staff.jpg', 2560000, 'image/jpeg', true),
(5, 'https://example.com/clinic5_other.jpg', 'other', '건강간호센터 시설', '편리한 시설과 장비', 'clinic5_other.jpg', 1792000, 'image/jpeg', true);

-- Bridge tables (1 row each for composite primary keys)

-- Post upvotes (1 row)
INSERT INTO "post_upvotes" ("post_id", "profile_id") VALUES
(1, 'd54d4893-d74f-429c-9b4a-f84ce0607552');

-- Post reply upvotes (1 row)
INSERT INTO "post_reply_upvotes" ("post_reply_id", "profile_id") VALUES
(1, 'd54d4893-d74f-429c-9b4a-f84ce0607552');

-- Product upvotes (1 row)
INSERT INTO "product_upvotes" ("product_id", "profile_id") VALUES
(1, 'd54d4893-d74f-429c-9b4a-f84ce0607552');

-- Follows (1 row)
INSERT INTO "follows" ("follower_id", "following_id") VALUES
('d54d4893-d74f-429c-9b4a-f84ce0607552', 'd54d4893-d74f-429c-9b4a-f84ce0607552');

-- Message room members (1 row)
INSERT INTO "message_room_members" ("message_room_id", "profile_id") VALUES
(1, 'd54d4893-d74f-429c-9b4a-f84ce0607552');

-- Seed data insertion complete
-- Total: 15 tables seeded with appropriate data
-- Profile ID used: 'd54d4893-d74f-429c-9b4a-f84ce0607552' 