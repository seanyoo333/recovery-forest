import { useState } from "react";

import {
  WELLNESS_AXES,
  WELLNESS_AXIS_IMPROVEMENT,
  WELLNESS_AXIS_LABELS,
  type WellnessAxis,
} from "../schemas/wellness.schema";

const AXIS_FIELD: Record<WellnessAxis, string> = {
  sleep: "sleep_score",
  fatigue: "fatigue_score",
  mood: "mood_score",
  stress: "stress_score",
};

const AXIS_HINT: Record<WellnessAxis, string> = {
  sleep: "높을수록 잘 잤어요",
  fatigue: "낮을수록 덜 피로해요",
  mood: "높을수록 기분이 좋아요",
  stress: "낮을수록 스트레스가 적어요",
};

/**
 * 사전/사후 공용 자가보고 슬라이더(1-10). pre-survey, post-survey 폼에서 재사용.
 */
export function WellnessFields({ initial = 5 }: { initial?: number }) {
  return (
    <div className="flex flex-col gap-6">
      {WELLNESS_AXES.map((axis) => (
        <WellnessSlider
          key={axis}
          axis={axis}
          name={AXIS_FIELD[axis]}
          initial={initial}
        />
      ))}
    </div>
  );
}

function WellnessSlider({
  axis,
  name,
  initial,
}: {
  axis: WellnessAxis;
  name: string;
  initial: number;
}) {
  const [value, setValue] = useState(initial);
  const improvement =
    WELLNESS_AXIS_IMPROVEMENT[axis] === "increase" ? "↑ 좋아짐" : "↓ 좋아짐";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={name} className="text-lg font-semibold">
          {WELLNESS_AXIS_LABELS[axis]}{" "}
          <span className="text-xs font-normal text-gray-400">
            ({improvement})
          </span>
        </label>
        <span className="text-xl font-bold text-emerald-700">{value}</span>
      </div>
      <input
        id={name}
        name={name}
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-emerald-600"
      />
      <span className="text-sm text-gray-500">{AXIS_HINT[axis]}</span>
    </div>
  );
}
