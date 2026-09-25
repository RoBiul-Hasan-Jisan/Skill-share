import { Schema, model, Types, type InferSchemaType } from "mongoose";

/**
 * Peer endorsement — a connected user vouching for a specific skill on
 * someone's profile. Feeds the trust score (see trustScore.service.ts)
 * and is shown on the recipient's profile grouped by skill.
 */
const EndorsementSchema = new Schema(
  {
    from: { type: Types.ObjectId, ref: "User", required: true },
    to: { type: Types.ObjectId, ref: "User", required: true },
    skill: { type: String, required: true, trim: true, maxlength: 40 },
    note: { type: String, trim: true, maxlength: 240 },
  },
  { timestamps: true },
);

// One endorsement per (endorser, recipient, skill) — re-endorsing the same
// skill just isn't possible rather than silently duplicating.
EndorsementSchema.index({ from: 1, to: 1, skill: 1 }, { unique: true });
EndorsementSchema.index({ to: 1, createdAt: -1 });

export type EndorsementDoc = InferSchemaType<typeof EndorsementSchema>;
export const Endorsement = model("Endorsement", EndorsementSchema);
