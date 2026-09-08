import { z } from "zod";
export type LensPlace = { id: string; name: string; area: string; category: string; lat: number; lng: number; photo: string };
export type LensVisit = { placeId: string; count: number; minutes: number; context: string; meaning: string };
export type FriendLens = { id: string; name: string; subtitle: string; areas: string; recent: string; avatar: string; preview: string; visits: LensVisit[] };
export const comparisonInsightSchema = z.object({ common: z.string().min(1).max(500), difference: z.string().min(1).max(500), discovery: z.string().min(1).max(500) }).strict();
export type ComparisonInsight = z.infer<typeof comparisonInsightSchema>;
