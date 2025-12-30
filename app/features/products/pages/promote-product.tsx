import type { DateRange } from "react-day-picker";

import type { Route } from "./+types/promote-product";

import { DateTime } from "luxon";
import { useState } from "react";
import { Form } from "react-router";

import { Hero } from "~/core/components/hero";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import { Calendar } from "~/core/components/ui/calendar";
import { Label } from "~/core/components/ui/label";

export const meta: Route.MetaFunction = () => {
  return [{ name: "description", content: "Promote your product" }];
};

export default function PromotePage() {
  const [promotionPeriod, setPromotionPeriod] = useState<
    DateRange | undefined
  >();
  const totalDays =
    promotionPeriod?.from && promotionPeriod.to
      ? DateTime.fromJSDate(promotionPeriod.from).diff(
          DateTime.fromJSDate(promotionPeriod.to),
          "days",
        ).days
      : 0;
  return (
    <div>
      <Hero
        title="Promote Your Product"
        subtitle="Boost your product's visibility."
      />
      <Form className="mx-auto flex max-w-sm flex-col items-center gap-10">
        <SelectPair
          label="Select a product"
          description="Select a product to promote"
          name="product"
          placeholder="Select a product"
          options={[
            {
              label: "Green Tea Extract",
              value: "green-tea-extract",
            },
            {
              label: "Green Tea Extract",
              value: "green-tea-extract1",
            },
            {
              label: "Green Tea Extract",
              value: "green-tea-extract2",
            },
            {
              label: "Green Tea Extract",
              value: "green-tea-extract3",
            },
          ]}
        />
        <div className="flex w-full flex-col items-center gap-2">
          <Label className="flex flex-col items-center gap-2">
            홍보기간
            <small className="text-muted-foreground block text-center">
              홍보 기간은 최소 3일 입니다.
            </small>
          </Label>
          <Calendar
            className="scale-100"
            mode="range"
            selected={promotionPeriod}
            onSelect={setPromotionPeriod}
            min={3}
            disabled={{ before: new Date() }}
          />
        </div>
        <Button disabled={totalDays === 0}>
          결재 하기 (${totalDays * 20})
        </Button>
      </Form>
    </div>
  );
}
