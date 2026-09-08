import { z } from "zod";
const key = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9_]{0,39}$/)
  .refine((v) => !["constructor", "prototype", "__proto__"].includes(v));
export const permissions = [
  "places",
  "location",
  "visits",
  "messages",
  "memories",
  "route",
  "diagnosis",
  "friends",
] as const;
export const operandSchema = z
  .object({
    ref: z.string().max(100).nullable(),
    value: z.union([
      z.string().max(1000),
      z.number().finite(),
      z.boolean(),
      z.null(),
    ]),
  })
  .strict();
const conditionSchema = z
  .object({
    left: operandSchema,
    op: z.enum(["eq", "ne", "gt", "gte", "lt", "contains"]),
    right: operandSchema,
  })
  .strict();
export const markerColorSchema = z.enum(["green", "blue", "coral", "amber", "purple", "teal"]);
export const definitionSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z.string().min(1).max(60),
    description: z.string().max(500),
    permissions: z.array(z.enum(permissions)).max(6),
    fields: z
      .array(
        z
          .object({
            key,
            label: z.string().min(1).max(50),
            type: z.enum(["string", "number", "boolean"]),
            initial: z.union([
              z.string().max(1000),
              z.number().finite(),
              z.boolean(),
            ]),
          })
          .strict(),
      )
      .min(1)
      .max(16),
    actions: z
      .array(
        z
          .object({
            id: key,
            label: z.string().min(1).max(50),
            event: z.enum(["click", "visit"]),
            inputs: z.array(key).max(8),
            steps: z
              .array(
                z
                  .object({
                    when: z.array(conditionSchema).max(6),
                    op: z.enum(["set", "add", "multiply", "notify", "popup"]),
                    field: key.nullable(),
                    value: operandSchema,
                  })
                  .strict(),
              )
              .min(1)
              .max(24),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    display: z
      .object({
        title: z.string().max(150),
        detail: z.string().max(300),
        marker: z.enum(["pin", "tree", "none"]),
        growthField: key.nullable(),
        growthAt: z.number().min(1).max(10000),
        appearance: z.object({
          color: markerColorSchema,
          rules: z.array(z.object({
            field: key, op: z.enum(["eq", "ne", "gt", "gte", "lt"]),
            value: z.union([z.string().max(1000), z.number().finite(), z.boolean()]),
            color: markerColorSchema, label: z.string().min(1).max(40),
          }).strict()).max(8),
        }).strict().optional(),
      })
      .strict(),
    external: z
      .object({
        provider: z.literal("overpass"),
        category: z.enum(["cafe", "park", "restaurant", "museum"]),
        radius: z.number().int().min(100).max(1000),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type Definition = z.infer<typeof definitionSchema>;
export type Operand = z.infer<typeof operandSchema>;
export type ExtRecord = {
  placeId: string;
  placeName: string;
  lng: number;
  lat: number;
  values: Record<string, string | number | boolean>;
  lastVisit: string;
  visitDays?: Record<string, string>;
};
export type RuntimeState = { records: ExtRecord[] };
export type Revision = {
  version: number;
  definition: Definition;
  createdAt: string;
};
export type Draft = {
  id: string;
  history: { role: "user" | "assistant"; text: string }[];
  revisions: Revision[];
  error: string | null;
  triedVersion: number | null;
};
export type Installed = {
  id: string;
  owner: string;
  revision: Revision;
  enabled: boolean;
  state: RuntimeState;
  consent: string | null;
};
export type Published = { id: string; owner: string; revision: Revision };
export type ExtensionState = {
  drafts: Draft[];
  installed: Installed[];
  published: Published[];
};
export type ExtensionMarker = {
  id: string;
  lng: number;
  lat: number;
  label: string;
  icon: string;
  extensionId: string;
  color?: string;
  colorLabel?: string;
};
export interface ExtensionGenerator {
  generateExtension(
    input: unknown,
  ): Promise<{ explanation: string; definition: Definition | null }>;
}
export const generationSchema = z
  .object({
    explanation: z.string().min(1).max(2000),
    definition: definitionSchema.nullable(),
  })
  .strict();
export const permissionLabels: Record<string, string> = {
  places: "場所情報",
  location: "現在地",
  visits: "訪問・位置履歴",
  messages: "AIとの会話",
  memories: "好み・記憶",
  route: "提案経路",
  diagnosis: "タイプ診断",
  friends: "自分の友人一覧",
};




// Codex structured output requires every property in `required`.
// Stored v1 definitions remain compatible when appearance is absent.
export const codexGenerationSchema = generationSchema.extend({
  definition: definitionSchema.extend({
    display: definitionSchema.shape.display.extend({
      appearance: definitionSchema.shape.display.shape.appearance.unwrap(),
    }),
  }).nullable(),
});
