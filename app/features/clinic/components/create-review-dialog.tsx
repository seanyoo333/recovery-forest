import type { action } from "../pages/clinic-reviews-page";

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
  const [patientFriendliness, setPatientFriendliness] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [hoveredFriendliness, setHoveredFriendliness] = useState<number>(0);
  const actionData = useActionData<typeof action>();
  const { isLoggedIn } = useOutletContext<{ isLoggedIn: boolean }>();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-2xl">
          이 병원의 이용 경험이 어떠셨나요?
        </DialogTitle>
        <DialogDescription>
          이 병원을 이용해 본 경험이 있다면, 경험을 공유해 주세요.
        </DialogDescription>
      </DialogHeader>
      <Form className="space-y-10" method="post">
        <div>
          <Label className="flex flex-col gap-1">
            전체 평점
            <small className="text-muted-foreground">
              전체적인 만족도를 선택해 주세요.
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

        <div>
          <Label className="flex flex-col gap-1">
            환자 친화도
            <small className="text-muted-foreground">
              환자 친화도를 선택해 주세요. (기본값: 5점)
            </small>
          </Label>
          <div className="mt-5 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <label
                key={star}
                className="relative cursor-pointer"
                onMouseEnter={() => setHoveredFriendliness(star)}
                onMouseLeave={() => setHoveredFriendliness(0)}
              >
                <StarIcon
                  className="size-5 text-blue-400"
                  fill={
                    hoveredFriendliness >= star || patientFriendliness >= star
                      ? "currentColor"
                      : "none"
                  }
                />
                <input
                  type="radio"
                  value={star}
                  name="patient_friendliness"
                  required
                  onChange={() => setPatientFriendliness(star)}
                  defaultChecked={star === 5}
                  className="absolute h-px w-px opacity-0"
                />
              </label>
            ))}
          </div>
          {actionData?.formErrors?.patient_friendliness && (
            <p className="text-red-500">
              {actionData.formErrors.patient_friendliness.join(", ")}
            </p>
          )}
        </div>

        <InputPair
          textArea
          required
          name="review"
          label="경험 공유"
          description="최대 1000자까지 작성할 수 있습니다."
          placeholder="경험을 공유해 주세요."
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
            {isLoggedIn ? "공유하기" : "로그인 후 경험을 공유해 주세요."}
          </Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  );
}
