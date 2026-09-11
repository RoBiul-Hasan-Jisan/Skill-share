import { Schema, model, Types, type InferSchemaType } from "mongoose";

const ProjectSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: String,
    stack: [String],
    repoUrl: String,
    liveUrl: String,
    image: String,
  },
  { timestamps: true },
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema>;
export const Project = model("Project", ProjectSchema);
