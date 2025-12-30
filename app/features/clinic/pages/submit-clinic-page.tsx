import type { Route } from "./+types/submit-clinic-page";

import { useState } from "react";
import { Form, redirect } from "react-router";
import z from "zod";

import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { ImageUpload } from "../components/image-upload";
import { CLINIC_TYPES, LEVELS, LOCATION_TYPES } from "../constants";
import { createClinic } from "../mutations";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Post a Clinic | Evidence Base" },
    {
      name: "description",
      content: "Reach out to the best clinics in the world",
    },
  ];
};

const formSchema = z.object({
  position: z.string().min(1).max(40),
  overview: z.string().min(1).max(400),
  responsibilities: z.string().min(1).max(400),
  qualifications: z.string().min(1).max(400),
  benefits: z.string().min(1).max(400),
  skills: z.string().min(1).max(400),
  companyName: z.string().min(1).max(40),
  companyLogoUrl: z.string().url(),
  companyLocation: z.string().min(1).max(40),
  applyUrl: z.string().url(),
  clinicType: z.enum(["university", "functional", "nursing", "traditional"]),
  clinicLocation: z.enum(["seoul", "gyeonggi", "busan"]),
  level: z.enum(["1", "2", "3", "4", "5"]),
});

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const { data, success, error } = formSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!success) {
    return { formErrors: error.flatten().fieldErrors };
  }

  const clinicId = await createClinic(client, {
    position: data.position,
    overview: data.overview,
    responsibilities: data.responsibilities,
    qualifications: data.qualifications,
    benefits: data.benefits,
    skills: data.skills,
    clinic_name: data.companyName,
    clinic_boss: userId,
    clinic_logo: data.companyLogoUrl,
    clinic_location: data.companyLocation,
    apply_url: data.applyUrl,
    clinic_type: data.clinicType,
    location: data.clinicLocation,
    level: data.level,
  });

  return redirect(`/clinic/${clinicId}`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  return {};
}

export default function SubmitClinicPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<number | null>(null);

  const handleUploadComplete = (photoData: any) => {
    setUploadedPhotos((prev) => [...prev, photoData]);
    setUploadError(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
  };

  return (
    <div>
      <Hero
        title="병원 등록"
        subtitle="최고의 병원을 등록하여 환자들에게 소개하세요"
      />
      <Form className="mx-auto flex max-w-screen-2xl flex-col items-center gap-10">
        <div className="grid w-full grid-cols-3 gap-10">
          <InputPair
            label="포지션"
            description="(최대 40자)"
            name="position"
            maxLength={40}
            type="text"
            id="position"
            required
            placeholder="예: 수석 의학 연구원"
          />
          <InputPair
            id="overview"
            label="개요"
            description="(최대 400자)"
            name="overview"
            maxLength={400}
            type="text"
            required
            placeholder="예: 수석 의학 연구원을 찾고 있습니다"
            textArea
          />
          <InputPair
            id="responsibilities"
            label="책임사항"
            description="(최대 400자, 쉼표로 구분)"
            name="responsibilities"
            maxLength={400}
            type="text"
            required
            placeholder="예: 임상시험 설계 및 수행, 의료 데이터 분석, 연구 논문 작성, 의료진과 협력, 학회에서 연구 결과 발표"
            textArea
          />
          <InputPair
            id="qualifications"
            label="자격요건"
            description="(최대 400자, 쉼표로 구분)"
            name="qualifications"
            maxLength={400}
            type="text"
            required
            placeholder="예: 의학 연구 박사 학위, 5년 이상 임상 경험, 연구 논문 발표 경력, 강한 분석 능력, 의사 면허"
            textArea
          />
          <InputPair
            id="benefits"
            label="혜택"
            description="(최대 400자, 쉼표로 구분)"
            name="benefits"
            maxLength={400}
            type="text"
            required
            placeholder="예: 유연한 근무 시간, 건강보험, 치과 보험, 안과 보험, 퇴직연금, 유급 휴가, 전문성 개발 지원"
            textArea
          />
          <InputPair
            id="skills"
            label="기술/능력"
            description="(최대 400자, 쉼표로 구분)"
            name="skills"
            maxLength={400}
            type="text"
            required
            placeholder="예: 임상 연구, 데이터 분석, 통계 소프트웨어, 의학 논문 작성, 환자 진료, 연구 방법론"
            textArea
          />
          <InputPair
            id="companyName"
            label="병원명"
            description="(최대 40자)"
            name="companyName"
            maxLength={40}
            type="text"
            required
            placeholder="예: 서울대학교병원"
          />
          <InputPair
            id="companyLogoUrl"
            label="병원 로고 URL"
            description="병원 로고 이미지의 URL을 입력하세요"
            name="companyLogoUrl"
            type="url"
            required
            placeholder="예: https://example.com/logo.png"
          />
          <InputPair
            id="companyLocation"
            label="병원 위치"
            description="(최대 40자)"
            name="companyLocation"
            maxLength={40}
            type="text"
            required
            placeholder="예: 서울특별시 강남구"
          />
          <InputPair
            id="applyUrl"
            label="신청 URL"
            description="병원 신청 페이지의 URL을 입력하세요"
            name="applyUrl"
            type="url"
            required
            placeholder="예: https://example.com/apply"
          />
          <SelectPair
            label="병원 유형"
            description="병원 유형을 선택하세요"
            name="clinicType"
            required
            placeholder="병원 유형 선택"
            options={CLINIC_TYPES.map((type) => ({
              label: type.label,
              value: type.value,
            }))}
          />
          <SelectPair
            label="지역"
            description="병원이 위치한 지역을 선택하세요"
            name="clinicLocation"
            required
            placeholder="지역 선택"
            options={LOCATION_TYPES.map((location) => ({
              label: location.label,
              value: location.value,
            }))}
          />
          <SelectPair
            label="환자 친화도"
            description="병원의 환자 친화도 수준을 선택하세요"
            name="level"
            required
            placeholder="환자 친화도 선택"
            options={LEVELS.map((level: string) => ({
              label: level,
              value: level,
            }))}
          />
        </div>

        {/* 병원 사진 업로드 섹션 - 등록 후 병원 상세 페이지에서 업로드 가능 */}
        <div className="w-full space-y-4">
          <div className="border-t pt-8">
            <h3 className="mb-4 text-xl font-semibold">병원 사진 업로드</h3>
            <p className="text-muted-foreground mb-6">
              병원 정보 등록 후, 병원 상세 페이지에서 사진을 업로드할 수
              있습니다.
            </p>

            {uploadError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}

            {uploadedPhotos.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-3 font-medium">
                  업로드된 사진 ({uploadedPhotos.length}장)
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {uploadedPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="bg-muted aspect-video overflow-hidden rounded-lg"
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.photo_title || `사진 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full max-w-sm" size="lg">
          병원 등록하기
        </Button>
      </Form>
    </div>
  );
}
