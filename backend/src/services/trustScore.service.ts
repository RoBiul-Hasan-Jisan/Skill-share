import type { UserDoc } from "../models/User.js";

/**
 * Developer Trust Score — server-side, authoritative.
 *
 * Composite (0–100) from five weighted sub-scores:
 *   profile 20% · github 25% · certificates 20% · projects 25% · activity 10%
 *
 * Each sub-score is normalized to 0–100 from raw signals, so the system stays
 * stable as the platform grows (no unbounded counters leaking into the score).
 */

export const WEIGHTS = {
  profile: 0.15,
  github: 0.2,
  certificates: 0.15,
  projects: 0.2,
  activity: 0.1,
  endorsements: 0.2,
} as const;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function profileScore(u: UserDoc): number {
  // Reward completeness across the fields recruiters care about.
  let s = 0;
  if (u.bio && u.bio.length > 40) s += 30;
  if (u.skills && u.skills.length >= 3) s += 30;
  if (u.role) s += 15;
  if (u.location) s += 10;
  if (u.avatar) s += 5;
  if (u.website || u.github || u.twitter) s += 10;
  return clamp(s);
}

function githubScore(u: UserDoc): number {
  if (!u.github) return 0;
  const g = u.githubStats ?? { repos: 0, commits: 0, languages: 0 };
  // Diminishing returns via log-ish scaling.
  const repos = Math.min(40, (g.repos ?? 0) * 4);
  const commits = Math.min(40, Math.sqrt(g.commits ?? 0) * 4);
  const langs = Math.min(20, (g.languages ?? 0) * 4);
  return clamp(repos + commits + langs);
}

function certificatesScore(u: UserDoc): number {
  // Verified certs would weigh more — here we approximate with count.
  return clamp(Math.min(100, (u.certificatesCount ?? 0) * 15));
}

function projectsScore(u: UserDoc): number {
  return clamp(Math.min(100, (u.projectsCount ?? 0) * 12));
}

function activityScore(u: UserDoc): number {
  const msgs = Math.min(60, Math.sqrt(u.messagesSent ?? 0) * 6);
  const teams = Math.min(40, (u.teamsJoined ?? 0) * 20);
  return clamp(msgs + teams);
}

function endorsementsScore(u: UserDoc): number {
  // Peer-vouched, so it's weighted more heavily than raw activity — but
  // still diminishing returns so one generous friend can't max it out.
  return clamp(Math.sqrt(u.endorsementsCount ?? 0) * 22);
}

export function computeTrustBreakdown(u: UserDoc) {
  return {
    profile: profileScore(u),
    github: githubScore(u),
    certificates: certificatesScore(u),
    projects: projectsScore(u),
    activity: activityScore(u),
    endorsements: endorsementsScore(u),
  };
}

export function computeTrustScore(u: UserDoc): {
  trustScore: number;
  trustBreakdown: ReturnType<typeof computeTrustBreakdown>;
} {
  const b = computeTrustBreakdown(u);
  const trustScore = clamp(
    b.profile * WEIGHTS.profile +
      b.github * WEIGHTS.github +
      b.certificates * WEIGHTS.certificates +
      b.projects * WEIGHTS.projects +
      b.activity * WEIGHTS.activity +
      b.endorsements * WEIGHTS.endorsements,
  );
  return { trustScore, trustBreakdown: b };
}

/** Heuristic fake/weak-profile detector — flags low-effort or inconsistent accounts. */
export function isLowQuality(u: UserDoc): boolean {
  const b = computeTrustBreakdown(u);
  const noProof = b.github === 0 && b.certificates === 0 && b.projects === 0;
  const thinProfile = b.profile < 30;
  return noProof || thinProfile;
}

export function ruleBasedSuggestions(u: UserDoc): string[] {
  const b = computeTrustBreakdown(u);
  const out: string[] = [];
  if (b.projects < 60) out.push("Add 2–3 projects with descriptions, stack, and live links.");
  if (b.certificates < 60) out.push("Add verified certificates — verified issuers weigh more.");
  if (b.github < 60) out.push("Connect GitHub to surface repos, commits, and language diversity.");
  if (b.profile < 60) out.push("Complete your bio, role, and availability.");
  if (b.activity < 60) out.push("Join a team and stay active in chats.");
  if (b.endorsements < 60) out.push("Ask connections to endorse specific skills on your profile.");
  const { trustScore } = computeTrustScore(u);
  if (trustScore < 50)
    out.unshift("Below recruiter visibility threshold — prioritize projects and certificates.");
  return out.slice(0, 4);
}
