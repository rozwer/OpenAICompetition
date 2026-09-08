import { z } from "zod";
import type { Visit } from "./personal-insights";
import type { SemanticPlace } from "./places";
import type { TrackPoint } from "./index";
export type HistoryMode = "replay" | "day" | "month";
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(`${s}T00:00:00+09:00`);
    return (
      Number.isFinite(d.getTime()) &&
      new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10) === s
    );
  });
export const monthlyInsightSchema = z
  .object({
    title: z.string().min(1).max(80),
    summary: z.string().min(1).max(400),
    confidence: z.number().min(0).max(1),
  })
  .strict();
export type MonthlyInsight = z.infer<typeof monthlyInsightSchema>;
export type HistoryPin = {
  id: string;
  placeId: string;
  name: string;
  category: string;
  brand?: string;
  lng: number;
  lat: number;
  order?: number;
  isNew: boolean;
  count: number;
  firstVisitedAt: string;
};
export type HistoryRoute = {
  lines: number[][][];
  kind: "gps" | "visit_order" | "none";
  distanceMeters: number | null;
  simplified: boolean;
};
export type DayJourneyVisit = Visit & {
  placeName: string;
  category: string;
  brand?: string;
  order: number;
  periodMinutes: number | null;
};
export type DayJourney = {
  date: string;
  visits: DayJourneyVisit[];
  pins: HistoryPin[];
  route: HistoryRoute;
};
export type MonthlyHistorySummary = {
  month: string;
  visitDays: number;
  totalVisits: number;
  uniquePlaces: number;
  newPlaces: number;
  totalStayMinutes: number;
  unknownDurationVisits: number;
  distanceMeters: number | null;
  topCategories: { category: string; count: number }[];
  topPlaces: { placeId: string; name: string; count: number }[];
  newDiscoveries: { placeId: string; name: string }[];
  aiInsight?: MonthlyInsight;
  insightGeneratedAt?: string;
};
export type ReplaySnapshot = {
  date: string;
  pins: HistoryPin[];
  newPlaceIds: string[];
  route: HistoryRoute;
};
export type HistoryData = {
  mode: HistoryMode;
  period: string;
  empty: boolean;
  months: string[];
  days: string[];
  summary: MonthlyHistorySummary;
  day?: DayJourney;
  replay: ReplaySnapshot;
  truncated: boolean;
  warning?: string;
};
export type HistorySource = {
  visits: Visit[];
  places: SemanticPlace[];
  points: TrackPoint[];
  firstVisits: Record<string, string>;
  months: string[];
  days: string[];
  truncated: boolean;
};
export type MonthlyInsightInput = {
  current: Omit<MonthlyHistorySummary, "aiInsight" | "insightGeneratedAt">;
  previousMonth: Omit<
    MonthlyHistorySummary,
    "aiInsight" | "insightGeneratedAt"
  >;
};
export interface MonthlyHistoryAI {
  generateMonthlyInsight(input: MonthlyInsightInput): Promise<MonthlyInsight>;
}
