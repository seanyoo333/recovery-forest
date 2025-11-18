import SelectPair from "~/core/components/select-pair";
import type { Route } from "./+types/promote-page";
import { Hero } from "~/core/components/hero";
import { Form } from "react-router";
import { Calendar } from "~/core/components/ui/calendar";
import { Label } from "~/core/components/ui/label";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateTime } from "luxon";
import { Button } from "~/core/components/ui/button";

export const meta: Route.MetaFunction = () => {
  return [
    { name: "description", content: "Promote your product" },
  ];
}


export default function PromotePage() {
  const [promotionPeriod, setPromotionPeriod] = useState<
    DateRange | undefined
    >();
  const totalDays=
  promotionPeriod?.from && promotionPeriod.to
   ? DateTime.fromJSDate(promotionPeriod.from).diff(
    DateTime.fromJSDate(promotionPeriod.to),
    "days"
   ).days
   : 0;
  return (
    <div>
      <Hero   
        title="Promote Your Product"
        subtitle="Boost your product's visibility."
      />
      <Form className="max-w-sm mx-auto flex flex-col gap-10 items-center">
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
        <div className="flex flex-col gap-2 items-center w-full" >
        <Label className="flex flex-col items-center gap-2">홍보기간
        <small className="text-muted-foreground text-center block">
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
        <Button disabled={totalDays === 0}>결재 하기 (${totalDays * 20})</Button>
      </Form>

    </div>
  );
}