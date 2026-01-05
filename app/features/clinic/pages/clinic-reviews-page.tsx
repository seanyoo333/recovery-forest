import type { Route } from "./+types/clinic-reviews-page";

import { useEffect, useState } from "react";
import { z } from "zod";

import { Button } from "~/core/components/ui/button";
import { Dialog, DialogTrigger } from "~/core/components/ui/dialog";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import CreateReviewDialog from "../components/create-review-dialog";
import ReviewCard from "../components/review-card";
import { createClinicReview } from "../mutations";
import { getClinicReviews } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "병원 경험 공유 | Evidence Base" },
    { name: "description", content: "병원 이용 경험을 공유하세요" },
  ];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const reviews = await getClinicReviews(client, {
    clinicId: params.clinicId,
  });
  return { reviews };
};

const formSchema = z.object({
  review: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
  patient_friendliness: z.coerce.number().min(1).max(5).default(5),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client, headers] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const { success, error, data } = formSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!success) {
    return {
      formErrors: error.flatten().fieldErrors,
    };
  }

  await createClinicReview(client, {
    clinicId: params.clinicId,
    review: data.review,
    rating: data.rating,
    patientFriendliness: data.patient_friendliness,
    userId,
  });

  return {
    ok: true,
  };
};

export default function ClinicReviewsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (actionData?.ok) {
      setOpen(false);
      window.location.reload();
    }
  }, [actionData?.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="max-w-xl space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {loaderData.reviews.length}개의 경험 공유
          </h2>
          <DialogTrigger asChild>
            <Button variant={"secondary"}>경험 공유</Button>
          </DialogTrigger>
        </div>
        {loaderData.reviews.length === 0 ? (
          <p className="text-muted-foreground text-center">
            아직 등록된 경험 공유가 없습니다. 첫 번째 경험을 공유해보세요!
          </p>
        ) : (
          <div className="space-y-20">
            {loaderData.reviews.map((review) => (
              <ReviewCard
                key={review.review_id}
                username={review.user!.name}
                handle={review.user!.username}
                avatarUrl={review.user!.avatar}
                rating={review.rating}
                patientFriendliness={review.patient_friendliness}
                content={review.review}
                postedAt={review.created_at}
              />
            ))}
          </div>
        )}
      </div>
      <CreateReviewDialog />
    </Dialog>
  );
}
