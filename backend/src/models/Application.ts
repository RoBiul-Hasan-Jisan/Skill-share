import { Schema, model, Types, type InferSchemaType } from "mongoose";

const ApplicationSchema = new Schema(
  {
    applicant: { type: Types.ObjectId, ref: "User", required: true },
    team: { type: Types.ObjectId, ref: "Team" },
    startupIdea: { type: Types.ObjectId, ref: "StartupIdea" },
    role: String,
    message: String,
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true },
);

export type ApplicationDoc = InferSchemaType<typeof ApplicationSchema>;
export const Application = model("Application", ApplicationSchema);
