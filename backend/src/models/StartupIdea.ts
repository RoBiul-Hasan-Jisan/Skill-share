import { Schema, model, Types, type InferSchemaType } from "mongoose";

const StartupIdeaSchema = new Schema(
  {
    author: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    pitch: String,
    lookingFor: [String],
    tags: [String],
    upvotes: [{ type: Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type StartupIdeaDoc = InferSchemaType<typeof StartupIdeaSchema>;
export const StartupIdea = model("StartupIdea", StartupIdeaSchema);
