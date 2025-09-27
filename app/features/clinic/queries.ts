import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

type ClinicType = Database["public"]["Enums"]["clinic_type"];
type Level = Database["public"]["Enums"]["level"];

export const getClinics = async (
  client: SupabaseClient<Database>,
  {
    limit,
    location,
    type,
    level,
  }: {
    limit: number;
    location?: string;
    type?: ClinicType;
    level?: Level;
  },
) => {
  const baseQuery = client
    .from("clinics_view")
    .select(
      `
    clinic_id,
    position,
    overview,
    clinic_name,
    clinic_boss,
    clinic_logo,
    clinic_location,
    clinic_type,
    level,
    created_at,
    primary_photo_url,
    primary_photo_title,
    primary_photo_description,
    photo_count
    `,
    )
    .limit(limit);

  if (location) {
    baseQuery.eq("clinic_location", location);
  }
  if (type) {
    baseQuery.eq("clinic_type", type);
  }
  if (level) {
    baseQuery.eq("level", level);
  }
  const { data, error } = await baseQuery;
  if (error) {
    throw error;
  }
  return data;
};

export const getClinicById = async (
  client: SupabaseClient<Database>,
  { clinicId }: { clinicId: string },
) => {
  const { data, error } = await client
    .from("clinics_view")
    .select("*")
    .eq("clinic_id", Number(clinicId))
    .single();
  if (error) {
    throw error;
  }
  return data;
};

// 클리닉 사진 조회 함수 (필요시 사용)
export const getClinicPhotos = async (
  client: SupabaseClient<Database>,
  { clinicId }: { clinicId: number },
) => {
  const { data, error } = await client
    .from("clinic_photos")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
};
