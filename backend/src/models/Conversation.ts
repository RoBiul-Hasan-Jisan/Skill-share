import { Schema, model, Types, type InferSchemaType } from "mongoose";

/**
 * A Conversation is the container for messages. It is either:
 *  - a DM (kind "dm"): exactly 2 participants, no team
 *  - a team room (kind "team"): linked to a Team, participants = team members
 */
const ConversationSchema = new Schema(
  {
    kind: { type: String, enum: ["dm", "team"], required: true },
    participants: [{ type: Types.ObjectId, ref: "User", index: true }],
    team: { type: Types.ObjectId, ref: "Team", default: null },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Fast lookup of a user's conversations, most-recent first.
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
// Ensure one DM doc per unordered pair (enforced in controller via sorted ids).
ConversationSchema.index(
  { kind: 1, participants: 1 },
  { partialFilterExpression: { kind: "dm" } },
);

export type ConversationDoc = InferSchemaType<typeof ConversationSchema>;
export const Conversation = model("Conversation", ConversationSchema);
