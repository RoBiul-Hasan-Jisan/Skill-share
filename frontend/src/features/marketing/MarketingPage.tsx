"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { MatchingCTA } from "./MatchingCTA";
// import { Pricing } from "./Pricing";
import { FAQ } from "./FAQ";
import { Footer } from "./Footer";

/** Landing page — orchestrates section components, owns the one piece of
 *  shared state (demo login) they need. */
export function MarketingPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [demoLoading, setDemoLoading] = useState(false);

  const tryDemo = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      toast("Welcome to the demo — poke around freely");
      router.push("/dashboard");
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : "Demo account is unavailable right now",
        "error"
      );
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <div
        className="pointer-events-none absolute inset-0 bg-neon-soft"
        aria-hidden
      />

      <MarketingNav />

      <Hero
        onDemo={tryDemo}
        demoLoading={demoLoading}
        onGetStarted={() => router.push("/signup")}
      />

      <Features />
      <HowItWorks />

      <MatchingCTA
        onDemo={tryDemo}
        demoLoading={demoLoading}
      />

      {/* <Pricing /> */}

      <FAQ />
      <Footer />
    </div>
  );
}