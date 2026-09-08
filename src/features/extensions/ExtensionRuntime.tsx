"use client";
import { useState } from "react";
import type { Place } from "../../contracts";
import type { Revision, RuntimeState } from "../../contracts/extensions";
import { renderText, markerAppearance, markerPalette } from "../../domain/extensions";
import { extensionApi } from "../../client/extensions";
export function ExtensionRuntime({
  id,
  revision,
  places,
  selected,
  state,
  preview,
  onChange,
}: {
  id: string;
  revision: Revision;
  places: Place[];
  selected: Place | null;
  state: RuntimeState;
  preview: boolean;
  onChange: () => void;
}) {
  const [placeId, setPlaceId] = useState(selected?.id || places[0]?.id || ""),
    [input, setInput] = useState<Record<string, string | number | boolean>>({}),
    [output, setOutput] = useState<RuntimeState | null>(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState(""),
    [popup, setPopup] = useState("");
  const d = revision.definition;
  async function run(actionId: string) {
    setBusy(true);
    setNotice("");
    try {
      const result = await extensionApi<{
        state: RuntimeState;
        notices: string[];
        popups: string[];
      }>({
        op: "run",
        id,
        version: revision.version,
        actionId,
        placeId,
        input: Object.fromEntries(
          revision.definition.fields.map((f) => [
            f.key,
            input[f.key] ?? f.initial,
          ]),
        ),
        preview,
      });
      setOutput(preview ? result.state : null);
      setPopup(result.popups.join(" / "));
      setNotice(result.notices.join(" / ") || "保存しました");
      onChange();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const records = (output || state).records.filter((r) =>
    `${r.placeName} ${Object.values(r.values).join(" ")}`.includes(filter),
  );
  return (
    <div className="ext-runtime">
      <p className="ext-hint">
        {preview
          ? "お試し専用のデータです。本番の記録には反映されません。訪問ボタンは到着のシミュレーションです。"
          : "場所を選んで操作できます。訪問による処理は、アプリを開いて実位置を取得している間に動きます。"}
      </p>
      <label>
        対象の場所
        <select
          aria-label="拡張機能の対象の場所"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
        >
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {d.actions
        .filter((a) => preview || a.event === "click")
        .map((a) => (
          <form
            key={a.id}
            onSubmit={(e) => {
              e.preventDefault();
              void run(a.id);
            }}
          >
            {a.inputs.map((k) => {
              const f = d.fields.find((f) => f.key === k)!;
              return (
                <label key={k}>
                  {f.label}
                  {f.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(input[k] ?? f.initial)}
                      onChange={(e) =>
                        setInput({ ...input, [k]: e.target.checked })
                      }
                    />
                  ) : (
                    <input
                      required
                      type={f.type === "number" ? "number" : "text"}
                      maxLength={4000}
                      value={String(input[k] ?? "")}
                      onChange={(e) =>
                        setInput({
                          ...input,
                          [k]:
                            f.type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              );
            })}
            <button disabled={busy || !placeId} type="submit">
              {a.event === "visit" ? "到着を試す：" : ""}
              {a.label}
            </button>
          </form>
        ))}
      <p role="status">{notice}</p>
      {popup && (
        <section
          className="ext-review"
          role="alertdialog"
          aria-label="拡張機能からのお知らせ"
        >
          <p>{popup}</p>
          <button onClick={() => setPopup("")}>確認しました</button>
        </section>
      )}
      <label>
        記録を絞り込む
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="場所やメモで検索"
        />
      </label>
      <div className="ext-color-legend" aria-label="地図の色分け"><span style={{color:markerPalette[d.display.appearance?.color || "green"].hex}}>● 通常</span>{d.display.appearance?.rules.map((rule,index)=><span key={index} style={{color:markerPalette[rule.color].hex}}>● {rule.label}</span>)}</div>
      <div className="ext-records">
        {records.map((r) => (
          <article key={r.placeId} style={{borderLeft: `5px solid ${markerAppearance(d,r).color}`}}>
              <small className="ext-color-label" style={{color:markerAppearance(d,r).color}}>{markerAppearance(d,r).label}</small>
            <strong>
              {d.display.marker === "tree"
                ? Number(r.values[d.display.growthField || ""]) >=
                  d.display.growthAt
                  ? "🌳 "
                  : "🌱 "
                : ""}
              {renderText(d.display.title, r)}
            </strong>
            <p>{renderText(d.display.detail, r)}</p>
            <small>{r.placeName}</small>
          </article>
        ))}
        {!records.length && <p className="ext-hint">まだ記録がありません。</p>}
      </div>
    </div>
  );
}

