import type { DevUser, TrustBreakdown } from "@/types";

// Weights mirror the server-side service (server/src/services/trustScore.service.ts).
// Keeping them here lets the UI preview/explain scores without a round-trip.
export const TRUST_WEIGHTS = {
  profile: 0.2,
  github: 0.25,
  certificates: 0.2,
  projects: 0.25,
  activity: 0.1,
} as const;

export const TRUST_LABELS: Record<keyof TrustBreakdown, string> = {
  profile: "Profile",
  github: "GitHub",
  certificates: "Certificates",
  projects: "Projects",
  activity: "Activity",
};

/** Composite 0–100 from sub-scores. Authoritative copy lives server-side. */
export function computeTrust(b: TrustBreakdown): number {
  const total =
    b.profile * TRUST_WEIGHTS.profile +
    b.github * TRUST_WEIGHTS.github +
    b.certificates * TRUST_WEIGHTS.certificates +
    b.projects * TRUST_WEIGHTS.projects +
    b.activity * TRUST_WEIGHTS.activity;
  return Math.round(total);
}

export type TrustTier = {
  label: string;
  emoji: string;
  tone: "magenta" | "default" | "cyan" | "lime";
  color: string;
  min: number;
};

export const TRUST_TIERS: TrustTier[] = [
  { label: "Beginner", emoji: "🔴", tone: "magenta", color: "#A8503D", min: 0 },
  { label: "Intermediate", emoji: "🟡", tone: "default", color: "#D9A441", min: 30 },
  { label: "Advanced", emoji: "🟢", tone: "lime", color: "#55805F", min: 70 },
  { label: "Expert", emoji: "🏆", tone: "cyan", color: "#4A6670", min: 90 },
];

export function trustTier(score: number): TrustTier {
  return [...TRUST_TIERS].reverse().find((t) => score >= t.min) ?? TRUST_TIERS[0];
}

/**
 * Rule-based advisor: inspects the weakest sub-scores and returns
 * actionable suggestions for raising trust score. Pure heuristic —
 * no external service calls, no ongoing API cost.
 */
export function trustSuggestions(user: DevUser): string[] {
  const b = user.trustBreakdown;
  const out: string[] = [];
  const entries = Object.entries(b) as [keyof TrustBreakdown, number][];
  const weak = entries.filter(([, v]) => v < 60).sort((a, c) => a[1] - c[1]);

  for (const [key] of weak) {
    if (key === "profile") out.push("Complete your bio, experience, and availability to lift profile trust.");
    if (key === "github") out.push("Connect GitHub — repo count, commit consistency, and language diversity count.");
    if (key === "certificates") out.push("Add verified certificates (Coursera, Udemy, university) — verified ones weigh more.");
    if (key === "projects") out.push("Showcase 2–3 projects with descriptions, tech stack, and live links.");
    if (key === "activity") out.push("Join a team and stay active in chats to raise your activity signal.");
  }
  if (user.trustScore < 50)
    out.unshift("Your score is below recruiter visibility threshold — prioritize projects and certificates first.");
  if (out.length === 0)
    out.push("Strong profile. Keep contributing to maintain Expert standing.");
  return out.slice(0, 4);
}

/** Trust-weighted match ranking used by the matchmaking page. */
export function blendMatchScore(rawScore: number, trustScore: number): number {
  // 80% compatibility, 20% trust — keeps strong matches on top while
  // rewarding verified, credible profiles.
  return Math.round(rawScore * 0.8 + trustScore * 0.2);
}
