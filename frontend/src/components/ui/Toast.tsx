"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ToastCtx = createContext<{
  toast: (message: string, type?: ToastType) => void;
} | null>(null);

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-neon-lime" />,
  error: <AlertTriangle className="h-4 w-4 text-neon-magenta" />,
  info: <Info className="h-4 w-4 text-neon-cyan" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const dismiss = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "glass flex items-start gap-3 p-3.5 text-sm",
                t.type === "success" && "shadow-glow",
              )}
            >
              <span className="mt-0.5">{icons[t.type]}</span>
              <p className="flex-1 text-slate-200">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-slate-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
