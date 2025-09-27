import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface UploadedImage {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export async function uploadClinicImage(
  file: File,
  clinicId: number,
  photoType: 'exterior' | 'interior' | 'equipment' | 'staff' | 'other'
): Promise<UploadedImage> {
  try {
    // 파일 확장자 추출
    const fileExtension = file.name.split('.').pop();
    const fileName = `${clinicId}/${photoType}/${Date.now()}.${fileExtension}`;
    
    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('clinic-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('clinic-photos')
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    };
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
}

export async function deleteClinicImage(fileName: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('clinic-photos')
      .remove([fileName]);

    if (error) {
      throw new Error(`이미지 삭제 실패: ${error.message}`);
    }
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    throw error;
  }
}

// 서버 사이드 이미지 리사이징 (Node.js 환경에서 사용)
export async function resizeImageServer(
  buffer: Buffer,
  maxWidth: number = 1200
): Promise<Buffer> {
  // Node.js 환경에서 이미지 리사이징을 위한 라이브러리 필요
  // 예: sharp, jimp 등
  // 여기서는 기본 구현만 제공
  return buffer;
} 