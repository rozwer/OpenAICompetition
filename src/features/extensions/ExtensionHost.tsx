"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Puzzle, X, Plus, Sparkles } from "lucide-react";
import type { FeatureContext, Place } from "../../contracts";
import {
  type Draft,
  type Revision,
  type ExtensionState,
  type ExtensionMarker,
  permissionLabels,
} from "../../contracts/extensions";
import { renderText, markerAppearance } from "../../domain/extensions";
import { extensionApi } from "../../client/extensions";
import { ExtensionRuntime } from "./ExtensionRuntime";
export function ExtensionHost({
  ctx,
  studio,
  onClose,
  mapVisible,
  onMarkers,
  focusId,
}: {
  ctx: FeatureContext;
  studio: boolean;
  onClose: () => void;
  mapVisible: boolean;
  onMarkers: (markers: ExtensionMarker[]) => void;
  focusId: string | null;
}) {
  const [data, setData] = useState<ExtensionState>({
      drafts: [],
      installed: [],
      published: [],
    }),
    [active, setActive] = useState<string | null>(null),
    [draftId, setDraftId] = useState<string | null>(null),
    [prompt, setPrompt] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [review, setReview] = useState<{
      id: string;
      revision: Revision;
      source: "draft" | "public";
      publish?: boolean;
    } | null>(null),
    [approved, setApproved] = useState(false),
    [geoApproval, setGeoApproval] = useState<string | null>(null),
    [extraPlaces, setExtraPlaces] = useState<Place[]>([]),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState("");
  const seen = useRef(new Set<string>()),
    dialog = useRef<HTMLDialogElement>(null),
    actorRef = useRef(ctx.snapshot.actor);
  const refresh = useCallback(async () => {
    const actor = ctx.snapshot.actor;
    const value = await extensionApi();
    if (actorRef.current === actor) setData(value);
  }, [ctx.snapshot.actor]);
  useEffect(() => {
    actorRef.current = ctx.snapshot.actor;
    setData({ drafts: [], installed: [], published: [] });
    setActive(null);
    setDraftId(null);
    setExtraPlaces([]);
    seen.current.clear();
    void refresh().catch((e) => setError(e.message));
  }, [refresh, ctx.snapshot.actor]);
  useEffect(() => {
    if (studio) {
      void refresh().catch((e) => setError(e.message));
      setMenu(false);
    }
  }, [studio, refresh]);
  useEffect(() => {
    if (focusId) {
      setActive(focusId);
      setMenu(true);
    }
  }, [focusId]);
  const opened = studio || (mapVisible && menu);
  useEffect(() => {
    if (opened && !dialog.current?.open) dialog.current?.showModal();
    if (!opened && dialog.current?.open) dialog.current.close();
  }, [opened]);
  useEffect(() => {
    onMarkers(
      data.installed
        .filter(
          (i) => i.enabled && i.revision.definition.display.marker !== "none",
        )
        .flatMap((i) =>
          i.state.records.map((r) => ({
            id: `${i.id}:${r.placeId}`,
            extensionId: i.id,
            lng: r.lng,
            lat: r.lat,
            label: renderText(i.revision.definition.display.title, r),
            color: markerAppearance(i.revision.definition, r).color,
            colorLabel: markerAppearance(i.revision.definition, r).label,
            icon:
              i.revision.definition.display.marker === "tree"
                ? Number(
                    r.values[i.revision.definition.display.growthField || ""],
                  ) >= i.revision.definition.display.growthAt
                  ? "🌳"
                  : "🌱"
                : "📍",
          })),
        ),
    );
  }, [data, onMarkers]);
  useEffect(() => {
    const p = ctx.snapshot.points.at(-1);
    if (
      !p ||
      p.origin === "synthetic" ||
      p.accuracy === null ||
      p.accuracy > 50 ||
      document.hidden
    )
      return;
    for (const i of data.installed.filter((i) => i.enabled))
      for (const a of i.revision.definition.actions.filter(
        (a) => a.event === "visit",
      ))
        for (const place of [...ctx.places, ...extraPlaces]) {
          if (
            Math.hypot(
              (p.lat - place.lat) * 111320,
              (p.lng - place.lng) *
                111320 *
                Math.cos((place.lat * Math.PI) / 180),
            ) > 20
          )
            continue;
          const key = `${i.id}:${i.revision.version}:${a.id}:${place.id}:${p.id}`;
          if (seen.current.has(key)) continue;
          seen.current.add(key);
          if (seen.current.size > 2000) seen.current.clear();
          void extensionApi<{ notices: string[]; popups: string[] }>({
            op: "run",
            id: i.id,
            version: i.revision.version,
            actionId: a.id,
            placeId: place.id,
            input: {},
            preview: false,
          })
            .then((result) => {
              const message = [...result.notices, ...result.popups].join(" / ");
              if (message) setToast(message);
              return refresh();
            })
            .catch((e) => setError(e.message));
        }
  }, [ctx.snapshot.points, data.installed, ctx.places, extraPlaces, refresh]);
  const draft = data.drafts.find((d) => d.id === draftId),
    rev = draft?.revisions.at(-1),
    installed = data.installed.find((i) => i.id === active);
  const allPlaces = [
    ...ctx.places,
    ...extraPlaces.filter((p) => !ctx.places.some((v) => v.id === p.id)),
  ];
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const d = await extensionApi<Draft>({
        op: "generate",
        ...(draftId ? { id: draftId } : {}),
        text: prompt,
      });
      setDraftId(d.id);
      setPrompt("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      await refresh().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  async function mutate(body: unknown) {
    setBusy(true);
    setError("");
    try {
      await extensionApi(body);
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function geo(id: string, approve = false) {
    setBusy(true);
    setError("");
    try {
      const i = data.installed.find((i) => i.id === id)!;
      const result = await extensionApi<{
        approvalRequired: boolean;
        places: Place[];
      }>({ op: "geography", id, version: i.revision.version, approve });
      if (result.approvalRequired) setGeoApproval(id);
      else {
        setGeoApproval(null);
        setExtraPlaces(result.places);
        await refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function close() {
    setMenu(false);
    setReview(null);
    setGeoApproval(null);
    onClose();
  }
  return (
    <>
      {toast && (
        <div className="ext-toast" role="status">
          {toast}
          <button onClick={() => setToast("")}>閉じる</button>
        </div>
      )}
      {mapVisible && (
        <button
          className="ext-map-button"
          onClick={() => {
            void refresh();
            setMenu(true);
          }}
          aria-label="地図の拡張機能"
        >
          <Puzzle size={19} />
          <span>拡張機能</span>
        </button>
      )}
      <dialog
        ref={dialog}
        className="ext-dialog"
        onCancel={close}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <small>GROW WITH CODEX</small>
            <h2>{studio ? "機能を作る・育てる" : "地図の拡張機能"}</h2>
          </div>
          <button aria-label="拡張画面を閉じる" onClick={close}>
            <X />
          </button>
        </header>
        <div className="ext-dialog-body">
          <p role="status" className="ext-error">
            {error}
          </p>
          {review ? (
            <section className="ext-review">
              <h3>
                {review.publish ? "機能定義を公開する" : "利用する情報の確認"}
              </h3>
              <h4>
                {review.revision.definition.name} · v{review.revision.version}
              </h4>
              <p>{review.revision.definition.description}</p>
              <p>
                利用情報：
                {review.revision.definition.permissions
                  .map((p) => permissionLabels[p])
                  .join("・") || "専用の保存データのみ"}
              </p>
              <p>
                外部通信：
                {review.revision.definition.external
                  ? `Overpass / ${review.revision.definition.external.category} / 半径${review.revision.definition.external.radius}m（別途承認）`
                  : "なし"}
              </p>
              {review.publish && (
                <>
                  <p>
                    機能定義だけを公開します。会話履歴や保存した記録は共有しません。定義の文言・初期値に個人情報がないか確認してください。
                  </p>
                  <details>
                    <summary>公開する定義を確認</summary>
                    <pre>
                      {JSON.stringify(review.revision.definition, null, 2)}
                    </pre>
                  </details>
                </>
              )}
              <label>
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                />
                {review.publish
                  ? "公開内容を確認しました"
                  : "利用する情報を確認しました"}
              </label>
              <button
                disabled={!approved || busy}
                onClick={async () => {
                  if (
                    await mutate({
                      op: review.publish ? "publish" : "install",
                      id: review.id,
                      version: review.revision.version,
                      ...(!review.publish ? { source: review.source } : {}),
                      approved: true,
                    })
                  )
                    setReview(null);
                }}
              >
                {review.publish ? "公開する" : "この版を有効化する"}
              </button>
              <button onClick={() => setReview(null)}>戻る</button>
            </section>
          ) : (
            <>
              {studio && (
                <>
                  <div className="ext-section-title">
                    <h3>AIと一緒に作る</h3>
                    <button
                      disabled={busy}
                      onClick={() => {
                        setDraftId(null);
                        setPrompt("");
                      }}
                    >
                      <Plus size={16} />
                      新しく作る
                    </button>
                  </div>
                  <p className="ext-hint">
                    使いたい機能を伝えてください。現在はローカルPCのCodexが開発を代行し、部品仕様の確認・生成・検証・自動修正を行います。生成後にお試ししてから有効化できます。
                  </p>
                  <div className="ext-history">
                    {draft?.history.map((m, n) => (
                      <p key={n} className={m.role}>
                        {m.text}
                      </p>
                    ))}
                    {draft?.error && (
                      <p role="alert">
                        {draft.error}{" "}
                        入力は保存されています。同じ内容を送って再試行できます。
                      </p>
                    )}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void generate();
                    }}
                  >
                    <textarea
                      aria-label="作りたい機能や修正内容"
                      maxLength={4000}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="例：場所にメモを付けて一覧で見たい。地図にもピンを表示して。"
                    />
                    <button disabled={busy || !prompt.trim()}>
                      <Sparkles size={17} />
                      {busy
                        ? "処理中…"
                        : draft
                          ? "AIに修正を依頼"
                          : "AIで機能を作成"}
                    </button>
                  </form>
                  {rev && (
                    <section className="ext-preview">
                      <h3>
                        {rev.definition.name} · v{rev.version}
                      </h3>
                      <p>{rev.definition.description}</p>
                      <p className="ext-hint">
                        利用情報：
                        {rev.definition.permissions
                          .map((p) => permissionLabels[p])
                          .join("・") || "専用データ"}
                      </p>
                      <details>
                        <summary>生成された操作・ルールを見る</summary>
                        <pre>{JSON.stringify(rev.definition, null, 2)}</pre>
                      </details>
                      <ExtensionRuntime
                        key={`${draft!.id}:${rev.version}`}
                        id={draft!.id}
                        revision={rev}
                        places={allPlaces}
                        selected={ctx.selected}
                        state={{ records: [] }}
                        preview
                        onChange={() => void refresh()}
                      />
                      <button
                        disabled={busy || draft!.triedVersion !== rev.version}
                        onClick={() => {
                          setApproved(false);
                          setReview({
                            id: draft!.id,
                            revision: rev,
                            source: "draft",
                          });
                        }}
                      >
                        試した版を有効化
                      </button>
                      <button
                        disabled={busy || draft!.triedVersion !== rev.version}
                        onClick={() => {
                          setApproved(false);
                          setReview({
                            id: draft!.id,
                            revision: rev,
                            source: "draft",
                            publish: true,
                          });
                        }}
                      >
                        公開内容を確認
                      </button>
                    </section>
                  )}
                  <h3>作成した機能・下書き</h3>
                  <div className="ext-items">
                    {data.drafts.map((d) => (
                      <button
                        key={d.id}
                        disabled={busy}
                        onClick={() => {
                          setDraftId(d.id);
                          setPrompt("");
                        }}
                      >
                        {d.revisions.at(-1)?.definition.name ||
                          d.history[0]?.text.slice(0, 30) ||
                          "下書き"}
                        <small>
                          {d.revisions.length
                            ? `v${d.revisions.length}`
                            : "生成待ち"}
                          {d.error ? " / 再試行できます" : ""}
                        </small>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <h3>追加した機能</h3>
              <div className="ext-items">
                {!data.installed.length && (
                  <p>まだ追加した機能はありません。</p>
                )}
                {data.installed.map((i) => (
                  <article key={i.id}>
                    <button
                      onClick={() => setActive(active === i.id ? null : i.id)}
                    >
                      {i.revision.definition.name}
                      <small>
                        v{i.revision.version} · {i.enabled ? "有効" : "無効"}
                      </small>
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void mutate({
                          op: "toggle",
                          id: i.id,
                          enabled: !i.enabled,
                        })
                      }
                    >
                      {i.enabled ? "無効にする" : "再び有効にする"}
                    </button>
                    {i.consent && (
                      <button
                        disabled={busy}
                        onClick={() => void mutate({ op: "revoke", id: i.id })}
                      >
                        外部通信の承認を取り消す
                      </button>
                    )}
                  </article>
                ))}
              </div>
              {installed && installed.enabled && (
                <section>
                  <h3>{installed.revision.definition.name}</h3>
                  <ExtensionRuntime
                    key={`${installed.id}:${installed.revision.version}`}
                    id={installed.id}
                    revision={installed.revision}
                    places={allPlaces}
                    selected={ctx.selected}
                    state={installed.state}
                    preview={false}
                    onChange={() => void refresh()}
                  />
                  {installed.revision.definition.external && (
                    <button
                      disabled={busy}
                      onClick={() => void geo(installed.id)}
                    >
                      現在地周辺の地理情報を取得
                    </button>
                  )}
                </section>
              )}
              {geoApproval && (
                <section className="ext-review">
                  <h3>外部通信を承認しますか？</h3>
                  <p>
                    overpass-api.de
                    に現在地の座標（小数4桁）・施設カテゴリ・検索範囲を送り、周辺施設を取得します。会話やメモは送りません。同じ通信先・情報・目的では以後確認しません。
                  </p>
                  <button
                    disabled={busy}
                    onClick={() => void geo(geoApproval, true)}
                  >
                    承認して取得
                  </button>
                  <button onClick={() => setGeoApproval(null)}>
                    キャンセル
                  </button>
                </section>
              )}
              {extraPlaces.length > 0 && (
                <section>
                  <h3>周辺で見つかった場所</h3>
                  {extraPlaces.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        ctx.select(p);
                        close();
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                  <p>
                    <a
                      href="https://www.openstreetmap.org/copyright"
                      target="_blank"
                      rel="noreferrer"
                    >
                      © OpenStreetMap contributors / ODbL
                    </a>
                  </p>
                </section>
              )}
              {studio && (
                <>
                  <h3>みんなが公開した機能</h3>
                  <p className="ext-hint">
                    追加すると、あなた自身のデータで動きます。更新は自分で選べます。
                  </p>
                  <div className="ext-items">
                    {!data.published.length && (
                      <p>まだ公開された機能はありません。</p>
                    )}
                    {data.published.map((p) => (
                      <article key={p.id}>
                        <h4>
                          {p.revision.definition.name} · v{p.revision.version}
                        </h4>
                        <p>{p.revision.definition.description}</p>
                        <button
                          disabled={busy}
                          onClick={() => {
                            setApproved(false);
                            setReview({
                              id: p.id,
                              revision: p.revision,
                              source: "public",
                            });
                          }}
                        >
                          {data.installed.some((i) => i.id === p.id)
                            ? "更新内容を確認"
                            : "追加内容を確認"}
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </dialog>
    </>
  );
}


