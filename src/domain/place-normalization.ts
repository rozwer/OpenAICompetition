import type { Category } from "../contracts/places";
const category = (
  categoryL1: string,
  categoryL2: string,
  label: string,
  icon: string,
  categoryL3?: string,
): Category => ({
  categoryL1,
  categoryL2,
  ...(categoryL3 ? { categoryL3 } : {}),
  categoryPath: [categoryL1, categoryL2, ...(categoryL3 ? [categoryL3] : [])],
  category: label,
  icon,
});
export const categoryRules: Record<string, Category> = {
  cafe: category("food", "cafe", "カフェ・喫茶店", "☕", "coffee_shop"),
  restaurant: category("food", "restaurant", "飲食店", "🍴"),
  fast_food: category(
    "food",
    "restaurant",
    "ファストフード",
    "🍔",
    "fast_food",
  ),
  burger: category(
    "food",
    "restaurant",
    "ハンバーガー店",
    "🍔",
    "burger_restaurant",
  ),
  bar: category("food", "bar", "バー", "🍷"),
  pub: category("food", "bar", "パブ", "🍷"),
  books: category("shopping", "bookstore", "書店", "📚"),
  supermarket: category("shopping", "supermarket", "スーパー", "🛒"),
  convenience: category("shopping", "convenience_store", "コンビニ", "🏪"),
  mall: category("shopping", "mall", "商業施設", "🛍"),
  retail: category("shopping", "retail", "店舗", "🛍"),
  commercial: category("shopping", "commercial", "商業施設", "🛍"),
  park: category("outdoors", "park", "公園", "🌳"),
  university: category("education", "university", "大学", "🎓"),
  college: category("education", "college", "学校", "🎓"),
  school: category("education", "school", "学校", "🎓"),
  office: category("work", "office", "オフィス", "🏢"),
  residential: category("residential", "housing", "住宅", "🏠"),
  apartments: category("residential", "housing", "集合住宅", "🏠"),
  house: category("residential", "housing", "住宅", "🏠"),
  museum: category("culture", "museum", "博物館・美術館", "🏛"),
  hotel: category("travel", "hotel", "ホテル", "🏨"),
  station: category("transport", "station", "駅", "🚉"),
  cinema: category("entertainment", "cinema", "映画館", "🎬"),
  theatre: category("entertainment", "theatre", "劇場", "🎭"),
  industrial: category("work", "industrial", "工場", "🏭"),
  warehouse: category("work", "warehouse", "倉庫", "🏭"),
  other: category("other", "facility", "その他施設", "📍"),
};
export function normalizePlaceCategory(
  input:
    | { source: "osm" | "user"; tags: Record<string, string> }
    | { source: "overture"; basicCategory?: string; taxonomy?: string[] },
): Category {
  if (input.source === "overture") {
    const aliases: Record<string, string> = {
      coffee_shop: "cafe",
      burger_restaurant: "burger",
      fast_food_restaurant: "fast_food",
      bookstore: "books",
      convenience_store: "convenience",
      grocery_store: "supermarket",
      shopping_mall: "mall",
      train_station: "station",
      art_museum: "museum",
    };
    const candidates = [
      input.basicCategory,
      ...(input.taxonomy || []).slice().reverse(),
    ];
    for (const c of candidates)
      if (c && categoryRules[aliases[c] || c])
        return categoryRules[aliases[c] || c];
    return categoryRules.other;
  }
  const t = input.tags;
  if (
    (t.amenity === "fast_food" || t.amenity === "restaurant") &&
    t.cuisine?.split(";").includes("burger")
  )
    return categoryRules.burger;
  for (const value of [t.amenity, t.shop, t.tourism, t.leisure, t.railway])
    if (value && categoryRules[value]) return categoryRules[value];
  if (t.shop) return categoryRules.retail;
  if (t.office) return categoryRules.office;
  return categoryRules[t.building] || categoryRules.other;
}
const brandAliases = [
  {
    id: "mcdonalds",
    name: "マクドナルド",
    wikidata: "Q38076",
    aliases: ["mcdonalds", "マクドナルド", "マック"],
  },
  {
    id: "komeda",
    name: "コメダ珈琲店",
    aliases: ["コメダ珈琲店", "コメダ珈琲", "komedascoffee", "komedacoffee"],
  },
  {
    id: "starbucks",
    name: "スターバックス",
    wikidata: "Q37158",
    aliases: [
      "starbucks",
      "starbuckscoffee",
      "スターバックス",
      "スターバックスコーヒー",
    ],
  },
  { id: "muji", name: "無印良品", aliases: ["muji", "無印良品"] },
  {
    id: "uniqlo",
    name: "ユニクロ",
    wikidata: "Q26070",
    aliases: ["uniqlo", "ユニクロ"],
  },
];
const normalize = (v: string) =>
  v
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s'’・.-]/g, "");
export function normalizeBrand(tags: Record<string, string>) {
  const q = /^Q\d+$/.test(tags["brand:wikidata"] || "")
    ? tags["brand:wikidata"]
    : undefined;
  const raw = tags.brand;
  const brand =
    brandAliases.find((b) => q && b.wikidata === q) ||
    brandAliases.find(
      (b) => raw && b.aliases.some((a) => normalize(a) === normalize(raw)),
    );
  if (q)
    return {
      brand: brand?.name || raw,
      brandId: `wikidata:${q}`,
      brandMatch: "wikidata" as const,
    };
  if (brand)
    return {
      brand: brand.name,
      brandId: brand.wikidata
        ? `wikidata:${brand.wikidata}`
        : `brand:${brand.id}`,
      brandMatch: "alias" as const,
    };
  if (raw)
    return {
      brand: raw,
      brandId: `name:${normalize(raw)}`,
      brandMatch: "unresolved" as const,
    };
  // A name hint is not an authoritative identity. Avoid short ambiguous aliases such as マック.
  const hint = brandAliases.find((b) =>
    b.aliases.some(
      (a) =>
        a !== "マック" && normalize(tags.name || "").startsWith(normalize(a)),
    ),
  );
  return hint ? { brand: hint.name, brandMatch: "name_hint" as const } : {};
}
