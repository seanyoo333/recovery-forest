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
      <p className="mb-2 text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300">
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
      <AlertTitle className="mb-2 text-xs font-semibold tracking-wide uppercase">
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
        <AlertTitle className="mb-2 text-xs font-semibold tracking-wide uppercase">
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
      <p className="mb-3 text-xs font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-300">
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
type ReferenceItem = {
  label: string;
  href: string;
};

/**
 * ReferenceList Component
 *
 * Displays a list of reference materials and links.
 * Used at the end of blog posts to cite sources.
 */
export function ReferenceList({ items }: { items: ReferenceItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8 border-t pt-6 text-sm">
      <h2 className="mb-3 text-base font-semibold">참고 자료</h2>
      <ul className="text-muted-foreground space-y-2 pl-5">
        {items.map((ref, index) => (
          <li
            key={index}
            className="marker:text-muted-foreground list-disc leading-relaxed"
          >
            <a
              href={ref.href}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline decoration-dotted underline-offset-2 transition-colors"
            >
              {ref.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
