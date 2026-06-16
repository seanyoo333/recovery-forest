import type { RecoveryPoint } from "../schemas/prescribe-output.schema";
import { recoveryPointIcon } from "./recovery-icons";

/**
 * "오늘의 회복 포인트" 4칸 — 점수 대신 혜택을 아이콘+한 줄로(감성).
 * 내용은 사용자 상태·추천 숲 특성에 맞춰 빌더가 채운다.
 */
export function RecoveryPoints({ points }: { points: RecoveryPoint[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {points.map((p, i) => {
        const Icon = recoveryPointIcon(p.icon);
        return (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:bg-emerald-50/80"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700">
              <Icon className="size-5" aria-hidden />
            </span>
            <p className="text-sm leading-snug font-semibold text-gray-900">
              {p.title}
            </p>
            <p className="text-xs leading-relaxed text-gray-500">{p.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
