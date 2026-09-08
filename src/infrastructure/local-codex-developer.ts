import type { ExtensionGenerator } from "../contracts/extensions";
import { generationSchema } from "../contracts/extensions";
import type { ExtensionDevelopmentRequest, ExtensionDevelopmentTools } from "../contracts/extension-development";

/** Local stand-in for the user's AI. Uses the same bounded development contract. */
export class LocalCodexDeveloper implements ExtensionGenerator {
  constructor(private model: ExtensionGenerator, private tools: ExtensionDevelopmentTools) {}
  async generateExtension(input: unknown) {
    const request = input as ExtensionDevelopmentRequest;
    const specification = this.tools.describe();
    let feedback = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = generationSchema.parse(await this.model.generateExtension({
        ...request,
        development: { mode: "local-codex-proxy", specification, attempt: attempt + 1, feedback },
      }));
      if (!result.definition) return result;
      try {
        const definition = this.tools.validate(result.definition, request.definition);
        this.tools.tryDefinition(definition);
        // Only return a draft candidate. The application owns persistence and activation.
        return { ...result, definition };
      } catch (error) {
        feedback = error instanceof Error ? error.message : "検証に失敗しました";
        if (attempt === 2) throw Error(`ローカルCodexの自動修正後も検証を通過しませんでした: ${feedback}`);
      }
    }
    throw Error("開発処理を完了できませんでした");
  }
}
