import type { Route } from "./+types/clinic-overview-layout";

import { StarIcon } from "lucide-react";
import { Link, NavLink, Outlet, useOutletContext } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { buttonVariants } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";

import {
  getClinicAverageRating,
  getClinicById,
  getClinicPhotos,
} from "../queries";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data.clinic.clinic_name} | Evidence Base` },
    {
      name: "description",
      content: "병원 상세 정보 및 이용 경험 공유",
    },
  ];
}

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs & { params: { clinicId: string } }) => {
  const [client, headers] = makeServerClient(request);
  const clinic = await getClinicById(client, { clinicId: params.clinicId });
  const photos = await getClinicPhotos(client, { clinicId: clinic.clinic_id });
  const ratings = await getClinicAverageRating(client, {
    clinicId: params.clinicId,
  });
  return { clinic, photos, ratings };
};

export default function ClinicOverviewLayout({
  loaderData,
}: Route.ComponentProps) {
  const context = useOutletContext<{ isLoggedIn: boolean }>();
  const isLoggedIn = context?.isLoggedIn ?? false;

  const logoPhoto = loaderData.photos.find((p: any) => p.photo_type === "logo");
  const logoUrl = logoPhoto
    ? logoPhoto.photo_url
    : loaderData.clinic.clinic_logo;

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-10 md:flex-row md:gap-0">
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
          <div className="bg-primary/50 size-40 overflow-hidden rounded-xl shadow-xl">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={loaderData.clinic.clinic_name}
                className="size-full object-cover"
              />
            ) : (
              <div className="bg-muted flex size-full items-center justify-center">
                <span className="text-muted-foreground text-2xl">
                  {loaderData.clinic.clinic_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-center text-5xl font-bold md:text-left">
              {loaderData.clinic.clinic_name}
            </h1>
            <p className="text-center text-xl font-light md:text-left">
              {loaderData.clinic.clinic_boss} 원장
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Badge variant="secondary">{loaderData.clinic.clinic_type}</Badge>
              <Badge variant="secondary">
                {loaderData.clinic.clinic_location}
              </Badge>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-lg md:justify-start md:text-base">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className="size-4"
                    fill={
                      i < Math.round(loaderData.ratings.averageRating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                경험 공유 {loaderData.ratings.reviewCount}개
              </span>
            </div>
            {loaderData.ratings.averagePatientFriendliness > 0 && (
              <div className="mt-2 flex items-center justify-center gap-2 text-lg md:justify-start md:text-base">
                <span className="text-muted-foreground text-sm">
                  환자 친화도:
                </span>
                <div className="flex text-blue-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className="size-4"
                      fill={
                        i <
                        Math.round(
                          loaderData.ratings.averagePatientFriendliness,
                        )
                          ? "currentColor"
                          : "none"
                      }
                    />
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">
                  {loaderData.ratings.averagePatientFriendliness.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 md:flex-row md:gap-5">
          {loaderData.clinic.apply_url && (
            <Button
              variant={"secondary"}
              size="lg"
              asChild
              className="h-10 w-full px-10 md:h-14 md:w-auto md:text-lg"
            >
              <Link to={loaderData.clinic.apply_url} target="_blank">
                병원 사이트
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-2.5">
        <NavLink
          end
          className={({ isActive }) =>
            cn(
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            )
          }
          to={`/clinic/${loaderData.clinic.clinic_id}/overview`}
        >
          병원소개
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            cn(
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            )
          }
          to={`/clinic/${loaderData.clinic.clinic_id}/reviews`}
        >
          경험 공유
        </NavLink>
      </div>
      <div>
        <Outlet
          context={{
            clinic_id: loaderData.clinic.clinic_id,
            clinic: loaderData.clinic,
            photos: loaderData.photos,
            ratings: loaderData.ratings,
            review_count: loaderData.ratings.reviewCount.toString(),
            isLoggedIn: isLoggedIn,
          }}
        />
      </div>
    </div>
  );
}
