import type { Route } from "./+types/admin-clinic-detail";

import { useState } from "react";
import { Form, redirect, useRevalidator } from "react-router";
import z from "zod";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";
import { ImageUpload } from "~/features/clinic/components/image-upload";
import {
  CLINIC_TYPES,
  LEVELS,
  LOCATION_TYPES,
} from "~/features/clinic/constants";
import {
  deleteClinicPhoto,
  updateClinic,
  updateClinicPhoto,
} from "~/features/clinic/mutations";
import { getClinicById, getClinicPhotos } from "~/features/clinic/queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "병원 상세 - 관리자 | Evidence Base" },
    { name: "description", content: "병원 상세 정보 및 사진 관리" },
  ];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  const clinicId = Number(params.clinicId);
  if (!clinicId) {
    throw redirect("/my/admin-dashboard/clinics");
  }

  const clinic = await getClinicById(client, { clinicId: String(clinicId) });
  const photos = await getClinicPhotos(client, { clinicId });

  return { clinic, photos };
};

const updateClinicSchema = z.object({
  clinic_name: z.string().min(1).max(40).optional(),
  clinic_location: z.string().min(1).max(40).optional(),
  overview: z.string().min(1).max(400).optional(),
  position: z.string().min(1).max(40).optional(),
  responsibilities: z.string().min(1).max(400).optional(),
  qualifications: z.string().min(1).max(400).optional(),
  benefits: z.string().min(1).max(400).optional(),
  skills: z.string().min(1).max(400).optional(),
  apply_url: z.string().url().optional(),
  clinic_type: z
    .enum(["university", "functional", "nursing", "traditional"])
    .optional(),
  location: z.enum(["seoul", "gyeonggi", "busan"]).optional(),
  level: z.enum(["1", "2", "3", "4", "5"]).optional(),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  const clinicId = Number(params.clinicId);
  if (!clinicId) {
    throw redirect("/my/admin-dashboard/clinics");
  }

  const formData = await request.formData();
  const actionType = formData.get("action") as string;

  if (actionType === "updateClinic") {
    const { data, success, error } = updateClinicSchema.safeParse(
      Object.fromEntries(formData),
    );

    if (!success) {
      return { formErrors: error.flatten().fieldErrors };
    }

    await updateClinic(client, clinicId, data);
  } else if (actionType === "deletePhoto") {
    const photoId = Number(formData.get("photoId"));
    if (photoId) {
      await deleteClinicPhoto(client, photoId);
    }
  } else if (actionType === "setPrimary") {
    const photoId = Number(formData.get("photoId"));
    if (photoId) {
      await updateClinicPhoto(client, photoId, { is_primary: true });
    }
  }

  return redirect(`/my/admin-dashboard/clinics/${clinicId}`);
};

export default function AdminClinicDetailPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { clinic, photos } = loaderData;
  const revalidator = useRevalidator();
  const [isEditing, setIsEditing] = useState(false);

  const handleUploadComplete = () => {
    revalidator.revalidate();
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    alert(error);
  };

  const logoPhoto = photos.find((p) => (p.photo_type as string) === "logo");

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{clinic.clinic_name}</h1>
          <p className="text-muted-foreground mt-2">
            {clinic.clinic_location} · {clinic.clinic_type}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-sm">
            병원 ID: {clinic.clinic_id}
          </p>
        </div>
      </div>

      {/* 병원 기본 정보 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>병원 정보</CardTitle>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "취소" : "수정"}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="updateClinic" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clinic_name">병원명</Label>
                  <Input
                    id="clinic_name"
                    name="clinic_name"
                    defaultValue={clinic.clinic_name}
                    maxLength={40}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clinic_location">위치</Label>
                  <Input
                    id="clinic_location"
                    name="clinic_location"
                    defaultValue={clinic.clinic_location}
                    maxLength={40}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clinic_type">병원 유형</Label>
                  <Select
                    name="clinic_type"
                    defaultValue={clinic.clinic_type}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLINIC_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">지역</Label>
                  <Select
                    name="location"
                    defaultValue={clinic.location}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">환자 친화도</Label>
                  <Select name="level" defaultValue={clinic.level} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="apply_url">신청 URL</Label>
                  <Input
                    id="apply_url"
                    name="apply_url"
                    type="url"
                    defaultValue={clinic.apply_url}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="overview">개요</Label>
                <Textarea
                  id="overview"
                  name="overview"
                  defaultValue={clinic.overview}
                  maxLength={400}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="position">포지션</Label>
                <Input
                  id="position"
                  name="position"
                  defaultValue={clinic.position}
                  maxLength={40}
                  required
                />
              </div>
              <div>
                <Label htmlFor="responsibilities">책임사항</Label>
                <Textarea
                  id="responsibilities"
                  name="responsibilities"
                  defaultValue={clinic.responsibilities}
                  maxLength={400}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="qualifications">자격요건</Label>
                <Textarea
                  id="qualifications"
                  name="qualifications"
                  defaultValue={clinic.qualifications}
                  maxLength={400}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="benefits">혜택</Label>
                <Textarea
                  id="benefits"
                  name="benefits"
                  defaultValue={clinic.benefits}
                  maxLength={400}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="skills">기술/능력</Label>
                <Textarea
                  id="skills"
                  name="skills"
                  defaultValue={clinic.skills}
                  maxLength={400}
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">저장</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  취소
                </Button>
              </div>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>병원명</Label>
                <p className="text-muted-foreground mt-1">
                  {clinic.clinic_name}
                </p>
              </div>
              <div>
                <Label>위치</Label>
                <p className="text-muted-foreground mt-1">
                  {clinic.clinic_location}
                </p>
              </div>
              <div>
                <Label>타입</Label>
                <p className="text-muted-foreground mt-1">
                  {clinic.clinic_type}
                </p>
              </div>
              <div>
                <Label>레벨</Label>
                <p className="text-muted-foreground mt-1">{clinic.level}</p>
              </div>
              <div>
                <Label>개요</Label>
                <p className="text-muted-foreground mt-1">{clinic.overview}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 병원 로고 */}
      <Card>
        <CardHeader>
          <CardTitle>병원 로고</CardTitle>
        </CardHeader>
        <CardContent>
          {logoPhoto ? (
            <div className="flex items-center gap-4">
              <img
                src={logoPhoto.photo_url}
                alt="병원 로고"
                className="size-32 rounded-lg border object-cover"
              />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">
                  로고는 사진 목록에서 관리할 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                로고가 등록되지 않았습니다. 아래 사진 업로드에서 타입을 "로고"로
                선택하여 업로드하세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사진 업로드 */}
      <Card>
        <CardHeader>
          <CardTitle>사진 업로드</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            clinicId={clinic.clinic_id}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </CardContent>
      </Card>

      {/* 사진 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>등록된 사진 ({photos.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              등록된 사진이 없습니다.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.photo_id}
                  className="group relative overflow-hidden rounded-lg border"
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.photo_title || "병원 사진"}
                    className="h-48 w-full object-cover"
                  />
                  {photo.is_primary && (
                    <div className="absolute top-2 right-2">
                      <span className="rounded bg-green-500 px-2 py-1 text-xs text-white">
                        대표
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="text-sm font-semibold">
                      {photo.photo_title || "제목 없음"}
                    </h4>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {photo.photo_type}
                    </p>
                    {photo.photo_description && (
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                        {photo.photo_description}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      {!photo.is_primary && (
                        <Form method="post" className="flex-1">
                          <input
                            type="hidden"
                            name="action"
                            value="setPrimary"
                          />
                          <input
                            type="hidden"
                            name="photoId"
                            value={photo.photo_id}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            대표로 설정
                          </Button>
                        </Form>
                      )}
                      <Form method="post" className="flex-1">
                        <input
                          type="hidden"
                          name="action"
                          value="deletePhoto"
                        />
                        <input
                          type="hidden"
                          name="photoId"
                          value={photo.photo_id}
                        />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            if (!confirm("이 사진을 삭제하시겠습니까?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          삭제
                        </Button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
