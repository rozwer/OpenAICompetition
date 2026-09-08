import type { Place, TrackPoint } from "../contracts";

export const places: Place[] = [
  {
    id: "hisaya",
    name: "久屋大通公園",
    category: "公園",
    lng: 136.9088285,
    lat: 35.1673656,
    description: "緑と街並みを眺めながら、ひと息つく。",
  },
  {
    id: "oasis",
    name: "オアシス21",
    category: "街歩き",
    lng: 136.9096446,
    lat: 35.171088,
    description: "栄の景色と立体的な広場を楽しむ。",
  },
  {
    id: "osu",
    name: "大須観音",
    category: "文化・商店街",
    lng: 136.8993099,
    lat: 35.1596663,
    description: "門前町と商店街で、小さな発見を探す。",
  },
];

// Authored route for interaction testing, NOT a surveyed or routable pedestrian path.
export function demoTrack(): TrackPoint[] {
  const anchors = [
    [136.90855, 35.16685],
    [136.90865, 35.1679],
    [136.90875, 35.169],
    [136.90895, 35.17005],
    [136.9092, 35.1707],
  ];
  const result: TrackPoint[] = [];
  const base = Date.parse("2026-09-07T07:00:00Z");
  for (let i = 0; i < anchors.length - 1; i++)
    for (let j = 0; j < 15; j++) {
      const t = j / 15,
        n = result.length;
      result.push({
        id: `nagoya-demo-${n}`,
        lng: anchors[i][0] * (1 - t) + anchors[i + 1][0] * t,
        lat: anchors[i][1] * (1 - t) + anchors[i + 1][1] * t,
        time: new Date(base + n * 15_000).toISOString(),
        accuracy: 5,
        origin: "synthetic",
      });
    }
  return result;
}
