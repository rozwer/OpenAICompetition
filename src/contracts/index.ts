import { z } from "zod";
export const pointSchema = z.object({
  id: z.string().min(1).max(160),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  time: z.string().datetime(),
  accuracy: z.number().nonnegative().nullable(),
  origin: z.enum(["synthetic", "imported", "device"]),
});
export type TrackPoint = z.infer<typeof pointSchema>;
export type Place = {
  id: string;
  name: string;
  category: string;
  lng: number;
  lat: number;
  description: string;
};
export type Memory = {
  id: string;
  placeId: string | null;
  text: string;
  source: "user" | "hypothesis";
  evidence: string;
  revision: number;
};
export type Message = {
  id: string;
  placeId: string | null;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  status: "saved" | "running" | "completed" | "waiting";
  error?: string;
};
export type FriendRequest = {
  id: string;
  from: string;
  to: string;
  status: "pending" | "accepted";
};
export type Snapshot = {
  route?: import("./routes").RouteProposal;
  actor: string;
  points: TrackPoint[];
  messages: Message[];
  memories: Memory[];
  requests: FriendRequest[];
  friends: string[];
};
export const messageSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(1).max(4000),
  placeId: z.string().max(120).nullable(),
});
export const insightSchema = z.object({
  answer: z.string().min(1).max(8000),
  memories: z
    .array(
      z.object({
        text: z.string().max(1000),
        source: z.enum(["user", "hypothesis"]),
      }),
    )
    .max(8),
});
export type Insight = z.infer<typeof insightSchema>;
export interface MapRepository {
  read(actor: string): Snapshot;
  addPoints(actor: string, points: TrackPoint[]): void;
  saveMessage(actor: string, message: Message): void;
  updateMessage(
    actor: string,
    id: string,
    status: Message["status"],
    error?: string,
  ): void;
  claimMessage(actor: string, id: string): boolean;
  completeMessage(
    actor: string,
    id: string,
    answer: Message,
    memories: Memory[],
  ): void;
  reviseMemory(
    actor: string,
    id: string,
    text: string,
    revision: number,
  ): boolean;
  requestFriend(actor: string, target: string): void;
  acceptFriend(actor: string, id: string): void;
}
export interface PersonalAI {
  respond(input: {
    question: string;
    place: Place | null;
    history: Message[];
    memories: Memory[];
    recentPoints: number;
  }): Promise<Insight>;
}
export interface FeatureContext {
  snapshot: Snapshot;
  places: Place[];
  selected: Place | null;
  refresh(): Promise<void>;
  select(place: Place | null): void;
}
