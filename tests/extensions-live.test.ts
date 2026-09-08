import { it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { CodexAI } from "../src/infrastructure/codex";
import { validateDefinition, execute } from "../src/domain/extensions";
import { places } from "../src/fixtures/nagoya";
it.skipIf(process.env.EXTENSIONS_LIVE !== "1")(
  "generates and executes two real Codex extensions",
  async () => {
    const results = [];
    for (const text of [
      "場所にメモを付けて保存し、一覧と地図ピンで見たい。メモを入力するボタンを作って。",
      "訪問するとポイントが1増え、3ポイント以上で地図上の木が大きくなる機能を作って。登録操作は不要で、初めて到着したときから自動的に育てたい。",
    ]) {
      const r = await new CodexAI().generateExtension({
        history: [{ role: "user", text }],
        definition: null,
      });
      expect(r.definition).not.toBeNull();
      const d = validateDefinition(r.definition);
      const a = d.actions.find(
        (a) => a.event === (results.length ? "visit" : "click"),
      )!;
      expect(a).toBeTruthy();
      const input = Object.fromEntries(
        a.inputs.map((k) => [
          k,
          d.fields.find((f) => f.key === k)!.type === "string" ? "検証メモ" : 1,
        ]),
      );
      const output = execute(d, { records: [] }, a.id, {
        place: places[0],
        input,
        context: {},
        event: { type: a.event, day: "2026-09-08" },
      });
      expect(output.state.records.length).toBe(1);
      results.push({ text, ...r, output });
    }
    mkdirSync(".local", { recursive: true });
    writeFileSync(
      ".local/extensions-live.json",
      JSON.stringify(results, null, 2),
    );
  },
  180000,
);
