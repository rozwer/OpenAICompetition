import type { Definition } from "./extensions";

/** Transport-neutral development contract. No install, publish, or production-data access. */
export interface ExtensionDevelopmentTools {
  describe(): unknown;
  validate(candidate: unknown, previous: Definition | null): Definition;
  tryDefinition(definition: Definition): { actionsChecked: number };
}
export type ExtensionDevelopmentRequest = {
  history: { role: "user" | "assistant"; text: string }[];
  definition: Definition | null;
};
