import type { Route } from "./+types/admin-clinic-list";

import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";
import { getClinics } from "~/features/clinic/queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "병원 관리 - 관리자 | Evidence Base" },
    { name: "description", content: "병원 관리 및 통계" },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  // 모든 병원 정보 가져오기
  const clinics = await getClinics(client, { limit: 100 });

  return { clinics: clinics || [] };
};

export default function AdminClinicListPage({
  loaderData,
}: Route.ComponentProps) {
  const { clinics } = loaderData;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">병원 관리</h1>
          <p className="text-muted-foreground mt-2">
            등록된 병원 목록 및 통계 확인
          </p>
        </div>
        <Button asChild className="bg-green-600 text-white hover:bg-green-700">
          <Link to="/clinic/submit">+ 새 병원 등록</Link>
        </Button>
      </div>

      {/* 병원 목록 */}
      <div className="grid gap-4">
        {clinics.map((clinic) => (
          <Card
            key={clinic.clinic_id}
            className="transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {clinic.primary_photo_url && (
                    <img
                      src={clinic.primary_photo_url}
                      alt={clinic.clinic_name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <CardTitle className="text-xl">
                      {clinic.clinic_name}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {clinic.clinic_location} · {clinic.clinic_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-muted-foreground text-sm">사진</div>
                    <div className="font-semibold">
                      {clinic.photo_count || 0}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {clinic.overview}
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/clinic/${clinic.clinic_id}`}>상세 보기</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`/my/admin-dashboard/clinics/${clinic.clinic_id}`}
                    >
                      관리
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clinics.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                등록된 병원이 없습니다.
              </p>
              <Button
                asChild
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Link to="/clinic/submit">+ 첫 번째 병원 등록하기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
