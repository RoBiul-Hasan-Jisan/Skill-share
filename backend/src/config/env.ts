import "dotenv/config";

const required = (k: string, fallback?: string) => {
  const v = process.env[k] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var: ${k}`);
  return v;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_URL ?? process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  mongoUri: required("MONGODB_URI", "mongodb://localhost:27017/skillshare"),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpires: process.env.JWT_EXPIRES ?? "7d",
  stripeKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};
