import type { Route } from "./+types/admin-dashboard";

import {
  BarChart3,
  Building2,
  Eye,
  Package,
  Plus,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
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

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Admin Dashboard | Evidence Base" },
    {
      name: "description",
      content: "Admin dashboard for managing the platform",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = await makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  // 병원 개수 가져오기
  const { count: clinicCount } = await client
    .from("clinics")
    .select("*", { count: "exact", head: true });

  return { clinicCount: clinicCount || 0 };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const { clinicCount } = loaderData;

  // 관리자 기능 카드들
  const adminFeatures = [
    {
      title: "사용자 관리",
      description: "사용자 계정, 권한, 활동 관리",
      icon: Users,
      href: "/users",
      color: "bg-blue-500",
      stats: "1,234명",
    },
    {
      title: "병원 관리",
      description: "병원 등록, 수정, 승인 관리",
      icon: Building2,
      href: "/my/admin-dashboard/clinics",
      submitHref: "/clinic/submit",
      color: "bg-green-500",
      stats: `${clinicCount}개`,
    },
    {
      title: "제품 관리",
      description: "제품 등록, 수정, 승인 관리",
      icon: Package,
      href: "/my/admin-dashboard/products",
      submitHref: "/products/submit",
      color: "bg-purple-500",
      stats: "89개",
    },
    {
      title: "블로그 관리",
      description: "블로그 포스트 및 이미지 업로드",
      icon: Settings,
      href: "/my/admin-dashboard/blog",
      color: "bg-orange-500",
      stats: "관리",
    },
    {
      title: "통계 및 분석",
      description: "사이트 통계, 사용자 행동 분석",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-red-500",
      stats: "실시간",
    },
    {
      title: "보안 관리",
      description: "보안 설정, 접근 로그, 권한 관리",
      icon: Shield,
      href: "/admin/security",
      color: "bg-gray-500",
      stats: "활성",
    },
  ];

  // 최근 활동 (가상 데이터)
  const recentActivities = [
    {
      id: 1,
      type: "user_joined",
      message: "새 사용자가 가입했습니다: user@example.com",
      time: "2분 전",
    },
    {
      id: 2,
      type: "clinic_submitted",
      message: "새 병원이 등록되었습니다: 서울대학교병원",
      time: "15분 전",
    },
    {
      id: 3,
      type: "product_submitted",
      message: "새 제품이 등록되었습니다: AI 진단 시스템",
      time: "1시간 전",
    },
    {
      id: 4,
      type: "admin_action",
      message: "관리자가 사용자 권한을 변경했습니다",
      time: "2시간 전",
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">관리자 대시보드</h1>
            <p className="text-muted-foreground mt-2">
              플랫폼 관리 및 모니터링
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            관리자 모드
          </Badge>
        </div>
      </div>

      {/* 관리자 기능 그리드 */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card
              key={feature.title}
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${feature.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.stats}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  {feature.description}
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link to={feature.href}>
                      <Eye className="mr-2 h-4 w-4" />
                      보기
                    </Link>
                  </Button>
                  {(feature.href.includes("/submit") ||
                    (feature as any).submitHref) && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={(feature as any).submitHref || feature.href}>
                        <Plus className="mr-2 h-4 w-4" />
                        추가
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 최근 활동 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-muted/50 flex items-start gap-3 rounded-lg p-3"
                >
                  <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 빠른 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>플랫폼 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">1,234</div>
                <div className="text-muted-foreground text-sm">총 사용자</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">56</div>
                <div className="text-muted-foreground text-sm">등록된 병원</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">89</div>
                <div className="text-muted-foreground text-sm">등록된 제품</div>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">23</div>
                <div className="text-muted-foreground text-sm">콘텐츠</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
