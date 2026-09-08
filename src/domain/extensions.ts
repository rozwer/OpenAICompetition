import {
  definitionSchema,
  type Definition,
  type Operand,
  type RuntimeState,
  type ExtRecord,
} from "../contracts/extensions";
export function validateDefinition(raw: unknown): Definition {
  const d = definitionSchema.parse(raw);
  const fields = new Map(d.fields.map((f) => [f.key, f]));
  if (
    fields.size !== d.fields.length ||
    new Set(d.actions.map((a) => a.id)).size !== d.actions.length
  )
    throw Error("項目や操作のIDが重複しています");
  for (const f of d.fields)
    if (typeof f.initial !== f.type) throw Error("初期値の型が一致しません");
  if (
    d.display.growthField &&
    fields.get(d.display.growthField)?.type !== "number"
  )
    throw Error("成長項目は数値が必要です");
  const check = (o: Operand) => {
    if (!o.ref) return;
    if (
      !/^(record|input)\.[a-z][a-zA-Z0-9_]*$|^place\.(id|name|category|lat|lng)$|^event\.(day|type)$|^context\.(messages|memories|visits|route|location|diagnosis|friends)$/.test(
        o.ref,
      )
    )
      throw Error("未対応のデータ参照です: " + o.ref);
    const [root, member] = o.ref.split(".");
    if ((root === "record" || root === "input") && !fields.has(member))
      throw Error("存在しない項目です");
    const permission =
      root === "place" ? "places" : root === "context" ? member : null;
    if (
      permission &&
      !d.permissions.includes(permission as (typeof d.permissions)[number])
    )
      throw Error("利用情報の宣言が不足しています: " + permission);
  };
  for (const a of d.actions) {
    if (a.event === "visit" && a.inputs.length)
      throw Error("訪問イベントに手入力は指定できません");
    if (a.event === "visit" && !d.permissions.includes("visits"))
      throw Error("訪問の利用宣言が必要です");
    for (const input of a.inputs)
      if (!fields.has(input)) throw Error("入力項目がありません");
    for (const s of a.steps) {
      check(s.value);
      for (const c of s.when) {
        check(c.left);
        check(c.right);
      }
      if (
        ["set", "add", "multiply"].includes(s.op) &&
        !fields.has(s.field || "")
      )
        throw Error("保存項目がありません");
      if (
        ["add", "multiply"].includes(s.op) &&
        fields.get(s.field || "")?.type !== "number"
      )
        throw Error("計算する項目は数値が必要です");
    }
  }
  for (const text of [d.display.title, d.display.detail])
    for (const m of text.matchAll(/\{([^}]+)\}/g)) {
      if (!/^(record|place)\./.test(m[1]))
        throw Error("表示には保存項目または場所情報を使ってください");
      check({ ref: m[1], value: null });
    }
  for (const rule of d.display.appearance?.rules || []) {
    const field = fields.get(rule.field);
    if (!field || typeof rule.value !== field.type) throw Error("色分け条件の項目または値の型が不正です");
    if (["gt", "gte", "lt"].includes(rule.op) && field.type !== "number") throw Error("色分けの大小比較は数値項目に指定してください");
  }
  return d;
}
export function assertCompatible(old: Definition, next: Definition) {
  for (const f of old.fields)
    if (!next.fields.some((n) => n.key === f.key && n.type === f.type))
      throw Error(
        "既存の保存項目の削除・型変更はできません。項目を残して修正してください。",
      );
}
export function resolveOperand(
  o: Operand,
  env: Record<string, unknown>,
): unknown {
  if (!o.ref) return o.value;
  const [root, key] = o.ref.split(".");
  const obj = env[root];
  return obj && typeof obj === "object" && Object.hasOwn(obj, key)
    ? (obj as Record<string, unknown>)[key]
    : null;
}
export function renderText(text: string, record: ExtRecord) {
  return text
    .replace(/\{(record|place)\.([a-zA-Z0-9_]+)\}/g, (_, root, key) =>
      String(
        root === "record"
          ? (record.values[key] ?? "")
          : key === "name"
            ? record.placeName
            : key === "id"
              ? record.placeId
              : "",
      ),
    )
    .slice(0, 1000);
}
export function execute(
  d: Definition,
  state: RuntimeState,
  actionId: string,
  env: {
    place: {
      id: string;
      name: string;
      lng: number;
      lat: number;
      category: string;
    };
    event: { day: string; type: string };
    context: Record<string, unknown>;
    input: Record<string, unknown>;
  },
) {
  const action = d.actions.find((a) => a.id === actionId);
  if (!action) throw Error("操作が見つかりません");
  const next: RuntimeState = structuredClone(state);
  let r = next.records.find((r) => r.placeId === env.place.id);
  if (!r) {
    if (next.records.length >= 300)
      throw Error("保存できる場所は300件までです");
    r = {
      placeId: env.place.id,
      placeName: env.place.name,
      lng: env.place.lng,
      lat: env.place.lat,
      values: {},
      lastVisit: "",
    };
    next.records.push(r);
  }
  for (const f of d.fields)
    if (!Object.hasOwn(r.values, f.key)) r.values[f.key] = f.initial;
  if (action.event === "visit" && r.visitDays?.[action.id] === env.event.day)
    return { state, notices: [] as string[], popups: [] as string[] };
  for (const k of action.inputs) {
    const f = d.fields.find((f) => f.key === k)!;
    if (typeof env.input[k] !== f.type)
      throw Error(f.label + "の入力形式を確認してください");
  }
  const notices: string[] = [],
    popups: string[] = [];
  const scope = { ...env, record: r.values };
  for (const step of action.steps) {
    if (
      !step.when.every((c) => {
        const l = resolveOperand(c.left, scope),
          rr = resolveOperand(c.right, scope);
        switch (c.op) {
          case "eq":
            return l === rr;
          case "ne":
            return l !== rr;
          case "gt":
            return Number(l) > Number(rr);
          case "gte":
            return Number(l) >= Number(rr);
          case "lt":
            return Number(l) < Number(rr);
          case "contains":
            return String(l ?? "").includes(String(rr ?? ""));
        }
      })
    )
      continue;
    const v = resolveOperand(step.value, scope);
    if (step.op === "notify" || step.op === "popup") {
      (step.op === "popup" ? popups : notices).push(
        String(v ?? "").slice(0, 500),
      );
      continue;
    }
    const f = d.fields.find((f) => f.key === step.field)!;
    const result =
      step.op === "add"
        ? Number(r.values[f.key]) + Number(v)
        : step.op === "multiply"
          ? Number(r.values[f.key]) * Number(v)
          : v;
    if (
      typeof result !== f.type ||
      (typeof result === "number" &&
        (!Number.isFinite(result) || Math.abs(result) > 1e9)) ||
      (typeof result === "string" && result.length > 4000)
    )
      throw Error("保存値の型またはサイズが不正です");
    r.values[f.key] = result as string | number | boolean;
  }
  if (action.event === "visit") { r.lastVisit = env.event.day; r.visitDays = {...r.visitDays, [action.id]: env.event.day}; }
  return { state: next, notices, popups };
}



export const markerPalette = {
  green: { hex: "#388565", name: "緑" }, blue: { hex: "#326EC4", name: "青" },
  coral: { hex: "#C75849", name: "赤" }, amber: { hex: "#A77316", name: "黄" },
  purple: { hex: "#8055B4", name: "紫" }, teal: { hex: "#24858B", name: "青緑" },
};
export function markerAppearance(definition: Definition, record: ExtRecord) {
  const appearance = definition.display.appearance;
  const rule = appearance?.rules.find(rule => {
    const value = record.values[rule.field] ?? definition.fields.find(f => f.key === rule.field)?.initial;
    switch (rule.op) {
      case "eq": return value === rule.value;
      case "ne": return value !== rule.value;
      case "gt": return Number(value) > Number(rule.value);
      case "gte": return Number(value) >= Number(rule.value);
      case "lt": return Number(value) < Number(rule.value);
    }
  });
  const color = markerPalette[rule?.color || appearance?.color || "green"];
  return {color: color.hex, label: rule?.label || `通常（${color.name}）`};
}
