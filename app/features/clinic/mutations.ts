import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

/**
 * Create a clinic record in the database
 *
 * @param client - Supabase client instance
 * @param clinicData - Clinic data to insert
 * @returns Created clinic ID
 */
export const createClinic = async (
  client: SupabaseClient<Database>,
  clinicData: {
    position: string;
    overview: string;
    responsibilities: string;
    qualifications: string;
    benefits: string;
    skills: string;
    clinic_name: string;
    clinic_boss: string;
    clinic_logo: string;
    clinic_location: string;
    apply_url: string;
    clinic_type: "university" | "functional" | "nursing" | "traditional";
    location: "seoul" | "gyeonggi" | "busan";
    level: "1" | "2" | "3" | "4" | "5";
  },
) => {
  const { data, error } = await client
    .from("clinics")
    .insert({
      position: clinicData.position,
      overview: clinicData.overview,
      responsibilities: clinicData.responsibilities,
      qualifications: clinicData.qualifications,
      benefits: clinicData.benefits,
      skills: clinicData.skills,
      clinic_name: clinicData.clinic_name,
      clinic_boss: clinicData.clinic_boss,
      clinic_logo: clinicData.clinic_logo,
      clinic_location: clinicData.clinic_location,
      apply_url: clinicData.apply_url,
      clinic_type: clinicData.clinic_type,
      location: clinicData.location,
      level: clinicData.level,
    })
    .select("clinic_id")
    .single();

  if (error) {
    throw error;
  }

  return data.clinic_id;
};

/**
 * Update a clinic record in the database
 *
 * @param client - Supabase client instance
 * @param clinicId - Clinic ID to update
 * @param updates - Fields to update
 * @returns Updated clinic record
 */
export const updateClinic = async (
  client: SupabaseClient<Database>,
  clinicId: number,
  updates: {
    position?: string;
    overview?: string;
    responsibilities?: string;
    qualifications?: string;
    benefits?: string;
    skills?: string;
    clinic_name?: string;
    clinic_location?: string;
    apply_url?: string;
    clinic_type?: "university" | "functional" | "nursing" | "traditional";
    location?: "seoul" | "gyeonggi" | "busan";
    level?: "1" | "2" | "3" | "4" | "5";
  },
) => {
  const { data, error } = await client
    .from("clinics")
    .update(updates)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Create a clinic photo record in the database
 *
 * @param client - Supabase client instance
 * @param photoData - Photo data to insert
 * @returns Created photo record
 */
export const createClinicPhoto = async (
  client: SupabaseClient<Database>,
  photoData: {
    clinic_id: number;
    photo_url: string;
    photo_type:
      | "logo"
      | "exterior"
      | "interior"
      | "equipment"
      | "staff"
      | "other";
    photo_title?: string;
    photo_description?: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    is_primary: boolean;
  },
) => {
  // If this photo is set as primary, unset other primary photos for this clinic
  if (photoData.is_primary) {
    await client
      .from("clinic_photos")
      .update({ is_primary: false })
      .eq("clinic_id", photoData.clinic_id)
      .eq("is_primary", true);
  }

  const { data, error } = await client
    .from("clinic_photos")
    .insert({
      clinic_id: photoData.clinic_id,
      photo_url: photoData.photo_url,
      photo_type: photoData.photo_type as any,
      photo_title: photoData.photo_title || null,
      photo_description: photoData.photo_description || null,
      file_name: photoData.file_name,
      file_size: photoData.file_size,
      mime_type: photoData.mime_type,
      is_primary: photoData.is_primary,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Delete a clinic photo
 *
 * @param client - Supabase client instance
 * @param photoId - Photo ID to delete
 */
export const deleteClinicPhoto = async (
  client: SupabaseClient<Database>,
  photoId: number,
) => {
  const { error } = await client
    .from("clinic_photos")
    .delete()
    .eq("photo_id", photoId);

  if (error) {
    throw error;
  }
};

/**
 * Update clinic photo metadata
 *
 * @param client - Supabase client instance
 * @param photoId - Photo ID to update
 * @param updates - Fields to update
 */
export const updateClinicPhoto = async (
  client: SupabaseClient<Database>,
  photoId: number,
  updates: {
    photo_title?: string;
    photo_description?: string;
    is_primary?: boolean;
  },
) => {
  // If setting as primary, unset other primary photos for the same clinic
  if (updates.is_primary) {
    const { data: photo } = await client
      .from("clinic_photos")
      .select("clinic_id")
      .eq("photo_id", photoId)
      .single();

    if (photo) {
      await client
        .from("clinic_photos")
        .update({ is_primary: false })
        .eq("clinic_id", photo.clinic_id)
        .eq("is_primary", true)
        .neq("photo_id", photoId);
    }
  }

  const { data, error } = await client
    .from("clinic_photos")
    .update(updates)
    .eq("photo_id", photoId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const createClinicReview = async (
  client: SupabaseClient<Database>,
  {
    clinicId,
    review,
    rating,
    patientFriendliness,
    userId,
  }: {
    clinicId: string;
    review: string;
    rating: number;
    patientFriendliness: number;
    userId: string;
  },
) => {
  const { error } = await client.from("clinic_reviews").insert({
    clinic_id: +clinicId,
    review,
    rating,
    patient_friendliness: patientFriendliness,
    profile_id: userId,
  });
  if (error) {
    throw error;
  }
};
