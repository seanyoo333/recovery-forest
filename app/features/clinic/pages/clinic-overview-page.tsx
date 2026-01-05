import type { Route } from "./+types/clinic-overview-page";

import { useOutletContext } from "react-router";

import { PhotoGallery } from "../components/photo-gallery";

export default function ClinicOverviewPage() {
  const { clinic, photos } = useOutletContext<{
    clinic: any;
    photos: any[];
  }>();

  return (
    <div className="space-y-10">
      <div className="space-y-2.5">
        <h3 className="text-2xl font-bold">병원소개</h3>
        <p className="text-lg">{clinic.overview}</p>
      </div>
      <div className="space-y-2.5">
        <h3 className="text-2xl font-bold">진료 과목</h3>
        <ul className="list-inside list-disc text-lg">
          {clinic.skills.split(",").map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="space-y-2.5">
        <h3 className="text-2xl font-bold">대표 원장 소개</h3>
        <ul className="list-inside list-disc text-lg">
          {[
            clinic.qualifications,
            clinic.responsibilities,
            clinic.benefits,
          ].map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="space-y-2.5">
        <h3 className="text-2xl font-bold">병원 특징</h3>
        <ul className="list-inside list-disc text-lg">
          {[
            clinic.position,
            clinic.location,
            clinic.skills,
            clinic.benefits,
          ].map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      {photos && photos.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-2xl font-bold">병원 사진</h3>
          <PhotoGallery photos={photos} />
        </div>
      )}
    </div>
  );
}
