import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
}

export function GlassCard({ className, glow, interactive, ...rest }: Props) {
  return (
    <div
      className={cn(
        "glass p-5",
        glow && "glow-border",
        interactive && "glass-hover cursor-pointer",
        className,
      )}
      {...rest}
    />
  );
}
