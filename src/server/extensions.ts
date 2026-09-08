import type { DiagnosisStore } from "../contracts/diagnosis";
import { randomUUID } from "node:crypto";
import type { MapRepository, Place } from "../contracts";
import type {
  Definition,
  Draft,
  Installed,
  Published,
  Revision,
  RuntimeState,
  ExtensionGenerator,
} from "../contracts/extensions";
import {
  validateDefinition,
  assertCompatible,
  execute,
} from "../domain/extensions";
import { ExtensionStore } from "../infrastructure/extension-store";
import { externalScope, nearby } from "../infrastructure/extension-geography";
export class ExtensionService {
  private running = new Set<string>();
  constructor(
    private store: ExtensionStore,
    private repo: MapRepository & Partial<DiagnosisStore>,
    private ai: ExtensionGenerator,
    private places: Place[],
  ) {}
  read(actor: string) {
    return {
      drafts: this.store.list<Draft>(actor, "draft"),
      installed: this.store.list<Installed>(actor, "installed"),
      published: this.store.list<Published>("public", "published"),
    };
  }
  async generate(actor: string, id: string | undefined, text: string) {
    if (this.running.has(actor) || this.running.size >= 2)
      throw Error("AIが処理中です。少し待って再試行してください");
    let draft = id ? this.store.get<Draft>(actor, "draft", id) : undefined;
    if (id && !draft) throw Error("自分の下書きが見つかりません");
    if (!draft && this.read(actor).drafts.length >= 30)
      throw Error("下書きは30件までです");
    draft ||= {
      id: randomUUID(),
      history: [],
      revisions: [],
      error: null,
      triedVersion: null,
    };
    if (draft.revisions.length >= 30 || draft.history.length >= 60)
      throw Error("この下書きの修正回数の上限です");
    draft.history.push({ role: "user", text });
    draft.error = null;
    this.store.put(actor, "draft", draft.id, draft);
    this.running.add(actor);
    try {
      const result = await this.ai.generateExtension({
        history: draft.history,
        definition: draft.revisions.at(-1)?.definition || null,
      });
      if (result.definition) {
        const definition = validateDefinition(result.definition);
        const previous = draft.revisions.at(-1);
        if (previous) assertCompatible(previous.definition, definition);
        draft.revisions.push({
          version: draft.revisions.length + 1,
          definition,
          createdAt: new Date().toISOString(),
        });
        draft.triedVersion = null;
      }
      draft.history.push({ role: "assistant", text: result.explanation });
    } catch (e) {
      draft.error = e instanceof Error ? e.message : "生成に失敗しました";
    } finally {
      this.running.delete(actor);
      this.store.put(actor, "draft", draft.id, draft);
    }
    return draft;
  }
  private draft(actor: string, id: string) {
    const d = this.store.get<Draft>(actor, "draft", id);
    if (!d) throw Error("下書きがありません");
    return d;
  }
  private installed(actor: string, id: string) {
    const i = this.store.get<Installed>(actor, "installed", id);
    if (!i) throw Error("追加済みの機能がありません");
    return i;
  }
  install(
    actor: string,
    id: string,
    version: number,
    source: "draft" | "public",
  ) {
    const draft = source === "draft" ? this.draft(actor, id) : null;
    const pub =
      source === "public"
        ? this.store.get<Published>("public", "published", id)
        : null;
    const revision =
      draft?.revisions.find((r) => r.version === version) || pub?.revision;
    if (!revision || revision.version !== version)
      throw Error("版が更新されています。再確認してください");
    if (draft && draft.triedVersion !== version)
      throw Error("先にこの版をお試しで実行してください");
    const definition = validateDefinition(revision.definition),
      old = this.store.get<Installed>(actor, "installed", id);
    if (old) {
      assertCompatible(old.revision.definition, definition);
      if (version < old.revision.version)
        throw Error("古い版への更新はできません");
    }
    if (!old && this.read(actor).installed.length >= 20)
      throw Error("機能は20件まで追加できます");
    this.store.put(actor, "installed", id, {
      id,
      owner: pub?.owner || actor,
      revision,
      enabled: true,
      state: old?.state || { records: [] },
      consent: old?.consent === externalScope(definition) ? old.consent : null,
    } satisfies Installed);
  }
  publish(actor: string, id: string, version: number) {
    const d = this.draft(actor, id),
      r = d.revisions.find((r) => r.version === version);
    if (!r || d.triedVersion !== version)
      throw Error("公開する版を先にお試しください");
    const current = this.store.get<Published>("public", "published", id);
    if (current && current.revision.version > version)
      throw Error("古い版は公開できません");
    this.store.put("public", "published", id, {
      id,
      owner: actor,
      revision: r,
    } satisfies Published);
  }
  toggle(actor: string, id: string, enabled: boolean) {
    const i = this.installed(actor, id);
    i.enabled = enabled;
    this.store.put(actor, "installed", id, i);
  }
  revoke(actor: string, id: string) {
    const i = this.installed(actor, id);
    i.consent = null;
    this.store.put(actor, "installed", id, i);
  }
  private place(actor: string, id: string) {
    const p =
      this.places.find((p) => p.id === id) ||
      this.store.get<Place[]>(actor, "geo", "places")?.find((p) => p.id === id);
    if (!p) throw Error("場所を選択してください");
    return p;
  }
  run(
    actor: string,
    id: string,
    version: number,
    actionId: string,
    placeId: string,
    input: Record<string, unknown>,
    preview = false,
  ) {
    const snapshot = this.repo.read(actor);
    return this.store.transaction(() => {
      const draft = preview ? this.draft(actor, id) : null,
        i = preview ? null : this.installed(actor, id);
      const revision =
        draft?.revisions.find((r) => r.version === version) || i?.revision;
      if (
        !revision ||
        revision.version !== version ||
        (!preview && !i?.enabled)
      )
        throw Error("機能が無効、または版が更新されています");
      const d = validateDefinition(revision.definition),
        a = d.actions.find((a) => a.id === actionId);
      if (!a) throw Error("操作がありません");
      const place = this.place(actor, placeId);
      if (a.event === "visit" && !preview) {
        const p = snapshot.points
          .filter(
            (p) =>
              p.origin !== "synthetic" &&
              p.accuracy !== null &&
              p.accuracy <= 50 &&
              Math.abs(Date.now() - Date.parse(p.time)) < 120000,
          )
          .at(-1);
        if (
          !p ||
          Math.hypot(
            (p.lat - place.lat) * 111320,
            (p.lng - place.lng) *
              111320 *
              Math.cos((place.lat * Math.PI) / 180),
          ) > 20
        )
          throw Error("現在地が場所の20m以内にあることを確認できません");
      }
      const context: Record<string, unknown> = {};
      for (const permission of d.permissions) {
        if (permission === "places") continue;
        context[permission] = JSON.stringify(
          permission === "visits"
            ? snapshot.points
            : permission === "location"
              ? snapshot.points.at(-1)
              : permission === "diagnosis" ? this.repo.readDiagnosis?.(actor)?.report : snapshot[permission as "messages" | "memories" | "route" | "friends"],
        );
      }
      const previewKey = `${id}:${version}`;
      const state = preview
        ? this.store.get<RuntimeState>(actor, "preview", previewKey) || {
            records: [],
          }
        : i!.state;
      const result = execute(d, state, actionId, {
        place,
        event: {
          day: new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Asia/Tokyo",
          }).format(new Date()),
          type: a.event,
        },
        context,
        input,
      });
      if (preview) {
        this.store.put(actor, "preview", previewKey, result.state);
        draft!.triedVersion = version;
        this.store.put(actor, "draft", id, draft);
      } else {
        i!.state = result.state;
        this.store.put(actor, "installed", id, i);
      }
      return result;
    });
  }
  async geography(
    actor: string,
    id: string,
    version: number,
    approve: boolean,
  ) {
    const i = this.installed(actor, id);
    if (!i.enabled || i.revision.version !== version)
      throw Error("機能が無効、または版が更新されています");
    const scope = externalScope(i.revision.definition);
    if (!scope) throw Error("外部連携がありません");
    if (i.consent !== scope && !approve)
      return { approvalRequired: true, places: [] };
    const point = this.repo
      .read(actor)
      .points.filter(
        (p) =>
          p.origin === "device" &&
          p.accuracy !== null &&
          p.accuracy <= 100 &&
          Math.abs(Date.now() - Date.parse(p.time)) < 120000,
      )
      .at(-1);
    if (!point) throw Error("先に地図で現在地を取得してください");
    if (approve) {
      i.consent = scope;
      this.store.put(actor, "installed", id, i);
    }
    const result = await nearby(i.revision.definition, point);
    const current = this.installed(actor, id);
    if (
      !current.enabled ||
      current.consent !== scope ||
      current.revision.version !== version
    )
      throw Error("取得中に機能設定が変更されました");
    const previous = this.store.get<Place[]>(actor,"geo","places") || [];
    this.store.put(actor, "geo", "places", [...new Map([...previous,...result].map(p=>[p.id,p])).values()].slice(-300));
    return { approvalRequired: false, places: result };
  }
}


