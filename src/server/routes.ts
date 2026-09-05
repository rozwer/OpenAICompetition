import { createHash } from "node:crypto";
import type { MapRepository, Place } from "../contracts";
import { routeChoiceSchema, type RoutePlannerAI, type RouteRequest, type RouteProposal, type RouteStore, type WalkingRouter } from "../contracts/routes";
export class RouteService {
  private running = new Set<string>();
  constructor(private repo: MapRepository & RouteStore, private ai: RoutePlannerAI, private router: WalkingRouter, private places: Place[]) {}
  async create(actor: string, request: RouteRequest) {
    if (this.running.has(actor) || this.running.size >= 2) throw Error("経路を作成中です。少し待ってください。");
    const state = this.repo.read(actor);
    const lookup = (id: string) => { const p = this.places.find(p => p.id === id); if (!p) throw Error("登録されていない場所です。"); return p; };
    let start: Place;
    if (request.start === "gps") {
      const p = state.points.filter(p => p.origin === "device" && p.accuracy !== null && p.accuracy <= 50 && Date.parse(p.time) <= Date.now() && Date.parse(p.time) > Date.now()-300000).sort((a,b) => b.time.localeCompare(a.time))[0];
      if (!p) throw Error("5分以内のGPS位置がありません。出発地を選択してください。");
      start = { ...p, id: "gps", name: "最後に取得したGPS位置", category: "出発地", description: "" };
    } else start = lookup(request.start);
    const end = lookup(request.end), required = [...new Set(request.via)].map(lookup);
    if (required.some(p => p.id === start.id || p.id === end.id)) throw Error("経由地から出発地・目的地を外してください。");
    const history = state.messages.filter(m => m.placeId === request.placeId).slice(-30);
    if (!history.some(m => m.role === "user")) throw Error("まずAIと行きたい場所や好みについて話してください。");
    const input = { start, end, required, candidates: this.places.filter(p => p.id !== start.id && p.id !== end.id), history, memories: state.memories.slice(-60) };
    const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const cached = this.repo.readRoute(actor);
    if (cached?.fingerprint === fingerprint && cached.status === "ready") return cached;
    this.running.add(actor);
    try {
      let proposal: RouteProposal;
      if (cached?.fingerprint === fingerprint) proposal = { ...cached, route: null, error: undefined };
      else {
        const choice = routeChoiceSchema.parse(await this.ai.planRoute(input));
        const ids = choice.stops.map(p => p.placeId);
        if (new Set(ids).size !== ids.length || ids.some(id => !input.candidates.some(p => p.id === id))) throw Error("AIの経由地を確認できません。再試行してください。");
        const requiredOrder = ids.filter(id => request.via.includes(id));
        if (requiredOrder.join() !== required.map(p => p.id).join()) throw Error("必須の経由地が指定順になっていません。再試行してください。");
        if (start.id === end.id && !ids.length) throw Error("周遊するための立ち寄り先が見つかりませんでした。");
        proposal = { id: "current", request, fingerprint, start, end, stops: choice.stops.map(s => ({ place: lookup(s.placeId), reason: s.reason })), explanation: choice.explanation, status: "needs-key", route: null, createdAt: new Date().toISOString() };
      }
      if (this.router.configured()) {
        try { proposal.route = await this.router.route([start, ...proposal.stops.map(s => s.place), end]); proposal.status = "ready"; }
        catch (e) { proposal.status = "failed"; proposal.error = (e as Error).message; }
      } else proposal.status = "needs-key";
      this.repo.saveRoute(actor, proposal);
      return proposal;
    } finally { this.running.delete(actor); }
  }
}
