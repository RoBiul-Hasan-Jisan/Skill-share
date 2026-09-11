import { Schema, model, Types, type InferSchemaType } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    tier: { type: String, enum: ["free", "pro", "startup"], default: "free" },
    status: { type: String, default: "active" },
    currentPeriodEnd: Date,
  },
  { timestamps: true },
);

export type SubscriptionDoc = InferSchemaType<typeof SubscriptionSchema>;
export const Subscription = model("Subscription", SubscriptionSchema);
