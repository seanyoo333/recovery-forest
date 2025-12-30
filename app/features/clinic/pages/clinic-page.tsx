import type { Route } from "./+types/clinic-page";

import { DotIcon } from "lucide-react";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";

import { PhotoGallery } from "../components/photo-gallery";
import { getClinicById, getClinicPhotos } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Clinic Details | Evidence Base" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const clinic = await getClinicById(client, { clinicId: params.clinicId });
  const photos = await getClinicPhotos(client, { clinicId: clinic.clinic_id });
  return { clinic, photos };
};

export default function ClinicPage({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <div className="from-primary/80 to-primary/10 h-60 w-full rounded-lg bg-gradient-to-tr"></div>
      <div className="-mt-20 grid grid-cols-1 items-start md:grid-cols-6 md:gap-20">
        <div className="space-y-10 md:col-span-4">
          <div className="flex flex-col gap-2">
            <div className="relative left-10 size-40 overflow-hidden rounded-full bg-white">
              {(() => {
                const logoPhoto = loaderData.photos.find(
                  (p: any) => p.photo_type === "logo",
                );
                return logoPhoto ? (
                  <img
                    src={logoPhoto.photo_url}
                    alt="병원 로고"
                    className="h-full w-full object-cover"
                  />
                ) : loaderData.clinic.clinic_logo ? (
                  <img
                    src={loaderData.clinic.clinic_logo}
                    alt="병원 로고"
                    className="h-full w-full object-cover"
                  />
                ) : null;
              })()}
            </div>
            <h1 className="text-4xl font-bold">
              {loaderData.clinic.clinic_name}
            </h1>
            <h4 className="text-muted-foreground text-lg">
              {loaderData.clinic.clinic_boss} 원장
            </h4>
          </div>
          <div className="flex gap-2">
            <Badge variant={"secondary"}>{loaderData.clinic.clinic_type}</Badge>
            <Badge variant={"secondary"}>
              {loaderData.clinic.clinic_location}
            </Badge>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">병원소개</h4>
            <p className="text-lg">{loaderData.clinic.overview}</p>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">진료 과목</h4>
            <ul className="list-inside list-disc text-lg">
              {loaderData.clinic.skills.split(",").map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">대표 원장 소개</h4>
            <ul className="list-inside list-disc text-lg">
              {[
                loaderData.clinic.qualifications,
                loaderData.clinic.responsibilities,
                loaderData.clinic.benefits,
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">병원 특징</h4>
            <ul className="list-inside list-disc text-lg">
              {[
                loaderData.clinic.position,
                loaderData.clinic.location,
                loaderData.clinic.skills,
                loaderData.clinic.benefits,
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">병원 사진</h4>
            <PhotoGallery photos={loaderData.photos as unknown as any[]} />
          </div>
        </div>
        <div className="sticky top-20 space-y-5 rounded-lg border p-6 md:col-span-2 md:mt-32">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">평균 진료비</span>
            <span className="text-2xl font-medium">$100,000 - $120,000</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Location</span>
            <span className="text-2xl font-medium">Remote</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Type</span>
            <span className="text-2xl font-medium">Full Time</span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground text-sm">
              Posted 2 days ago
            </span>
            <DotIcon className="size-4" />
            <span className="text-muted-foreground text-sm">395 views</span>
          </div>
          <Button className="w-full font-bold">연락하기</Button>
        </div>
      </div>
    </div>
  );
}
