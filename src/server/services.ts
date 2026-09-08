import { randomUUID } from "node:crypto";
import { SqliteRepository } from "../infrastructure/sqlite";
import { CodexAI } from "../infrastructure/codex";
import { places } from "../fixtures/nagoya";
import { DiagnosisService } from "./diagnosis";
import { RouteService } from "./routes";
import { OpenRouteService } from "../infrastructure/openrouteservice";
import type { MapRepository, PersonalAI, Message } from "../contracts";
export class ConversationService {
  private running = new Set<string>();
  constructor(
    private repo: MapRepository,
    private ai: PersonalAI,
  ) {}
  async respond(actor: string, id: string) {
    const key = `${actor}:${id}`;
    if (this.running.has(key)) return;
    if (this.running.size >= 2)
      throw Error("AIが処理中です。少し待って再試行してください。");
    const state = this.repo.read(actor),
      message = state.messages.find((m) => m.id === id && m.role === "user");
    if (!message || message.status === "completed") return;
    if (!this.repo.claimMessage(actor, id)) return;
    this.running.add(key);
    try {
      const response = await this.ai.respond({
        question: message.text,
        place: places.find((p) => p.id === message.placeId) || null,
        history: state.messages
          .filter(
            (m) =>
              m.id !== id && (m.role === "user" || m.status === "completed"),
          )
          .slice(-20),
        memories: state.memories.slice(-80),
        recentPoints: state.points.filter(
          (p) => Date.parse(p.time) >= Date.now() - 30 * 86400000,
        ).length,
      });
      // A correction made while AI was running must not be followed by stale interpretations.
      const current = this.repo.read(actor);
      const changed =
        JSON.stringify(current.memories) !== JSON.stringify(state.memories);
      if (changed)
        throw Error(
          "処理中に記憶が訂正されました。新しい内容で再試行してください。",
        );
      const answer: Message = {
        id: `${id}:answer`,
        placeId: message.placeId,
        role: "assistant",
        text: response.answer,
        createdAt: new Date().toISOString(),
        status: "completed",
      };
      this.repo.completeMessage(
        actor,
        id,
        answer,
        response.memories.map((m, i) => ({
          id: `${id}:memory:${i}`,
          placeId: message.placeId,
          text: m.text,
          source: m.source,
          evidence: id,
          revision: 1,
        })),
      );
    } catch (error) {
      this.repo.updateMessage(
        actor,
        id,
        "waiting",
        error instanceof Error ? error.message : "AI接続を確認してください",
      );
    } finally {
      this.running.delete(key);
    }
  }
}
type Services = {
  repo: MapRepository;
  conversation: ConversationService;
  diagnosis: DiagnosisService;
  routes: RouteService;
};
const globalServices = globalThis as typeof globalThis & {
  growMapServices?: Services;
};
export function services() {
  if (!globalServices.growMapServices) {
    const repo = new SqliteRepository();
    globalServices.growMapServices = {
      repo,
      conversation: new ConversationService(repo, new CodexAI()),
      diagnosis: new DiagnosisService(repo, new CodexAI(), places),
      routes: new RouteService(
        repo,
        new CodexAI(),
        new OpenRouteService(),
        places,
      ),
    };
  }
  return globalServices.growMapServices;
}
