import { z } from "zod";
import type { SemanticPlace } from "./places";
const text = z.string().max(1200),
  labels = z.array(z.string().max(100)).max(12),
  confidence = z.number().min(0).max(1);
const evidence = { evidenceIds: z.array(z.string().max(200)).min(1).max(16) };
export const personalInsightSchema = z
  .object({
    summary: text,
    personaCards: z
      .array(
        z
          .object({
            id: z.string().max(80),
            name: z.string().max(80),
            description: text,
            contexts: labels,
            traits: labels,
            confidence,
            trend: z.enum(["up", "down", "stable"]).nullable(),
            ...evidence,
          })
          .strict(),
      )
      .max(4),
    patterns: z
      .array(
        z
          .object({
            id: z.string().max(80),
            title: z.string().max(120),
            description: text,
            confidence,
            relatedPlaceIds: labels,
            relatedCategories: labels,
            ...evidence,
          })
          .strict(),
      )
      .max(6),
    changes: z
      .array(
        z
          .object({
            id: z.string().max(80),
            title: z.string().max(120),
            description: text,
            direction: z.enum(["increase", "decrease", "stable", "new"]),
            confidence,
            ...evidence,
          })
          .strict(),
      )
      .max(6),
    preferenceScores: z
      .array(
        z
          .object({
            axis: z.enum([
              "quiet",
              "social",
              "exploration",
              "nature",
              "longStay",
              "localness",
            ]),
            score: z.number().min(0).max(100).nullable(),
            confidence,
            reason: text,
            evidenceIds: z.array(z.string().max(200)).max(16),
          })
          .strict(),
      )
      .max(6),
    placeRelationships: z
      .array(
        z
          .object({
            placeId: z.string().max(200),
            summary: text,
            tags: labels,
            confidence,
            ...evidence,
          })
          .strict(),
      )
      .max(40),
  })
  .strict();
export type PersonalInsight = z.infer<typeof personalInsightSchema>;
export type VisitContext = {
  weekday: boolean;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  weather: "unknown" | "sunny" | "rain" | "cloudy";
  company: "unknown" | "solo" | "together";
  timezone: "Asia/Tokyo";
};
export type Visit = {
  id: string;
  userId: string;
  placeId: string;
  enteredAt: string;
  exitedAt: string;
  durationMinutes: number | null;
  context: VisitContext;
  source: "manual" | "gps_confirmed";
  candidateId?: string;
};
export type VisitCandidate = {
  id: string;
  placeId: string;
  enteredAt: string;
  exitedAt: string;
  durationMinutes: number;
  origin: "device" | "imported";
};
export type UserPlaceRelation = {
  userId: string;
  placeId: string;
  visitCount: number;
  totalStayMinutes: number;
  unknownDurationVisits: number;
  firstVisitedAt: string | null;
  lastVisitedAt: string | null;
  favorite: boolean;
};
export type PersonalInsightSnapshot = {
  id: string;
  userId: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  fingerprint: string;
  result: PersonalInsight;
};
export type ActivityPeriod = {
  start: string;
  end: string;
  visits: number;
  totalStayMinutes: number;
  unknownDurationVisits: number;
  revisitRate: number;
  newPlaces: number;
  categories: Record<string, number>;
  brands: Record<string, number>;
  weekdays: Record<string, number>;
  timeOfDay: Record<string, number>;
  company: Record<string, number>;
  transitions: Record<string, number>;
  places: {
    evidenceId: string;
    contexts: Record<string, number>;
    placeId: string;
    name: string;
    categoryPath: string[];
    brandId: string | null;
    visitCount: number;
    totalStayMinutes: number;
    unknownDurationVisits: number;
    favorite: boolean;
  }[];
};
export type ActivityInput = {
  current: ActivityPeriod;
  previous: ActivityPeriod;
  limitations: string[];
};
export interface PersonalInsightAI {
  generatePersonalInsight(input: ActivityInput): Promise<PersonalInsight>;
}
export type PersonalState = {
  userId: string;
  places: SemanticPlace[];
  visits: Visit[];
  relations: UserPlaceRelation[];
  candidates: VisitCandidate[];
  snapshots: PersonalInsightSnapshot[];
  activity: ActivityInput;
};
export const visitInputSchema = z
  .object({
    id: z.string().uuid(),
    placeId: z.string().min(1).max(200),
    enteredAt: z.string().datetime(),
    durationMinutes: z.number().int().min(0).max(1440).nullable(),
    company: z.enum(["unknown", "solo", "together"]),
    weather: z.enum(["unknown", "sunny", "rain", "cloudy"]),
  })
  .strict();
