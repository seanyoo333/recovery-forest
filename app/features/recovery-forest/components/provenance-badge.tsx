import { Cpu, Sparkles } from "lucide-react";

import { cn } from "~/core/lib/utils";

/**
 * 출처 배지 — 화면에서 "엔진 계산(규칙)" vs "AI 추론(개인화)"를 구분 표기.
 * 프롬프트 v2 §4의 차별화 논거(설명가능성)를 시각적으로 증명한다.
 */
type Kind = "engine" | "ai";

const META: Record<Kind, { label: string; cls: string }> = {
  engine: {
    label: "엔진 계산",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  ai: {
    label: "AI 추론",
    cls: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
};

export function ProvenanceBadge({
  kind,
  label,
  className,
}: {
  kind: Kind;
  label?: string;
  className?: string;
}) {
  const meta = META[kind];
  const Icon = kind === "ai" ? Sparkles : Cpu;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
        meta.cls,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label ?? meta.label}
    </span>
  );
}
