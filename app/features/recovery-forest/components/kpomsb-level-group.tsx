import {
  KPOMSB_AXES,
  KPOMSB_AXIS_META,
  KPOMSB_LEVELS,
  KPOMSB_MAX,
  type KpomsbAxis,
  type KpomsbScores,
} from "../schemas/prescribe-input.schema";
import { cn } from "~/core/lib/utils";

/**
 * K-POMS-B 정밀 입력 — 축마다 "전혀~매우" 5단계 버튼(0~12).
 * 슬라이더의 방향 혼란을 없애기 위해, 선택값의 "좋음 정도"를 색으로 통일한다.
 *  - 좋은 상태(활력↑·부정지표↓) = emerald
 *  - 보통 = amber, 주의 = stone (회복 친화 톤 — 경고색 지양)
 * 축별로 어느 쪽이 좋은지 라벨로 명시한다.
 */
function goodness(axis: KpomsbAxis, value: number): "good" | "mid" | "low" {
  const meta = KPOMSB_AXIS_META[axis];
  const g = meta.higherIsBetter ? value : KPOMSB_MAX - value;
  if (g >= 9) return "good";
  if (g >= 6) return "mid";
  return "low";
}

const SELECTED_CLS: Record<"good" | "mid" | "low", string> = {
  good: "bg-emerald-600 text-white border-emerald-600",
  mid: "bg-amber-400 text-white border-amber-400",
  low: "bg-stone-400 text-white border-stone-400",
};

export function KpomsbLevelGroup({
  value,
  onChange,
}: {
  value: Partial<KpomsbScores>;
  onChange: (axis: KpomsbAxis, v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {KPOMSB_AXES.map((axis) => {
        const meta = KPOMSB_AXIS_META[axis];
        const v = value[axis];
        return (
          <div
            key={axis}
            className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <div className="flex w-full items-baseline justify-between sm:w-28 sm:flex-col sm:items-start sm:justify-center">
              <span className="font-medium text-gray-900">{axis}</span>
              <span className="text-xs text-gray-400">{meta.hint}</span>
            </div>
            <div className="grid flex-1 grid-cols-5 gap-1.5">
              {KPOMSB_LEVELS.map((lvl) => {
                const selected = v === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => onChange(axis, lvl.value)}
                    aria-pressed={selected}
                    aria-label={`${axis} ${lvl.label}`}
                    className={cn(
                      "min-h-10 rounded-lg border text-sm transition",
                      selected
                        ? SELECTED_CLS[goodness(axis, lvl.value)]
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
                    )}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
            <input type="hidden" name={`kpomsb_${axis}`} value={v ?? ""} />
          </div>
        );
      })}
    </div>
  );
}
