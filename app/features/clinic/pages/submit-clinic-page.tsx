import type { Route } from "./+types/submit-clinic-page";

import { useState } from "react";
import { Form } from "react-router";

import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import {
  requireAdminPermission,
  requireAuthentication,
} from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { ImageUpload } from "../components/image-upload";
import { CLINIC_TYPES, LEVELS, LOCATION_TYPES } from "../constants";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Post a Clinic | Evidence Base" },
    {
      name: "description",
      content: "Reach out to the best clinics in the world",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminPermission(client, "can_manage_clinics");

  return {};
}

export default function SubmitClinicPage() {
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        title="Post a Clinic"
        subtitle="Reach out to the best clinics in the world"
      />
      <Form className="mx-auto flex max-w-screen-2xl flex-col items-center gap-10">
        <div className="grid w-full grid-cols-3 gap-10">
          <InputPair
            label="Position"
            description="(40 characters max)"
            name="position"
            maxLength={40}
            type="text"
            id="position"
            required
            placeholder="i.e Senior Medical Researcher"
          />
          <InputPair
            id="overview"
            label="Overview"
            description="(400 characters max)"
            name="overview"
            maxLength={400}
            type="text"
            required
            placeholder="i.e We are looking for a Senior Medical Researcher"
            textArea
          />
          <InputPair
            id="responsibilities"
            label="Responsibilities"
            description="(400 characters max, comma separated)"
            name="responsibilities"
            maxLength={400}
            type="text"
            required
            placeholder="i.e Design and conduct clinical trials, Analyze medical data, Write research papers, Collaborate with medical staff, Present findings at conferences"
            textArea
          />
          <InputPair
            id="qualifications"
            label="Qualifications"
            description="(400 characters max, comma separated)"
            name="qualifications"
            maxLength={400}
            type="text"
            required
            placeholder="i.e PhD in Medical Research, 5+ years clinical experience, Published research papers, Strong analytical skills, Medical license"
            textArea
          />
          <InputPair
            id="benefits"
            label="Benefits"
            description="(400 characters max, comma separated)"
            name="benefits"
            maxLength={400}
            type="text"
            required
            placeholder="i.e Flexible working hours, Health insurance, Dental coverage, Vision care, 401k matching, Paid time off, Professional development"
            textArea
          />
          <InputPair
            id="skills"
            label="Skills"
            description="(400 characters max, comma separated)"
            name="skills"
            maxLength={400}
            type="text"
            required
            placeholder="i.e Clinical research, Data analysis, Statistical software, Medical writing, Patient care, Research methodology"
            textArea
          />
          <InputPair
            id="companyName"
            label="Company Name"
            description="(40 characters max)"
            name="companyName"
            maxLength={40}
            type="text"
            required
            placeholder="i.e wemake"
          />
          <InputPair
            id="companyLogoUrl"
            label="Company Logo URL"
            description="(40 characters max)"
            name="companyLogoUrl"
            type="url"
            required
            placeholder="i.e https://wemake.services/logo.png"
          />
          <InputPair
            id="companyLocation"
            label="Company Location"
            description="(40 characters max)"
            name="companyLocation"
            maxLength={40}
            type="text"
            required
            placeholder="i.e Seoul, South Korea"
          />
          <InputPair
            id="applyUrl"
            label="Apply URL"
            description="(40 characters max)"
            name="applyUrl"
            maxLength={40}
            type="url"
            required
            placeholder="i.e https://wemake.services/apply"
          />
          <SelectPair
            label="Clinic Type"
            description="Select the type of clinic"
            name="clinicType"
            required
            placeholder="Select the type of clinic"
            options={CLINIC_TYPES.map((type) => ({
              label: type.label,
              value: type.value,
            }))}
          />
          <SelectPair
            label="Clinic Location"
            description="Select the location of the clinic"
            name="clinicLocation"
            required
            placeholder="Select the location of the clinic"
            options={LOCATION_TYPES.map((location) => ({
              label: location.label,
              value: location.value,
            }))}
          />
          <SelectPair
            label="Level"
            description="Select the level of the clinic"
            name="level"
            required
            placeholder="Select the level of the clinic"
            options={LEVELS.map((level: string) => ({
              label: level,
              value: level,
            }))}
          />
        </div>

        {/* 병원 사진 업로드 섹션 */}
        <div className="w-full space-y-4">
          <div className="border-t pt-8">
            <h3 className="mb-4 text-xl font-semibold">병원 사진 업로드</h3>
            <p className="text-muted-foreground mb-6">
              병원의 외부, 내부, 장비 사진 등을 업로드하여 병원을 더 잘
              보여주세요.
            </p>

            {/* 임시 clinicId (실제로는 병원 등록 후 생성된 ID 사용) */}
            <ImageUpload
              clinicId={1} // 임시 ID, 실제로는 병원 등록 후 생성된 ID 사용
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />

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
          Post clinic for $100
        </Button>
      </Form>
    </div>
  );
}
