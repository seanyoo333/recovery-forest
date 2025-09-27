import type { Route } from "./+types/product-reviews-page";

import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { z } from "zod";

import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/core/components/ui/dialog";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import CreateReviewDialog from "../components/create-review-dialog";
import ReviewCard from "../components/review-card";
import { createProductReview } from "../mutations";
import { getReviews } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "제품 리뷰" },
    { name: "description", content: "제품 리뷰를 확인하세요" },
  ];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const reviews = await getReviews(client, {
    productId: params.productId,
  });
  return { reviews };
};

const formSchema = z.object({
  review: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
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
  await createProductReview(client, {
    productId: params.productId,
    review: data.review,
    rating: data.rating,
    userId,
  });
  return {
    ok: true,
  };
};

export default function ProductReviewsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { review_count } = useOutletContext<{
    review_count: string;
  }>();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (actionData?.ok) {
      setOpen(false);
    }
  }, [actionData?.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="max-w-xl space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {review_count}{" "}
            {review_count === "0" || review_count === "1"
              ? "Review"
              : "Reviews"}
          </h2>
          <DialogTrigger asChild>
            <Button variant={"secondary"}>리뷰 작성</Button>
          </DialogTrigger>
        </div>
        <div className="space-y-20">
          {loaderData.reviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              username={review.user!.name}
              handle={review.user!.username}
              avatarUrl={review.user!.avatar}
              rating={review.rating}
              content={review.review}
              postedAt={review.created_at}
            />
          ))}
        </div>
      </div>
      <CreateReviewDialog />
    </Dialog>
  );
}
