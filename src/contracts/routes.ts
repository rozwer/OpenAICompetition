import { z } from "zod";
import type { Place, Message, Memory } from "./index";
export const routeRequestSchema = z.object({
  start: z.string().min(1).max(120),
  end: z.string().min(1).max(120),
  via: z.array(z.string().max(120)).max(5),
  placeId: z.string().max(120).nullable(),
  preference: z.string().trim().max(500).optional(),
});
export type RouteRequest = z.infer<typeof routeRequestSchema>;
export const routeChoiceSchema = z.object({
  stops: z
    .array(
      z.object({ placeId: z.string(), reason: z.string().min(1).max(500) }),
    )
    .max(5),
  explanation: z.string().min(1).max(1000),
});
export type RouteChoice = z.infer<typeof routeChoiceSchema>;
export interface RoutePlannerAI {
  planRoute(input: {
    start: Place;
    end: Place;
    required: Place[];
    candidates: Place[];
    history: Message[];
    memories: Memory[];
    preference?: string;
  }): Promise<RouteChoice>;
}
export type RouteGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};
export type WalkingRoute = {
  geometry: RouteGeometry;
  distance: number;
  duration: number;
};
export interface WalkingRouter {
  configured(): boolean;
  route(points: Place[]): Promise<WalkingRoute>;
}
export type RouteProposal = {
  id: string;
  request: RouteRequest;
  fingerprint: string;
  start: Place;
  end: Place;
  stops: { place: Place; reason: string }[];
  explanation: string;
  status: "ready" | "needs-key" | "failed";
  error?: string;
  route: WalkingRoute | null;
  createdAt: string;
};
export interface RouteStore {
  readRoute(actor: string): RouteProposal | undefined;
  saveRoute(actor: string, proposal: RouteProposal): void;
}
