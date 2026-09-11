import type { UserDoc } from "../models/User.js";

/**
 * Teammate / cofounder matching — pure heuristics, no external API, no cost.
 *
 * Ported and extended from the standalone SkillShare prototype's
 * `matching.js`. Two things were added on top of the original skill/stack
 * scoring:
 *
 *   1. Job-role complementarity — a candidate whose job role (e.g.
 *      "Backend Developer") differs from the requester's (e.g. "Frontend
 *      Developer") is worth more for Cofounder/Hackathon team formation,
 *      since real teams need different roles, not five clones of the same
 *      one. Same-role candidates still show up (useful for "Collaborators"
 *      mode — pairing with a peer) but are weighted lower for team modes.
 *
 *   2. Account-type separation — this only ever scores against other
 *      `userType: "developer"` accounts. Recruiter accounts are excluded
 *      upstream (see `rankedMatches` in user.controller.ts) and instead
 *      browse the developer pool through the separate, trust-ranked
 *      Recruiter dashboard (`recruiterList`) — a different account type
 *      gets a different view, not a different score on the same list.
 */

export type MatchMode = "All" | "Collaborator" | "Cofounder" | "Hackathon";

type MatchInput = Pick<
  UserDoc,
  "skills" | "stack" | "location" | "lookingFor" | "role" | "trustScore"
>;

function overlap(a: string[] = [], b: string[] = []): { ratio: number; shared: string[] } {
  if (!a.length || !b.length) return { ratio: 0, shared: [] };
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Map(b.map((s) => [s.toLowerCase(), s] as const));
  const shared: string[] = [];
  for (const s of setA) if (setB.has(s)) shared.push(setB.get(s)!);
  return { ratio: shared.length / Math.max(setA.size, setB.size), shared };
}

function complement(a: string[] = [], b: string[] = []): { ratio: number; unique: string[] } {
  // Rewards candidates who bring skills the requester DOESN'T have —
  // useful for cofounder matching where you want a complementary skillset.
  if (!b.length) return { ratio: 0, unique: [] };
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const unique = b.filter((s) => !setA.has(s.toLowerCase()));
  return { ratio: b.length ? unique.length / b.length : 0, unique };
}

/** Same free-text job role → 0, clearly different role → 1, blank → 0.5 (neutral). */
function roleComplementScore(myRole?: string | null, candidateRole?: string | null): number {
  if (!myRole || !candidateRole) return 0.5;
  return myRole.trim().toLowerCase() === candidateRole.trim().toLowerCase() ? 0 : 1;
}

export interface ScoredMatch<T> {
  candidate: T;
  score: number;
  sharedSkills: string[];
  sharedStack: string[];
  complementarySkills: string[];
  roleComplementary: boolean;
  lookingForMatch: boolean;
  breakdown: MatchBreakdown;
}

/** Five-axis compatibility breakdown (0-100 each) — powers the "Why we match" radar view. */
export interface MatchBreakdown {
  skillOverlap: number;
  stackOverlap: number;
  complementary: number;
  roleFit: number;
  trust: number;
}

export function matchCandidates<T extends MatchInput & { role?: string | null; location?: string | null }>(
  me: MatchInput,
  candidates: T[],
  mode: MatchMode = "All",
): ScoredMatch<T>[] {
  const mySkillNames = (me.skills ?? []).map((s: any) => s.name).filter(Boolean);
  const myStack = me.stack ?? [];

  return candidates
    .map((candidate) => {
      const candSkillNames = (candidate.skills ?? []).map((s: any) => s.name).filter(Boolean);
      const candStack = candidate.stack ?? [];

      const skillOverlap = overlap(mySkillNames, candSkillNames);
      const stackOverlap = overlap(myStack, candStack);
      const skillComplement = complement(mySkillNames, candSkillNames);
      const roleComplement = roleComplementScore(me.role, candidate.role);

      const sameLocation =
        me.location && candidate.location &&
        me.location.toLowerCase() === candidate.location.toLowerCase();

      const lookingForMatch =
        mode === "All"
          ? (candidate.lookingFor ?? []).length > 0
          : (candidate.lookingFor ?? []).includes(mode as any);

      let raw: number;
      if (mode === "Cofounder") {
        // Cofounders: complementary skills + complementary role + shared stack
        // (so you can still build together) + location, weighted for
        // "different but compatible" over "identical".
        raw =
          skillComplement.ratio * 0.35 +
          roleComplement * 0.25 +
          stackOverlap.ratio * 0.2 +
          (sameLocation ? 1 : 0) * 0.1 +
          (lookingForMatch ? 1 : 0) * 0.1;
      } else if (mode === "Hackathon") {
        // Hackathon teammates: ship fast together — shared stack matters
        // most, role complementarity still helps you cover more ground
        // in 48 hours, but less than raw stack compatibility.
        raw =
          stackOverlap.ratio * 0.4 +
          skillOverlap.ratio * 0.25 +
          roleComplement * 0.15 +
          (lookingForMatch ? 1 : 0) * 0.2;
      } else if (mode === "Collaborator") {
        // Collaborators: mostly peers — shared skills/stack first, a light
        // nod to role complementarity so mixed-role pairings still surface.
        raw =
          skillOverlap.ratio * 0.4 +
          stackOverlap.ratio * 0.3 +
          roleComplement * 0.15 +
          (lookingForMatch ? 1 : 0) * 0.15;
      } else {
        // All — a balanced blend across every signal.
        raw =
          skillOverlap.ratio * 0.3 +
          stackOverlap.ratio * 0.25 +
          skillComplement.ratio * 0.15 +
          roleComplement * 0.15 +
          (sameLocation ? 1 : 0) * 0.05 +
          (lookingForMatch ? 1 : 0) * 0.1;
      }

      // Blend in verified Trust Score (80/20) so strong compatibility stays
      // on top while rewarding credible, verified profiles.
      const compat = Math.round(raw * 100);
      const score = Math.round(compat * 0.8 + (candidate.trustScore ?? 0) * 0.2);

      // Same five signals the score is built from, surfaced as independent
      // 0-100 axes so the client can render a radar/spider breakdown instead
      // of just the single blended number.
      const breakdown: MatchBreakdown = {
        skillOverlap: Math.round(skillOverlap.ratio * 100),
        stackOverlap: Math.round(stackOverlap.ratio * 100),
        complementary: Math.round(skillComplement.ratio * 100),
        roleFit: Math.round(roleComplement * 100),
        trust: Math.round(candidate.trustScore ?? 0),
      };

      return {
        candidate,
        score,
        sharedSkills: skillOverlap.shared,
        sharedStack: stackOverlap.shared,
        complementarySkills: skillComplement.unique.slice(0, 3),
        roleComplementary: roleComplement === 1,
        breakdown,
        lookingForMatch,
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}
