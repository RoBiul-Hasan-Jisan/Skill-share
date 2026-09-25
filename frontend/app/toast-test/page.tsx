"use client";

import { ToastProvider, useToast } from "@/components/ui/Toast";

function ToastDemo() {
  const toast = useToast();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold text-white">
          Toast Preview
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => toast("Successfully completed!", "success")}
            className="rounded-lg bg-green-600 px-5 py-3 text-white"
          >
            Success
          </button>

          <button
            onClick={() => toast("Something went wrong.", "error")}
            className="rounded-lg bg-red-600 px-5 py-3 text-white"
          >
            Error
          </button>

          <button
            onClick={() => toast("Here is some information.", "info")}
            className="rounded-lg bg-cyan-600 px-5 py-3 text-white"
          >
            Info
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ToastTestPage() {
  return (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  );
}