import { Schema, model, Types, type InferSchemaType } from "mongoose";

const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    tagline: String,
    owner: { type: Types.ObjectId, ref: "User", required: true },
    members: [{ type: Types.ObjectId, ref: "User", index: true }],
    openRoles: [String],
    stack: [String],
    stage: { type: String, enum: ["idea", "building", "launched"], default: "idea" },
    conversation: { type: Types.ObjectId, ref: "Conversation" }, // auto team chat room
  },
  { timestamps: true },
);

export type TeamDoc = InferSchemaType<typeof TeamSchema>;
export const Team = model("Team", TeamSchema);
