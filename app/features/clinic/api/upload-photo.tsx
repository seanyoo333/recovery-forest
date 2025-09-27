/**
 * Upload Clinic Photo API Endpoint
 *
 * This file implements an API endpoint for uploading clinic photos.
 * It handles file validation, image uploads to Supabase Storage, and database updates.
 *
 * Key features:
 * - File validation (type, size)
 * - Image upload to Supabase Storage
 * - Database metadata storage
 * - Error handling
 */

import type { Route } from "./+types/upload-photo";

import { data } from "react-router";

import { addClinicPhoto } from "../queries";
import { uploadClinicImage } from "../lib/upload-utils";

/**
 * Action handler for processing clinic photo upload requests
 *
 * This function handles the complete photo upload flow:
 * 1. Validates the request method (POST only)
 * 2. Validates form data and file requirements
 * 3. Uploads image to Supabase Storage
 * 4. Saves photo metadata to database
 * 5. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Requires POST method to prevent unintended uploads
 * - Validates file type and size
 * - Handles errors gracefully with appropriate status codes
 *
 * @param request - The incoming HTTP request with form data
 * @returns Response indicating success or error with appropriate details
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow POST)
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const clinicId = Number(formData.get("clinicId"));
    const photoType = formData.get("photoType") as string;
    const photoTitle = formData.get("photoTitle") as string;
    const photoDescription = formData.get("photoDescription") as string;
    const isPrimary = formData.get("isPrimary") === "true";
    const file = formData.get("file") as File;

    if (!clinicId || !photoType || !file) {
      return data({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    // 파일 검증
    if (!file.type.startsWith('image/')) {
      return data({ error: "이미지 파일만 업로드 가능합니다." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return data({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });
    }

    // Supabase Storage에 업로드
    const uploadedImage = await uploadClinicImage(
      file,
      clinicId,
      photoType as 'exterior' | 'interior' | 'equipment' | 'staff' | 'other'
    );

    // 데이터베이스에 저장
    const photoData = {
      clinic_id: clinicId,
      photo_url: uploadedImage.url,
      photo_type: photoType as 'exterior' | 'interior' | 'equipment' | 'staff' | 'other',
      photo_title: photoTitle || undefined,
      photo_description: photoDescription || undefined,
      file_name: uploadedImage.fileName,
      file_size: uploadedImage.fileSize,
      mime_type: uploadedImage.mimeType,
      is_primary: isPrimary
    };

    const savedPhoto = await addClinicPhoto(photoData);

    return data({ 
      success: true, 
      photo: savedPhoto 
    });

  } catch (error) {
    console.error("사진 업로드 오류:", error);
    return data({ 
      error: error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다." 
    }, { status: 500 });
  }
} 