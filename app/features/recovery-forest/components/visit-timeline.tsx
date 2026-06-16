import type { ItineraryStep } from "../schemas/prescribe-output.schema";
import { activityIcon } from "./recovery-icons";

/**
 * 방문 동선 타임라인(카드형). 각 스텝에 placeholder 썸네일 + 활동 아이콘 + 시간·활동·장소.
 * 사진은 데모 플레이스홀더(recovery-forest.png) — 추후 단계별 실제 사진으로 교체.
 */
export function VisitTimeline({ steps }: { steps: ItineraryStep[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const Icon = activityIcon(step.activity);
        return (
          <li
            key={`${step.time}-${i}`}
            className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url(/recovery-forest.png)" }}
              />
              <div aria-hidden className="absolute inset-0 bg-emerald-950/30" />
              <span className="absolute inset-0 flex items-center justify-center text-white">
                <Icon className="size-6" aria-hidden />
              </span>
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-bold tabular-nums text-emerald-700">
                  {step.time}
                </span>
                <span className="font-medium text-gray-900">{step.activity}</span>
              </div>
              <p className="truncate text-sm text-gray-500">
                {step.link ? (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-gray-300 underline-offset-2 hover:text-emerald-700"
                  >
                    {step.place}
                  </a>
                ) : (
                  step.place
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
