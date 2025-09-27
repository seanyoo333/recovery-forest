import type { Route } from "./+types/clinics-page";

import { Link, useSearchParams } from "react-router";

import { cn } from "~/lib/utils";

import { Hero } from "~/core/components/hero";
import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";

import { ClinicCard } from "../components/clinic-card";
import { CLINIC_TYPES, LEVELS, LOCATION_TYPES } from "../constants";
import { getClinics } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Clinics | Evidence Base" },
    { name: "description", content: "Find your dream clinic at Evidence Base" },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const clinics = await getClinics(client, { limit: 100 });
  return { clinics };
};

export default function ClinicsPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const onFilterClick = (key: string, value: string) => {
    searchParams.set(key, value);
    setSearchParams(searchParams);
  };
  return (
    <div className="space-y-20">
      <Hero
        title="병원 찾기"
        subtitle="건강관리를 위한 전문 병원을 찾아보세요"
      />
      {/* 모바일에서 검색 필터 섹션을 위쪽에 표시 */}
      <div className="flex flex-col gap-10 xl:hidden">
        <div className="flex flex-col items-start gap-2.5">
          <h4 className="text-muted-foreground text-sm font-bold">타입</h4>
          <div className="flex flex-wrap gap-2">
            {CLINIC_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={"outline"}
                onClick={() => onFilterClick("type", type.value)}
                className={cn(
                  type.value === searchParams.get("type") ? "bg-accent" : "",
                )}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-2.5">
          <h4 className="text-muted-foreground text-sm font-bold">위치</h4>
          <div className="flex flex-wrap gap-2">
            {LOCATION_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={"outline"}
                onClick={() => onFilterClick("location", type.value)}
                className={cn(
                  type.value === searchParams.get("location")
                    ? "bg-accent"
                    : "",
                )}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-2.5">
          <h4 className="text-muted-foreground text-sm font-bold">
            환자 친화도
          </h4>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((range) => (
              <Button
                key={range}
                variant={"outline"}
                onClick={() => onFilterClick("level", range)}
                className={cn(
                  range === searchParams.get("level") ? "bg-accent" : "",
                )}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-20 xl:grid-cols-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:col-span-4">
          {loaderData.clinics.map((clinic) => (
            <ClinicCard
              key={clinic.clinic_id}
              id={clinic.clinic_id}
              clinicName={clinic.clinic_name}
              clinicLogoUrl={clinic.clinic_logo}
              clinicLocation={clinic.clinic_location}
              clinicType={clinic.clinic_type}
              clinicLevel={clinic.level}
              overview={clinic.overview}
              location={clinic.clinic_location}
              createdAt={clinic.created_at}
            />
          ))}
        </div>
        {/* 데스크톱에서만 표시되는 사이드바 필터 */}
        <div className="sticky top-20 flex hidden flex-col gap-10 xl:col-span-2 xl:flex">
          <div className="flex flex-col items-start gap-2.5">
            <h4 className="text-muted-foreground text-sm font-bold">타입</h4>
            <div className="flex flex-wrap gap-2">
              {CLINIC_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={"outline"}
                  onClick={() => onFilterClick("type", type.value)}
                  className={cn(
                    type.value === searchParams.get("type") ? "bg-accent" : "",
                  )}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2.5">
            <h4 className="text-muted-foreground text-sm font-bold">위치</h4>
            <div className="flex flex-wrap gap-2">
              {LOCATION_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={"outline"}
                  onClick={() => onFilterClick("location", type.value)}
                  className={cn(
                    type.value === searchParams.get("location")
                      ? "bg-accent"
                      : "",
                  )}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2.5">
            <h4 className="text-muted-foreground text-sm font-bold">
              환자 친화도
            </h4>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((range) => (
                <Button
                  key={range}
                  variant={"outline"}
                  onClick={() => onFilterClick("level", range)}
                  className={cn(
                    range === searchParams.get("level") ? "bg-accent" : "",
                  )}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
