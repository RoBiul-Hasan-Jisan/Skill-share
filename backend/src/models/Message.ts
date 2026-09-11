import { Schema, model, Types, type InferSchemaType } from "mongoose";

const ReactionSchema = new Schema(
  { emoji: String, by: [{ type: Types.ObjectId, ref: "User" }] },
  { _id: false },
);

const MessageSchema = new Schema(
  {
    conversation: { type: Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Types.ObjectId, ref: "User", required: true },
    // receiver kept for DM convenience / queries; null for team rooms
    receiver: { type: Types.ObjectId, ref: "User", default: null },
    team: { type: Types.ObjectId, ref: "Team", default: null },

    text: { type: String, default: "" },
    attachment: {
      type: { type: String, enum: ["image", "file"] },
      url: String,
      name: String,
    },

    // read receipts — list of users who have seen this message
    seenBy: [{ type: Types.ObjectId, ref: "User" }],
    reactions: [ReactionSchema],

    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Paginated history within a conversation, newest last.
MessageSchema.index({ conversation: 1, createdAt: 1 });
// Text index powers searchable chat history.
MessageSchema.index({ text: "text" });

export type MessageDoc = InferSchemaType<typeof MessageSchema>;
export const Message = model("Message", MessageSchema);
