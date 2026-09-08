import { describe, it, expect, vi } from "vitest";
import { OpenStreetMapProvider } from "../src/infrastructure/osm-place-provider";
import {
  normalizeBrand,
  normalizePlaceCategory,
} from "../src/domain/place-normalization";
import { osmPlaces, linkBuildings } from "../src/domain/place-adapters";
import { SqlitePlaceCache } from "../src/infrastructure/place-cache";
import { PlaceService, placeCacheKey } from "../src/server/places";
import { loadBundledPlaces } from "../src/infrastructure/bundled-places";
import type { Building, PlaceProvider } from "../src/contracts/places";
const raw = {
  elements: [
    {
      type: "node",
      id: 1,
      lat: 35,
      lon: 136,
      tags: {
        name: "カフェ",
        amenity: "cafe",
        brand: "McDonald's",
        opening_hours: "07:00-23:00",
        level: "2",
      },
    },
  ],
};
const q = { lat: 35, lng: 136, radius: 1000 };
describe("semantic places", () => {
  it("Overpass provider sends a bounded tag query and rejects incomplete data", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(raw)));
    vi.stubGlobal("fetch", fetcher);
    try {
      const provider = new OpenStreetMapProvider();
      expect(await provider.getPlacesAround(q)).toHaveLength(1);
      const [url, init] = fetcher.mock.calls[0];
      expect(url).toBe("https://overpass-api.de/api/interpreter");
      expect(String(init.body)).toContain("nwr%5Bamenity%5D");
      fetcher.mockResolvedValue(new Response(JSON.stringify({elements:[],remark:"timeout"})));
      await expect(provider.getPlacesAround(q)).rejects.toThrow("不完全");
      fetcher.mockResolvedValue(new Response("", {status:406}));
      await expect(provider.getPlacesAround(q)).rejects.toThrow("406");
    } finally { vi.unstubAllGlobals(); }
  });
  it("normalizes specific categories without turning an arbitrary shop into a cafe", () => {
    expect(
      normalizePlaceCategory({
        source: "osm",
        tags: { amenity: "cafe", building: "office" },
      }).categoryPath,
    ).toEqual(["food", "cafe", "coffee_shop"]);
    expect(
      normalizePlaceCategory({
        source: "osm",
        tags: { amenity: "fast_food", cuisine: "burger" },
      }).categoryL3,
    ).toBe("burger_restaurant");
    expect(
      normalizePlaceCategory({ source: "osm", tags: { shop: "books" } })
        .categoryL2,
    ).toBe("bookstore");
    expect(
      normalizePlaceCategory({ source: "osm", tags: { shop: "unknown" } })
        .categoryL2,
    ).toBe("retail");
    expect(
      normalizePlaceCategory({
        source: "overture",
        basicCategory: "coffee_shop",
        taxonomy: ["food"],
      }).categoryPath,
    ).toEqual(["food", "cafe", "coffee_shop"]);
  });
  it("uses source Wikidata identities and conservative brand hints", () => {
    for (const brand of ["McDonald's", "マクドナルド", "マック"])
      expect(normalizeBrand({ brand }).brandId).toBe("wikidata:Q38076");
    expect(
      normalizeBrand({ brand: "不明なブランド", "brand:wikidata": "Q123" })
        .brandId,
    ).toBe("wikidata:Q123");
    expect(normalizeBrand({ name: "コメダ珈琲店 本山店" })).toMatchObject({
      brand: "コメダ珈琲店",
      brandMatch: "name_hint",
    });
    expect(
      normalizeBrand({ name: "コメダ珈琲店 本山店" }).brandId,
    ).toBeUndefined();
    expect(
      normalizeBrand({ name: "マック工業", operator: "Starbucks" }),
    ).toEqual({});
  });
  it("keeps raw tags, deduplicates source IDs, skips malformed coordinates and incomplete responses", () => {
    const p = osmPlaces({
      elements: [
        ...raw.elements,
        ...raw.elements,
        { type: "node", id: 2, tags: { amenity: "cafe" } },
        {
          type: "way",
          id: 3,
          center: { lat: 35, lon: 136 },
          tags: { shop: "books" },
        },
      ],
    });
    expect(p).toHaveLength(2);
    expect(p[0]).toMatchObject({
      id: "osm:node:1",
      sourceId: "node/1",
      openingHours: "07:00-23:00",
      level: "2",
      rawTags: raw.elements[0].tags,
    });
    expect(() => osmPlaces({ ...raw, remark: "timeout" })).toThrow();
  });
  it("keeps building tenants separate and excludes holes and ambiguous buildings", () => {
    const b: Building = {
      id: "osm:way:10",
      source: "osm",
      sourceId: "way/10",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [135, 34],
            [137, 34],
            [137, 36],
            [135, 36],
            [135, 34],
          ],
        ],
      },
    };
    const p = osmPlaces(raw);
    expect(linkBuildings(p, [b])[0].buildingLink).toBe("spatial_candidate");
    expect(
      linkBuildings(p, [b, { ...b, id: "other" }])[0].buildingId,
    ).toBeUndefined();
    const hole = [
      [135.9, 34.9],
      [136.1, 34.9],
      [136.1, 35.1],
      [135.9, 35.1],
      [135.9, 34.9],
    ];
    expect(
      linkBuildings(p, [
        {
          ...b,
          geometry: {
            type: "Polygon",
            coordinates: b.geometry.type === "Polygon" ? [...b.geometry.coordinates, hole] : [hole],
          },
        },
      ])[0].buildingId,
    ).toBeUndefined();
    expect(
      linkBuildings([{ ...p[0], id: "osm:way:10", sourceId: "way/10" }], [b])[0]
        .buildingLink,
    ).toBe("same_feature");
  });
  it("does not contact provider until consent; cache shares nearby searches and throttles failures", async () => {
    let calls = 0,
      time = Date.now(),
      fail = false;
    const provider: PlaceProvider = {
      source: "osm",
      async getPlacesAround() {
        calls++;
        if (fail) throw new Error("offline");
        return osmPlaces(raw);
      },
    };
    const cache = new SqlitePlaceCache(":memory:"),
      service = new PlaceService(
        provider,
        cache,
        { places: [], fetchedAt: "2026-09-07", buildings: [] },
        () => time,
      );
    expect((await service.search("A", q, true)).approvalRequired).toBe(true);
    expect(calls).toBe(0);
    expect((await service.search("A", q, true, true)).cache).toBe("network");
    expect(calls).toBe(1);
    expect(
      (await service.search("B", { ...q, lat: 35.0001 }, true)).cache,
    ).toBe("fresh");
    expect(calls).toBe(1);
    time += 3600001;
    fail = true;
    expect((await service.search("A", q, true)).cache).toBe("stale");
    expect(calls).toBe(2);
    await service.search("A", q, true);
    expect(calls).toBe(2);
    expect(placeCacheKey(q, "osm").key).toBe(
      placeCacheKey({ ...q, lat: 35.0001 }, "osm").key,
    );
  });
  it("coalesces concurrent requests and filters exact search radius", async () => {
    let resolve!: (p: ReturnType<typeof osmPlaces>) => void,
      calls = 0;
    const provider: PlaceProvider = {
      source: "osm",
      getPlacesAround() {
        calls++;
        return new Promise((r) => (resolve = r));
      },
    };
    const service = new PlaceService(
      provider,
      new SqlitePlaceCache(":memory:"),
      { places: [], fetchedAt: "2026-09-07", buildings: [] },
    );
    const a = service.search("A", q, true, true),
      b = service.search("A", q, true);
    resolve([...osmPlaces(raw), { ...osmPlaces(raw)[0], id: "far", lat: 0 }]);
    const results = await Promise.all([a, b]);
    expect(calls).toBe(1);
    expect(results[0].places).toHaveLength(1);
    expect(results[1].places).toHaveLength(1);
  });
  it("bundled genuine OSM records load with stable identities", () => {
    const data = loadBundledPlaces();
    expect(data.places.length).toBeGreaterThan(100);
    expect(data.buildings.length).toBeGreaterThan(100);
    expect(new Set(data.places.map((p) => p.id)).size).toBe(data.places.length);
  });
});

