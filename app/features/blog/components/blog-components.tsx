/**
 * Blog Components for MDX
 *
 * Specialized components for creating concise, practical blog posts
 * that extract key information from longer articles.
 *
 * These components follow the application's design system using
 * Tailwind CSS variables and Shadcn UI styling patterns.
 */
import type { ReactNode } from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";

/**
 * SummaryBox Component
 *
 * Displays a concise 3-line summary of the blog post content.
 * Uses a teal color scheme to highlight key information.
 */
export function SummaryBox({ children }: { children: ReactNode }) {
  return (
    <section className="my-6 rounded-lg border border-teal-200/50 bg-teal-50/50 px-4 py-3 text-sm dark:border-teal-800/50 dark:bg-teal-950/30">
      <p className="mb-2 text-lg font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300">
        3줄 요약
      </p>
      <div className="text-foreground space-y-1.5 [&>p]:leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/**
 * WarningBox Component
 *
 * Displays important warnings or cautions.
 * Uses Alert component with destructive variant for consistency.
 */
export function WarningBox({
  title = "주의사항",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <Alert variant="destructive" className="my-6">
      <AlertTitle className="mb-2 text-lg font-semibold tracking-wide uppercase">
        {title}
      </AlertTitle>
      <AlertDescription className="space-y-1.5 [&>p]:leading-relaxed">
        {children}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Callout Component
 *
 * Displays general information or tips.
 * Uses muted background for subtle emphasis.
 */
export function Callout({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <Alert className="bg-muted/50 my-6">
      {title && (
        <AlertTitle className="mb-2 text-lg font-semibold tracking-wide uppercase">
          {title}
        </AlertTitle>
      )}
      <AlertDescription className="space-y-1.5 [&>p]:leading-relaxed">
        {children}
      </AlertDescription>
    </Alert>
  );
}

/**
 * AskDoctorList Component
 *
 * Displays a list of questions to ask the doctor.
 * Uses indigo color scheme for medical/consultation context.
 */
export function AskDoctorList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="my-6 rounded-lg border border-indigo-200/50 bg-indigo-50/50 px-4 py-3 text-sm dark:border-indigo-800/50 dark:bg-indigo-950/30">
      <p className="mb-3 text-lg font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-300">
        담당 선생님께 여쭤볼 수 있는 질문
      </p>
      <ul className="text-foreground space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 leading-relaxed">
            <span className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
              ▸
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * ModeCompare Component
 *
 * Displays a side-by-side comparison of two treatment approaches.
 * Used for comparing metabolic vs immune therapy perspectives.
 */
export function ModeCompare({
  metabolicTitle,
  immuneTitle,
  metabolicItems,
  immuneItems,
}: {
  metabolicTitle: string;
  immuneTitle: string;
  metabolicItems?: string[];
  immuneItems?: string[];
}) {
  const defaultMetabolicItems = [
    "혈당·인슐린·IGF-1·염증을 낮춰 성장 자극 최소화",
    "암세포의 에너지 공급을 줄여 서서히 자멸사 유도",
    "과도한 TLR 자극과 만성 염증 증가는 조심",
  ];
  const defaultImmuneItems = [
    "종양미세환경을 '염증성 종양(inflamed tumor)'으로 전환",
    "T세포·NK세포를 종양 주변으로 모으고 활성화",
    "TLR 작용제 + 면역관문억제제 시너지 가능성 연구 중",
  ];

  return (
    <section className="my-6 text-sm">
      <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        치료 관점 비교
      </p>
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted/30 grid grid-cols-1 divide-y text-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-4">
            <p className="mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {metabolicTitle}
            </p>
            <ul className="text-muted-foreground space-y-1.5">
              {(metabolicItems || defaultMetabolicItems).map((item, index) => (
                <li key={index} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="px-4 py-4">
            <p className="mb-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
              {immuneTitle}
            </p>
            <ul className="text-muted-foreground space-y-1.5">
              {(immuneItems || defaultImmuneItems).map((item, index) => (
                <li key={index} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * ReferenceItem type for reference lists
 */
export type ReferenceItem = {
  label: string;
  href: string;
  /** 논문·리포트의 제목 (DB paper_title 등) */
  paper_title?: string;
  /** 참고 자료가 무엇인지 (제목·출처 요약 등) */
  description?: string;
  /** 왜 이 자료가 선별되었는지 */
  rationale?: string;
  /** 연구 설계 유형 (예: RCT, 메타분석 등) */
  study_type?: string;
};

type ReferenceListProps = {
  items: ReferenceItem[];
  /** true면 상단 "참고 자료" 제목·구분선 없음 (상위 카드 안에 넣을 때) */
  embedded?: boolean;
};

/**
 * ReferenceList Component
 *
 * Displays a list of reference materials and links.
 * Used at the end of blog posts to cite sources.
 */
export function ReferenceList({ items, embedded = false }: ReferenceListProps) {
  if (!items.length) return null;
  const list = (
    <ul className="text-muted-foreground space-y-4 pl-5">
      {items.map((ref, index) => (
        <li
          key={index}
          className="marker:text-muted-foreground list-disc leading-relaxed"
        >
          <div>
            {ref.paper_title ? (
              <div className="mb-2">
                <p className="text-muted-foreground text-xs font-medium">논문 제목</p>
                <p className="text-foreground mt-1 text-sm font-semibold leading-snug">
                  {ref.paper_title}
                </p>
              </div>
            ) : null}
            <a
              href={ref.href}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground break-all font-medium text-foreground underline decoration-dotted underline-offset-2 transition-colors"
            >
              {ref.paper_title &&
              ref.label.trim() === ref.paper_title.trim()
                ? "원문 링크"
                : ref.label}
            </a>
            {ref.description ? (
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                {ref.description}
              </p>
            ) : null}
            {ref.label.trim() !== ref.href.trim() ? (
              <p className="mt-2 break-all font-mono text-xs leading-relaxed text-muted-foreground">
                {ref.href}
              </p>
            ) : null}
            {ref.rationale ? (
              <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-xs leading-relaxed text-foreground/85">
                <p className="text-muted-foreground font-medium">선별 이유</p>
                <p className="mt-2 whitespace-pre-line">{ref.rationale}</p>
              </div>
            ) : null}
            {ref.study_type ? (
              <div className="mt-5 border-t border-border/60 pt-4">
                <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                  <span className="text-muted-foreground font-medium">
                    연구 유형(study_type)
                  </span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                  {ref.study_type}
                </p>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );

  if (embedded) {
    return <div className="text-sm">{list}</div>;
  }

  return (
    <section className="mt-8 border-t pt-6 text-sm">
      <h2 className="mb-3 text-lg font-semibold">참고 자료</h2>
      {list}
    </section>
  );
}
