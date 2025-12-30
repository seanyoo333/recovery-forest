import type { action } from "../pages/product-reviews-page";

import { StarIcon } from "lucide-react";
import { useState } from "react";
import { Form } from "react-router";
import { useActionData, useOutletContext } from "react-router";

import InputPair from "~/core/components/input-pair";
import { Button } from "~/core/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Label } from "~/core/components/ui/label";
import { cn } from "~/core/lib/utils";

export default function CreateReviewDialog() {
  const [rating, setRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const actionData = useActionData<typeof action>();
  const { isLoggedIn } = useOutletContext<{ isLoggedIn: boolean }>();
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-2xl">
          이 제품에 대해 어떻게 생각하세요?
        </DialogTitle>
        <DialogDescription>
          실제 구매자만 리뷰를 작성할 수 있으며, 유효한 주문번호로 리뷰를 남기면
          AI 채팅에 사용할 수 있는 포인트가 지급됩니다.
        </DialogDescription>
      </DialogHeader>
      <Form className="space-y-10" method="post">
        <div>
          <Label className="flex flex-col gap-1">
            평점
            <small className="text-muted-foreground">
              평점을 선택해 주세요.
            </small>
          </Label>
          <div className="mt-5 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <label
                key={star}
                className="relative cursor-pointer"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
              >
                <StarIcon
                  className="size-5 text-yellow-400"
                  fill={
                    hoveredStar >= star || rating >= star
                      ? "currentColor"
                      : "none"
                  }
                />
                <input
                  type="radio"
                  value={star}
                  name="rating"
                  required
                  onChange={() => setRating(star)}
                  className="absolute h-px w-px opacity-0"
                />
              </label>
            ))}
          </div>
          {actionData?.formErrors?.rating && (
            <p className="text-red-500">
              {actionData.formErrors.rating.join(", ")}
            </p>
          )}
        </div>

        {/* 주문 정보 입력 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order_number" className="flex flex-col gap-1">
              주문번호
              <small className="text-muted-foreground">
                온라인 몰에서 발급된 주문번호를 입력해 주세요.
              </small>
            </Label>
            <InputPair
              id="order_number"
              name="order_number"
              label="주문번호"
              description="온라인 몰에서 발급된 주문번호를 입력해 주세요."
              placeholder="예: 2024-01-01-12345678"
              required
            />
            {actionData?.formErrors?.order_number && (
              <p className="text-red-500">
                {actionData.formErrors.order_number.join(", ")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="order_date" className="flex flex-col gap-1">
              주문일자
              <small className="text-muted-foreground">
                주문일자가 6개월 이내인 경우에만 포인트가 지급됩니다.
              </small>
            </Label>
            <input
              id="order_date"
              name="order_date"
              type="date"
              required
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
            {actionData?.formErrors?.order_date && (
              <p className="text-red-500">
                {actionData.formErrors.order_date.join(", ")}
              </p>
            )}
          </div>
        </div>

        <InputPair
          textArea
          required
          name="review"
          label="리뷰"
          description="최대 1000자까지 작성할 수 있습니다."
          placeholder="리뷰를 작성해 주세요."
        />
        {actionData?.formErrors?.review && (
          <p className="text-red-500">
            {actionData.formErrors.review.join(", ")}
          </p>
        )}
        <DialogFooter>
          <Button
            disabled={!isLoggedIn}
            className={cn(!isLoggedIn && "cursor-not-allowed")}
          >
            {isLoggedIn ? "리뷰 보내기" : "로그인 후 리뷰를 작성해 주세요."}
          </Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  );
}
