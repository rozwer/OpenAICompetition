"use client";
import { useState } from "react";
import { ArrowUp, MapPin, MessageCircle } from "lucide-react";
import { api } from "../../client/api";
import { clientId } from "../../client/id";
import type { FeatureContext } from "../../contracts";
export function Conversation({
  snapshot,
  selected,
  select,
  refresh,
  onPlanRoute,
}: FeatureContext & { onPlanRoute: () => void }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false);
  const key = selected?.id || "all",
    text = drafts[key] || "";
  const messages = snapshot.messages.filter(
    (m) => m.placeId === (selected?.id || null),
  );
  async function send(value = text) {
    if (!value.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await api("messages", {
        id: clientId(),
        text: value,
        placeId: selected?.id || null,
      });
      setDrafts((d) => ({ ...d, [key]: "" }));
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="conversation">
      <div className="eyebrow">A LITTLE CONVERSATION</div>
      <h2>{selected ? selected.name : "地図から、自分を知る。"}</h2>
      <p className="muted">
        {selected
          ? selected.description
          : "気になる場所や、最近の自分について。"}
      </p>
      <button className="context-pill" onClick={() => select(null)}>
        <MapPin size={13} />
        {selected ? `${selected.name}について · ×` : "自分の地図全体"}
      </button>
      <div className="messages" aria-live="polite">
        {!messages.length ? (
          <div className="conversation-empty">
            <div className="sparkle">✳</div>
            <p>
              この街での過ごし方を、
              <br />
              あなたの言葉で。
            </p>
            <small>
              会話を重ねると、場所を選ぶ理由や
              <br />
              好みが地図に残っていきます。
            </small>
            <div className="suggestions">
              {(selected
                ? [
                    "ここで気持ちを切り替えるのが好き",
                    "この場所について一緒に考えたい",
                  ]
                : [
                    "最近の自分の散歩はどんな傾向？",
                    "静かな場所で過ごすのが好き",
                  ]
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setDrafts((d) => ({ ...d, [key]: t }))}
                >
                  <MessageCircle size={13} />
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`message ${m.role}`}>
              <small>{m.role === "user" ? "あなた" : "育てる地図"}</small>
              <p>{m.text}</p>
              {m.role === "user" && m.status !== "completed" && (
                <div className="message-status">
                  {m.status === "waiting" ? (
                    <>
                      <span>{m.error || "処理を待機しています"}</span>
                      <button
                        onClick={() =>
                          void api("retry", { id: m.id })
                            .then(refresh)
                            .catch((e) => setError(e.message))
                        }
                      >
                        再試行
                      </button>
                    </>
                  ) : (
                    <span>保存済み · AIが考えています…</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="conversation-route" onClick={onPlanRoute}>この会話から散歩ルートを作る</button>
      <form
        
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          aria-label="メッセージ"
          placeholder="ここで、どんな時間を過ごした？"
          value={text}
          maxLength={4000}
          onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          className="send"
          aria-label="送信"
          disabled={sending || !text.trim()}
        >
          <ArrowUp size={20} />
        </button>
      </form>
      <small className="composer-note">
        ChatGPTのCodex利用枠で応答 · 会話から好みの傾向を推定
      </small>
    </section>
  );
}


