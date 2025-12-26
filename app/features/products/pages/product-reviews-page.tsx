import type { Route } from "./+types/product-reviews-page";

import { DateTime } from "luxon";
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
  order_number: z.string().min(1, "주문번호를 입력해 주세요."),
  order_date: z.coerce.date({
    required_error: "주문일자를 입력해 주세요.",
    invalid_type_error: "올바른 날짜 형식을 입력해 주세요.",
  }),
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

  const productId = params.productId;

  // 1. 주문번호 + 주문일자 검증 (6개월 이내, 본인 주문, 아직 보상 미지급)
  const sixMonthsAgo = DateTime.now().minus({ months: 6 }).toISODate();

  const { data: order, error: orderError } = await (client as any)
    .from("product_orders")
    .select("product_order_id, is_review_rewarded")
    .eq("order_number", data.order_number)
    .eq("product_id", Number(productId))
    .eq("profile_id", userId)
    .gte("order_date", sixMonthsAgo)
    .eq("is_review_rewarded", false)
    .single();

  if (orderError || !order) {
    return {
      formErrors: {
        order_number: ["유효한 주문이 아니거나, 이미 보상을 받은 주문입니다."],
      },
    };
  }

  // 2. 리뷰 생성 (구매자만 가능)
  await createProductReview(client, {
    productId: params.productId,
    review: data.review,
    rating: data.rating,
    userId,
  });

  // 3. 포인트 지급 (예: 리뷰 1개당 100포인트)
  const rewardPoints = 100;

  const { data: profile } = await client
    .from("profiles")
    .select("points")
    .eq("profile_id", userId)
    .single();

  const currentPoints = profile?.points ?? 0;

  await client
    .from("profiles")
    .update({
      points: currentPoints + rewardPoints,
      points_updated_at: new Date().toISOString(),
    })
    .eq("profile_id", userId);

  // 4. 주문 건에 대해 보상 처리 플래그 업데이트
  await (client as any)
    .from("product_orders")
    .update({ is_review_rewarded: true })
    .eq("product_order_id", order.product_order_id);

  return {
    ok: true,
    rewardedPoints: rewardPoints,
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
