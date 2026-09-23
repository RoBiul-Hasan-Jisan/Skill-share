import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  interactive?: boolean;
}

/** Base surface for the app — a solid manifest entry, not a glass card. */
export function Panel({ className, accent, interactive, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        "glass relative p-5",
        accent && "glow-border",
        interactive && "glass-hover cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
