import type { Place, TrackPoint } from "../contracts";
export const places: Place[] = [
  {
    id: "park",
    name: "山下公園",
    category: "公園",
    lng: 139.6503,
    lat: 35.4441,
    description: "海のそばで、ひと息つく。",
  },
  {
    id: "motomachi",
    name: "元町の散歩",
    category: "街歩き",
    lng: 139.6484,
    lat: 35.4394,
    description: "小さな発見を探しながら歩く。",
  },
  {
    id: "harbor",
    name: "新山下の水辺",
    category: "水辺",
    lng: 139.657,
    lat: 35.439,
    description: "いつもの道を、少し違う視点で。",
  },
];
// Authored route for interaction testing, NOT a surveyed or routable pedestrian path.
export function demoTrack(): TrackPoint[] {
  const anchors = [
    [139.6478, 35.4391],
    [139.649, 35.4398],
    [139.6501, 35.441],
    [139.6503, 35.4425],
    [139.6503, 35.4441],
  ];
  const result: TrackPoint[] = [];
  const base = Date.parse("2026-09-05T07:00:00Z");
  for (let i = 0; i < anchors.length - 1; i++)
    for (let j = 0; j < 15; j++) {
      const t = j / 15,
        n = result.length;
      result.push({
        id: `yokohama-demo-${n}`,
        lng: anchors[i][0] * (1 - t) + anchors[i + 1][0] * t,
        lat: anchors[i][1] * (1 - t) + anchors[i + 1][1] * t,
        time: new Date(base + n * 15_000).toISOString(),
        accuracy: 5,
        origin: "synthetic",
      });
    }
  return result;
}
