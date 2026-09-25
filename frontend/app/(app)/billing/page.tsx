"use client";

// Billing is temporarily disabled — nav entry removed in
// src/layout/app-shell/nav-items.ts and the backend checkout/webhook
// routes are commented out in backend/src/index.ts. This route is left
// in place (rather than deleted) so a direct link to /billing doesn't
// 404, and the original page is preserved below, commented out, to
// restore quickly when billing comes back.

export default function Billing() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="font-display text-lg font-semibold text-white">Billing isn't available right now</p>
      <p className="mt-1 max-w-sm text-sm text-slate-400">
        This section is temporarily disabled. Check back soon.
      </p>
    </div>
  );
}

/* ── Original billing page, preserved for when this is re-enabled ──────────

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, CreditCard } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const tiers = [
  { id: "free", name: "Free", price: 0, features: ["Public profile", "5 matches / mo", "Join 1 team", "Community search"] },
  { id: "pro", name: "Pro", price: 12, features: ["Unlimited matches", "Semantic search", "Unlimited teams", "Profile + trust analytics", "Priority in discovery"], popular: true },
  { id: "startup", name: "Startup", price: 49, features: ["Everything in Pro", "Cofounder matching", "Recruiter dashboard", "Team workspace seats", "Idea generation tools"] },
];

export default function Billing() {
  const toast = useToast();
  const [current] = useState("pro");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Real impl: POST /billing/checkout -> Stripe Checkout Session -> redirect.
  const checkout = (id: string) => {
    setLoadingId(id);
    setTimeout(() => {
      setLoadingId(null);
      toast(`Redirecting to Stripe Checkout for ${id}…`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-white">Billing & Plans</h1>
        <p className="text-sm text-slate-400">Powered by Stripe subscriptions. Cancel anytime.</p>
      </header>

      <GlassCard glow className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-neon-soft text-neon-cyan"><Zap className="h-5 w-5" /></span>
          <div>
            <p className="text-sm text-slate-400">Current plan</p>
            <p className="font-display text-lg font-bold text-white">Pro · $12/mo</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <CreditCard className="h-4 w-4" /> Visa •••• 4242 · renews Jul 1
        </div>
        <Button variant="outline" size="sm">Manage in Stripe</Button>
      </GlassCard>

      <div className="grid gap-5 md:grid-cols-3">
        {tiers.map((t, i) => {
          const isCurrent = t.id === current;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <GlassCard glow={t.popular} className={cn("flex h-full flex-col", t.popular && "shadow-glow-blue")}>
                {t.popular && <Badge tone="blue" className="mb-3 w-fit">Most popular</Badge>}
                <p className="font-display text-lg font-semibold text-grad">{t.name}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-white">${t.price}</span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-neon-cyan" /> {f}</li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isCurrent ? "subtle" : t.popular ? "primary" : "outline"}
                  disabled={isCurrent}
                  loading={loadingId === t.id}
                  onClick={() => checkout(t.id)}
                >
                  {isCurrent ? "Current plan" : t.price === 0 ? "Downgrade" : "Upgrade"}
                </Button>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

── end original billing page ── */
