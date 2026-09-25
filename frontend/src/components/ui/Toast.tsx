
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  Users,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4200;

const config = {
  success: {
    icon: Check,
    iconBg: "bg-lime-400/10",
    iconColor: "text-lime-300",
    glow: "rgba(163,230,53,0.22)",
    border: "border-lime-400/20",
    label: "SYNC COMPLETE",
    code: "SKILL://SUCCESS",
  },

  error: {
    icon: AlertTriangle,
    iconBg: "bg-fuchsia-400/10",
    iconColor: "text-fuchsia-300",
    glow: "rgba(217,70,239,0.22)",
    border: "border-fuchsia-400/20",
    label: "ACTION FAILED",
    code: "SYSTEM://ERROR",
  },

  info: {
    icon: Info,
    iconBg: "bg-cyan-400/10",
    iconColor: "text-cyan-300",
    glow: "rgba(34,211,238,0.22)",
    border: "border-cyan-400/20",
    label: "NEW ACTIVITY",
    code: "NETWORK://INFO",
  },
};

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: number) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id),
    );

    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now() + Math.random();

      setToasts((current) => [
        ...current,
        {
          id,
          type,
          message,
        },
      ]);

      const timer = setTimeout(() => {
        setToasts((current) =>
          current.filter((toast) => toast.id !== id),
        );

        timers.current.delete(id);
      }, TOAST_DURATION);

      timers.current.set(id, timer);
    },
    [],
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}

      <div
        className={cn(
          "pointer-events-none fixed z-[9999]",
          "right-4 top-4 sm:right-6 sm:top-6",
          "flex w-[calc(100vw-2rem)] max-w-[390px]",
          "flex-col gap-3",
        )}
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => {
            const current = config[item.type];
            const Icon = current.icon;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{
                  opacity: 0,
                  y: -20,
                  x: 30,
                  scale: 0.94,
                  filter: "blur(8px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: 0,
                  scale: 1,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  x: 30,
                  scale: 0.96,
                  filter: "blur(6px)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                }}
                className="pointer-events-auto"
              >
                <div
                  className={cn(
                    "group relative overflow-hidden",
                    "rounded-2xl",
                    "border border-white/[0.08]",
                    "border-l-2",
                    current.border,
                    "bg-[#070b12]/95",
                    "backdrop-blur-2xl",
                    "shadow-2xl",
                  )}
                  style={{
                    boxShadow: `0 20px 60px ${current.glow}`,
                  }}
                >
                  {/* Ambient glow */}
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full blur-3xl"
                    style={{
                      background: current.glow,
                    }}
                  />

                  {/* Technical grid */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.035]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />

                  {/* Animated top scan */}
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                    className="absolute left-0 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />

                  <div className="relative p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          "relative flex h-10 w-10 shrink-0 items-center justify-center",
                          "rounded-xl",
                          current.iconBg,
                          "border border-white/[0.06]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px]",
                            current.iconColor,
                          )}
                          strokeWidth={2.2}
                        />

                        {/* Pulse */}
                        <motion.span
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.35, 0, 0.35],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                          className={cn(
                            "absolute inset-0 rounded-xl border",
                            current.border,
                          )}
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Sparkles
                            className={cn(
                              "h-3 w-3",
                              current.iconColor,
                            )}
                          />

                          <span
                            className={cn(
                              "text-[9px] font-bold tracking-[0.18em]",
                              current.iconColor,
                            )}
                          >
                            {current.label}
                          </span>
                        </div>

                        <p className="mt-1.5 text-[13px] font-medium leading-5 text-white/90">
                          {item.message}
                        </p>

                        {/* Developer metadata */}
                        <div className="mt-2 flex items-center gap-2">
                          <Code2 className="h-3 w-3 text-white/30" />

                          <span className="font-mono text-[9px] tracking-wide text-white/30">
                            {current.code}
                          </span>

                          <span className="h-1 w-1 rounded-full bg-white/20" />

                          <span className="font-mono text-[9px] text-white/25">
                            {new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Close */}
                      <button
                        type="button"
                        onClick={() => dismiss(item.id)}
                        aria-label="Dismiss notification"
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center",
                          "rounded-lg",
                          "text-white/25",
                          "transition-all duration-200",
                          "hover:bg-white/[0.07]",
                          "hover:text-white/80",
                        )}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.03]">
                    <motion.div
                      initial={{ scaleX: 1 }}
                      animate={{ scaleX: 0 }}
                      transition={{
                        duration: TOAST_DURATION / 1000,
                        ease: "linear",
                      }}
                      className="h-full origin-left"
                      style={{
                        background: current.iconColor
                          .replace("text-", "")
                          .includes("lime")
                          ? "rgb(163 230 53)"
                          : current.iconColor
                              .includes("fuchsia")
                          ? "rgb(217 70 239)"
                          : "rgb(34 211 238)",
                      }}
                    />
                  </div>

                  {/* Bottom corner decoration */}
                  <div className="absolute bottom-2 right-3 flex items-center gap-1 opacity-20">
                    <Users className="h-3 w-3 text-white" />
                    <span className="font-mono text-[8px] text-white">
                      SHARE
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastCtx);

  if (!ctx) {
    throw new Error(
      "useToast must be used within ToastProvider",
    );
  }

  return ctx.toast;
}

