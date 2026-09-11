import { Schema, model, type InferSchemaType } from "mongoose";

const SkillSchema = new Schema(
  { name: String, level: { type: Number, min: 0, max: 100 } },
  { _id: false },
);

const TrustBreakdownSchema = new Schema(
  {
    profile: { type: Number, default: 0 },
    github: { type: Number, default: 0 },
    certificates: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    activity: { type: Number, default: 0 },
  },
  { _id: false },
);

const CertificateSchema = new Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    year: Number,
    credentialUrl: String,
    imageUrl: String,
  },
  { _id: true, timestamps: { createdAt: "addedAt" } },
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    handle: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false },
    avatar: String,
    role: String,
    roleAccess: { type: String, enum: ["member", "admin", "recruiter"], default: "member" },
    bio: String,
    location: String,
    availability: { type: String, enum: ["available", "open", "busy"], default: "open" },
    lookingFor: [{ type: String, enum: ["Collaborator", "Cofounder", "Hackathon"] }],
    tier: { type: String, enum: ["free", "pro", "startup"], default: "free" },

    // Onboarding
    userType: { type: String, enum: ["developer", "recruiter"], default: "developer" },
    onboardingComplete: { type: Boolean, default: false },

    skills: [SkillSchema],
    stack: [String],
    certificates: [CertificateSchema],

    github: String,
    website: String,
    twitter: String,

    followers: { type: Number, default: 0 },
    projectsCount: { type: Number, default: 0 },
    certificatesCount: { type: Number, default: 0 },
    rep: { type: Number, default: 0 },

    trustScore: { type: Number, default: 0, index: true },
    trustBreakdown: { type: TrustBreakdownSchema, default: () => ({}) },
    trustUpdatedAt: Date,

    messagesSent: { type: Number, default: 0 },
    teamsJoined: { type: Number, default: 0 },

    githubStats: {
      repos: { type: Number, default: 0 },
      commits: { type: Number, default: 0 },
      languages: { type: Number, default: 0 },
    },

    embeddingId: String,
  },
  { timestamps: true },
);

UserSchema.index({ trustScore: -1 });

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = model("User", UserSchema);
