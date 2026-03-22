import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "~/core/lib/utils";

function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
  /**
   * `panel`: 카드/팝오버 스타일 — 긴 설명·여러 단락에 적합 (대비·가독성).
   * `default`: 기존 컴팩트한 primary 툴팁.
   */
  variant?: "default" | "panel";
};

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  variant = "default",
  ...props
}: TooltipContentProps) {
  const surface =
    variant === "panel"
      ? "border-border bg-popover text-popover-foreground border shadow-lg ring-1 ring-black/5 dark:ring-white/10"
      : "bg-primary text-primary-foreground";
  const arrowSurface =
    variant === "panel" ? "border-border bg-popover fill-popover" : "bg-primary fill-primary";
  const padding =
    variant === "panel" ? "p-0 text-left text-sm text-balance antialiased" : "px-3 py-1.5 text-xs";

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        data-variant={variant}
        sideOffset={sideOffset}
        className={cn(
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-lg",
          surface,
          padding,
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className={cn(
            "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]",
            arrowSurface,
          )}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
