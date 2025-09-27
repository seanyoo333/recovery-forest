# 병원 사진 관리 시스템

## 개요

이 시스템은 병원의 내부/외부 사진을 체계적으로 관리할 수 있도록 설계되었습니다. Supabase Storage를 사용하여 이미지 파일을 저장하고, 별도의 데이터베이스 테이블에서 사진 메타데이터를 관리합니다.

## 데이터베이스 구조

### clinic_photos 테이블

```sql
CREATE TABLE clinic_photos (
  photo_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  clinic_id BIGINT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type photo_type NOT NULL,
  photo_title TEXT,
  photo_description TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### photo_type ENUM

- `exterior`: 외부 사진
- `interior`: 내부 사진
- `equipment`: 장비 사진
- `staff`: 직원 사진
- `other`: 기타

## 파일 저장 구조

### Supabase Storage 구조

```
clinic-photos/
├── {clinic_id}/
│   ├── exterior/
│   │   ├── {timestamp}.jpg
│   │   └── {timestamp}.png
│   ├── interior/
│   │   ├── {timestamp}.jpg
│   │   └── {timestamp}.png
│   ├── equipment/
│   ├── staff/
│   └── other/
```

## 주요 기능

### 1. 이미지 업로드
- 파일 크기 제한: 10MB
- 지원 형식: JPEG, PNG, GIF, WebP
- 자동 리사이징 (최대 1200px)
- 파일명 중복 방지 (타임스탬프 사용)

### 2. 사진 분류
- 사진 타입별 분류
- 제목 및 설명 추가
- 대표 사진 설정

### 3. 갤러리 표시
- 타입별 그룹화
- 미리보기 및 상세보기
- 다운로드 기능
- 삭제 기능 (관리자용)

## 사용 방법

### 1. Supabase Storage 설정

1. Supabase 프로젝트에서 Storage 버킷 생성:
   ```bash
   # Supabase CLI 사용
   supabase storage create clinic-photos
   ```

2. Storage 정책 설정:
   ```sql
   -- 공개 읽기 정책
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'clinic-photos');
   
   -- 인증된 사용자 업로드 정책
   CREATE POLICY "Authenticated users can upload" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'clinic-photos' AND auth.role() = 'authenticated');
   ```

### 2. 환경 변수 설정

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 컴포넌트 사용

```tsx
import { ImageUpload } from "./components/image-upload";
import { PhotoGallery } from "./components/photo-gallery";

// 이미지 업로드
<ImageUpload
  clinicId={1}
  onUploadComplete={(data) => console.log('업로드 완료:', data)}
  onUploadError={(error) => console.error('업로드 실패:', error)}
/>

// 사진 갤러리
<PhotoGallery
  photos={photos}
  onDeletePhoto={(photoId) => handleDelete(photoId)}
  canEdit={true}
/>
```

## API 엔드포인트

### POST /api/clinic/upload-photo
사진 업로드 API

**요청 데이터:**
- `clinicId`: 병원 ID
- `photoType`: 사진 타입
- `photoTitle`: 사진 제목 (선택)
- `photoDescription`: 사진 설명 (선택)
- `isPrimary`: 대표 사진 여부
- `file`: 이미지 파일

**응답:**
```json
{
  "success": true,
  "photo": {
    "photo_id": 1,
    "photo_url": "https://...",
    "photo_type": "exterior",
    "photo_title": "병원 외관",
    "is_primary": true
  }
}
```

## 보안 고려사항

1. **파일 검증**: 서버에서 파일 타입과 크기 검증
2. **접근 제어**: 인증된 사용자만 업로드 가능
3. **CORS 설정**: 허용된 도메인에서만 접근
4. **파일 크기 제한**: 10MB 이하만 허용
5. **파일 형식 제한**: 이미지 파일만 허용

## 성능 최적화

1. **이미지 리사이징**: 업로드 시 자동 리사이징
2. **CDN 활용**: Supabase Storage의 CDN 기능 활용
3. **지연 로딩**: 갤러리에서 이미지 지연 로딩
4. **캐싱**: 브라우저 캐싱 활용

## 배포 시 주의사항

1. **Vercel 배포**: 프론트엔드는 Vercel에 배포하더라도 이미지는 Supabase Storage에 저장
2. **환경 변수**: 프로덕션 환경에서 올바른 환경 변수 설정
3. **Storage 정책**: 프로덕션 환경에서 적절한 Storage 정책 설정
4. **백업**: 정기적인 데이터베이스 및 Storage 백업

## 트러블슈팅

### 일반적인 문제들

1. **업로드 실패**
   - 파일 크기 확인 (10MB 이하)
   - 파일 형식 확인 (이미지 파일만)
   - 네트워크 연결 확인

2. **이미지 표시 안됨**
   - Supabase Storage 정책 확인
   - URL 형식 확인
   - CORS 설정 확인

3. **권한 오류**
   - 사용자 인증 상태 확인
   - Storage 정책 확인
   - 환경 변수 설정 확인 