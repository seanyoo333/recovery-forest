import * as React from "react";

/**
 * 간단한 className 머지 유틸
 */
function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * H1 Typography Component
 *
 * MDX 내부 최상위 제목용 (본문 기준이라 너무 크지 않게 조정)
 */
export function TypographyH1({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cx(
        // 기존보다 살짝 줄이고 줄 간격 여유 있게
        "scroll-m-20 text-2xl leading-relaxed font-semibold tracking-tight md:text-3xl md:leading-snug",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

/**
 * H2 Typography Component
 *
 * 섹션 제목용
 */
export function TypographyH2({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cx(
        "mt-10 scroll-m-20 border-b pb-2 text-xl leading-relaxed font-semibold tracking-tight first:mt-0 md:text-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

/**
 * H3 Typography Component
 *
 * 하위 섹션 제목용
 */
export function TypographyH3({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cx("mt-8 scroll-m-20 text-lg leading-relaxed font-semibold tracking-tight md:text-xl", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * H4 Typography Component
 *
 * 더 세부적인 소제목용
 */
export function TypographyH4({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 className={cx("mt-6 scroll-m-20 text-base font-semibold tracking-tight md:text-lg", className)} {...props}>
      {children}
    </h4>
  );
}

/**
 * Paragraph Typography Component
 *
 * 기본 문단 스타일
 */
export function TypographyP({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cx(
        // 기본 문단 간격 & 읽기 편한 줄 간격
        "text-foreground mt-4 text-[15px] leading-relaxed md:text-base",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Blockquote Typography Component
 *
 * 인용문 스타일
 */
export function TypographyBlockquote({ children, className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className={cx("text-muted-foreground mt-6 border-l-2 pl-5 text-sm italic md:text-base", className)}
      {...props}
    >
      {children}
    </blockquote>
  );
}

/**
 * Unordered List Typography Component
 *
 * - 리스트용
 */
export function TypographyList({ children, className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cx("my-4 ml-5 list-disc space-y-1.5 [&>li]:leading-relaxed", className)} {...props}>
      {children}
    </ul>
  );
}

/**
 * Ordered List Typography Component
 *
 * 1. 2. 리스트용
 */
export function TypographyOrderedList({ children, className, ...props }: React.HTMLAttributes<HTMLOListElement>) {
  return (
    <ol className={cx("my-4 ml-5 list-decimal space-y-1.5 [&>li]:leading-relaxed", className)} {...props}>
      {children}
    </ol>
  );
}

/**
 * Inline Code Typography Component
 *
 * 문장 중간 코드 표시용
 */
export function TypographyInlineCode({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cx(
        "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold md:text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}
