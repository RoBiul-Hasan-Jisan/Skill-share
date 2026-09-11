import type { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { Subscription } from "../models/Subscription.js";
import { User } from "../models/User.js";
import type { AuthedRequest } from "../middleware/auth.js";

const stripe = env.stripeKey ? new Stripe(env.stripeKey) : null;

const PRICE_BY_TIER: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO ?? "price_pro",
  startup: process.env.STRIPE_PRICE_STARTUP ?? "price_startup",
};

/** POST /api/billing/checkout { tier } -> { url } */
export async function createCheckout(req: AuthedRequest, res: Response) {
  if (!stripe) return res.status(503).json({ error: "Billing not configured" });
  const { tier } = req.body as { tier: "pro" | "startup" };
  const price = PRICE_BY_TIER[tier];
  if (!price) return res.status(400).json({ error: "Unknown tier" });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: req.userId,
    success_url: `${env.clientOrigin}/billing?status=success`,
    cancel_url: `${env.clientOrigin}/billing?status=cancel`,
    metadata: { userId: req.userId ?? "", tier },
  });
  res.json({ url: session.url });
}

/**
 * POST /api/billing/webhook — Stripe events. MUST receive the raw body,
 * so this route is mounted with express.raw() before the json() parser.
 */
export async function webhook(req: Request, res: Response) {
  if (!stripe) return res.status(503).end();
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const userId = s.metadata?.userId;
    const tier = (s.metadata?.tier ?? "pro") as "pro" | "startup";
    if (userId) {
      await Subscription.findOneAndUpdate(
        { user: userId },
        {
          user: userId,
          stripeCustomerId: String(s.customer),
          stripeSubscriptionId: String(s.subscription),
          tier,
          status: "active",
        },
        { upsert: true },
      );
      await User.findByIdAndUpdate(userId, { tier });
    }
  }
  res.json({ received: true });
}
