import type { ItineraryStep } from "../schemas/prescribe-output.schema";

/**
 * 방문 동선 타임라인(여정형). itinerary.steps 를 세로 타임라인으로 렌더.
 */
export function VisitTimeline({ steps }: { steps: ItineraryStep[] }) {
  return (
    <ol className="relative ml-1 flex flex-col gap-5 border-l-2 border-emerald-100 pl-6">
      {steps.map((step, i) => (
        <li key={`${step.time}-${i}`} className="relative">
          <span
            className="absolute top-1 -left-[1.72rem] size-3 rounded-full border-2 border-white bg-emerald-500 ring-2 ring-emerald-200"
            aria-hidden
          />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-bold tabular-nums text-emerald-700">
              {step.time}
            </span>
            <span className="font-medium text-gray-900">{step.activity}</span>
          </div>
          <p className="text-sm text-gray-500">
            {step.link ? (
              <a
                href={step.link}
                className="underline decoration-gray-300 underline-offset-2 hover:text-emerald-700"
                target="_blank"
                rel="noreferrer"
              >
                {step.place}
              </a>
            ) : (
              step.place
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
