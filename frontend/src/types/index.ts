export type Availability = "available" | "open" | "busy";
export type Tier = "free" | "pro" | "startup";
export type UserType = "developer" | "recruiter";
export type ConnectionStatus = "none" | "pending_sent" | "pending_received" | "connected";

export interface Skill {
  name: string;
  level: number; // 0-100
}

export interface TrustBreakdown {
  profile: number;
  github: number;
  certificates: number;
  projects: number;
  activity: number;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  year?: number;
  credentialUrl?: string;
  imageUrl?: string;
}

export interface Project {
  id: string;
  owner: string;
  title: string;
  description?: string;
  stack: string[];
  repoUrl?: string;
  liveUrl?: string;
  image?: string;
}

export interface DevUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  bio: string;
  location: string;
  availability: Availability;
  tier: Tier;
  userType: UserType;
  onboardingComplete: boolean;
  skills: Skill[];
  stack: string[];
  github?: string;
  website?: string;
  twitter?: string;
  followers: number;
  projects: number;
  rep: number;
  certificates: number;
  trustScore: number;
  trustBreakdown: TrustBreakdown;
  lookingFor: string[];
}

export interface MatchSuggestion {
  user: DevUser;
  score: number;
  reasons: string[];
  sharedStack: string[];
  complementary: string[];
}

export interface Team {
  id: string;
  name: string;
  tagline: string;
  members: DevUser[];
  openRoles: string[];
  stack: string[];
  stage: "idea" | "building" | "launched";
  conversationId?: string;
  ownerId?: string;
}

export interface IdeaApplication {
  id: string;
  applicant: DevUser;
  role: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface StartupIdea {
  id: string;
  title: string;
  pitch: string;
  author: DevUser;
  lookingFor: string[];
  tags: string[];
  upvotes: number;
  comments: number;
}

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "done";
  assignee?: DevUser;
  priority: "low" | "med" | "high";
}

export type RoomKind = "dm" | "team";

export interface ChatRoom {
  id: string;
  kind: RoomKind;
  name: string;
  avatar?: string;
  members: DevUser[];
  online: boolean;
  unread: number;
  lastMessage: string;
  ts: string;
}

export interface Reaction {
  emoji: string;
  by: string[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  fromMe: boolean;
  text: string;
  ts: string;
  seenBy: string[];
  reactions?: Reaction[];
  attachment?: { type: "image" | "file"; url: string; name: string };
  edited?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export interface ActivityPoint {
  day: string;
  views: number;
  matches: number;
}

export interface AppNotification {
  id: string;
  type: "connection_request" | "connection_accepted" | "message" | "invite" | "application" | "system";
  message: string;
  read: boolean;
  fromId?: string;
  fromName?: string;
  fromAvatar?: string;
  payload?: Record<string, any>;
  createdAt: string;
}

export interface ConnectionItem {
  connectionId: string;
  user: DevUser;
}

export interface PendingRequest {
  _id: string;
  from: DevUser;
  createdAt: string;
}
