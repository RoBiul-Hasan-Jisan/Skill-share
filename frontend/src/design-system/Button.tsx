import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "paper" | "outline" | "quiet" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  solid: "bg-neon-grad text-[#14161A] font-semibold shadow-glow hover:shadow-glow-blue active:translate-y-px",
  paper: "bg-white text-black font-semibold hover:bg-white/90 active:bg-white/80",
  outline: "border border-white/15 text-white/75 hover:border-neon-cyan/50 hover:text-white",
  quiet: "bg-white/[0.05] text-white/75 hover:bg-white/[0.09] hover:text-white",
  ghost: "text-white/45 hover:text-white hover:bg-white/[0.05]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-7 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "solid", size = "md", loading, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-medium tracking-tight",
        "transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none",
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
