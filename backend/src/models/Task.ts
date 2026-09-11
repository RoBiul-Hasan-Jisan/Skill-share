import { Schema, model, Types, type InferSchemaType } from "mongoose";

const TaskSchema = new Schema(
  {
    team: { type: Types.ObjectId, ref: "Team", required: true, index: true },
    title: { type: String, required: true },
    status: { type: String, enum: ["todo", "in_progress", "review", "done"], default: "todo" },
    assignee: { type: Types.ObjectId, ref: "User" },
    priority: { type: String, enum: ["low", "med", "high"], default: "med" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type TaskDoc = InferSchemaType<typeof TaskSchema>;
export const Task = model("Task", TaskSchema);
