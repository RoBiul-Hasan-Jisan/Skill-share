import { Schema, model, Types, type InferSchemaType } from "mongoose";

const ConnectionSchema = new Schema(
  {
    from: { type: Types.ObjectId, ref: "User", required: true },
    to: { type: Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true },
);

// One canonical connection document per ordered pair
ConnectionSchema.index({ from: 1, to: 1 }, { unique: true });
ConnectionSchema.index({ to: 1, status: 1 });
ConnectionSchema.index({ from: 1, status: 1 });

export type ConnectionDoc = InferSchemaType<typeof ConnectionSchema>;
export const Connection = model("Connection", ConnectionSchema);
