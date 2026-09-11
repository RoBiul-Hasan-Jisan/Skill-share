import { Schema, model, Types, type InferSchemaType } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["match", "message", "invite", "application", "system"] },
    payload: Schema.Types.Mixed,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type NotificationDoc = InferSchemaType<typeof NotificationSchema>;
export const Notification = model("Notification", NotificationSchema);
