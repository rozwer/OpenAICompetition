import type {
  Building,
  PlaceCache,
  PlaceProvider,
  PlaceQuery,
  PlaceSearchResult,
  SemanticPlace,
} from "../contracts/places";
import { linkBuildings, withinPlaces } from "../domain/place-adapters";
// Grid coverage includes the unsnapped circle; normalization version invalidates old caches.
export function placeCacheKey(q: PlaceQuery, source: string) {
  const query = {
    lat: Math.round(q.lat * 500) / 500,
    lng: Math.round(q.lng * 500) / 500,
    radius: Math.ceil(q.radius / 250) * 250 + 200,
  };
  return {
    key: `${source}:v1:${query.lat}:${query.lng}:${query.radius}`,
    query,
  };
}
export class PlaceService {
  private pending = new Map<
    string,
    Promise<{ places: SemanticPlace[]; fetchedAt: string }>
  >();
  private nextRequest = 0;
  constructor(
    private provider: PlaceProvider,
    private cache: PlaceCache,
    private bundled: {
      places: SemanticPlace[];
      fetchedAt: string;
      buildings: Building[];
    },
    private now = () => Date.now(),
  ) {}
  async search(
    actor: string,
    q: PlaceQuery,
    network = false,
    approve = false,
  ): Promise<PlaceSearchResult> {
    if (approve) this.cache.approve(actor);
    const { key, query } = placeCacheKey(q, this.provider.source),
      saved = this.cache.get(key),
      approved = this.cache.approved(actor);
    const finish = (
      places: SemanticPlace[],
      cache: PlaceSearchResult["cache"],
      fetchedAt: string | null,
      warning?: string,
    ): PlaceSearchResult => {
      const all = withinPlaces(places, q),
        linked = linkBuildings(all.slice(0, 600), this.bundled.buildings),
        ids = new Set(linked.map((p) => p.buildingId));
      return {
        places: linked,
        buildings: this.bundled.buildings.filter((b) => ids.has(b.id)),
        cache,
        fetchedAt,
        warning,
        truncated: all.length > 600,
        approvalRequired: !approved,
      };
    };
    if (saved && this.now() - Date.parse(saved.fetchedAt) < 3600000)
      return finish(saved.places, "fresh", saved.fetchedAt);
    const fallback = (warning?: string) =>
      saved && this.now() - Date.parse(saved.fetchedAt) < 7 * 86400000
        ? finish(
            saved.places,
            "stale",
            saved.fetchedAt,
            warning ||
              "保存済みの情報です。周辺を更新すると最新情報を取得します。",
          )
        : finish(
            this.bundled.places,
            "bundled",
            this.bundled.fetchedAt,
            warning ||
              "同梱のOSMデータを表示しています。対応範囲は名古屋の一部です。",
          );
    if (!network || !approved) return fallback();
    try {
      let request = this.pending.get(key);
      if (!request) {
        if (this.pending.size || this.now() < this.nextRequest)
          return fallback(
            "問い合わせ間隔を空けるため、30秒ほど待ってから更新してください。",
          );
        this.nextRequest = this.now() + 30000;
        request = this.provider
          .getPlacesAround(query)
          .then((places) => {
            const result = {
              places,
              fetchedAt: new Date(this.now()).toISOString(),
            };
            this.cache.save(key, places, result.fetchedAt);
            return result;
          })
          .finally(() => this.pending.delete(key));
        this.pending.set(key, request);
      }
      const result = await request;
      return finish(result.places, "network", result.fetchedAt);
    } catch (e) {
      return fallback(
        e instanceof Error ? e.message : "周辺情報を取得できませんでした",
      );
    }
  }
}
