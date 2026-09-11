import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "subtle" | "white";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-neon-grad text-white font-semibold shadow-glow hover:opacity-90 active:opacity-80 hover:-translate-y-px",
  white:
    "bg-white text-black font-semibold hover:bg-white/90 active:bg-white/80",
  ghost:
    "text-white/40 hover:text-white hover:bg-white/[0.05]",
  outline:
    "border border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/[0.03]",
  subtle:
    "bg-white/[0.05] text-white/70 hover:bg-white/[0.08] hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-7 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight",
        "transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
