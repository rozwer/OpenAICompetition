import { z } from "zod";
import type { Polygon, MultiPolygon } from "geojson";
import type { Place } from "./index";
export type PlaceSource = "osm" | "overture" | "user";
export type Category = {
  categoryL1: string;
  categoryL2: string;
  categoryL3?: string;
  categoryPath: string[];
  category: string;
  icon: string;
};
export type SemanticPlace = Place &
  Category & {
    source: PlaceSource;
    sourceId: string;
    brand?: string;
    brandId?: string;
    brandMatch?: "wikidata" | "alias" | "name_hint" | "unresolved";
    buildingId?: string;
    buildingLink?: "same_feature" | "spatial_candidate";
    openingHours?: string;
    level?: string;
    operator?: string;
    cuisine?: string;
    rawTags: Record<string, unknown>;
    sourceCategoryPath?: string[];
    websites?: string[];
    addresses?: unknown[];
    operatingStatus?: string;
    normalizedAt: string;
    normalizationVersion: number;
  };
export type Building = {
  id: string;
  name?: string;
  geometry: Polygon | MultiPolygon;
  buildingType?: string;
  source: PlaceSource;
  sourceId: string;
  rawTags?: Record<string, unknown>;
};
export const placeQuerySchema = z
  .object({
    lat: z.number().min(-85).max(85),
    lng: z.number().min(-180).max(180),
    radius: z.number().int().min(100).max(1500),
  })
  .strict();
export type PlaceQuery = z.infer<typeof placeQuerySchema>;
export interface PlaceProvider {
  readonly source: PlaceSource;
  getPlacesAround(query: PlaceQuery): Promise<SemanticPlace[]>;
}
export type PlaceSearchResult = {
  places: SemanticPlace[];
  buildings: Building[];
  cache: "fresh" | "network" | "stale" | "bundled" | "empty";
  fetchedAt: string | null;
  warning?: string;
  truncated: boolean;
  approvalRequired?: boolean;
};
export interface PlaceCache {
  get(key: string): { places: SemanticPlace[]; fetchedAt: string } | undefined;
  save(key: string, places: SemanticPlace[], fetchedAt: string): void;
  approved(actor: string): boolean;
  approve(actor: string): void;
}
