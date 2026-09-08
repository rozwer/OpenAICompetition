import { z } from "zod";
import { definitionSchema, type Definition } from "../contracts/extensions";
import type { ExtensionDevelopmentTools } from "../contracts/extension-development";
import { validateDefinition, assertCompatible, execute } from "./extensions";

/** Shared development tools: usable by the local driver and a future authenticated remote driver. */
export class ExtensionDevelopmentKit implements ExtensionDevelopmentTools {
  describe() {
    return {
      protocolVersion: 1,
      definitionSchema: z.toJSONSchema(definitionSchema),
      operations: ["describe", "validate", "tryDefinition", "submitDraft"],
      boundaries: "提出先は下書きのみ。有効化・公開・外部通信の承認は利用者がアプリ内で行う。",
      trial: "検証は架空の場所と初期値のみを使う。本人の記録・現在地・外部通信は使用しない。",
    };
  }
  validate(candidate: unknown, previous: Definition | null) {
    const definition = validateDefinition(candidate);
    if (previous) assertCompatible(previous, definition);
    return definition;
  }
  tryDefinition(definition: Definition) {
    let state = { records: [] } as Parameters<typeof execute>[1];
    for (const action of definition.actions) {
      const input = Object.fromEntries(action.inputs.map(key => {
        const field = definition.fields.find(field => field.key === key)!;
        return [key, field.type === "string" ? "お試し入力" : field.type === "number" ? 1 : true];
      }));
      const result = execute(definition, state, action.id, {
        place: { id: "development-place", name: "検証用の場所", lng: 0, lat: 0, category: "検証" },
        event: { day: "2000-01-01", type: action.event }, input,
        context: Object.fromEntries(definition.permissions.map(permission => [permission, "[]"])),
      });
      state = result.state;
    }
    return { actionsChecked: definition.actions.length };
  }
}
