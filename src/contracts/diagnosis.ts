import { z } from "zod";
export const axes = [
  { id: "curiosity", label: "探究心" }, { id: "nature", label: "自然志向" },
  { id: "culture", label: "文化への関心" }, { id: "food", label: "食への関心" },
  { id: "social", label: "交流志向" }, { id: "activity", label: "活動意欲" },
] as const;
export const diagnosisSchema = z.object({
  axes: z.array(z.object({
    id: z.enum(["curiosity", "nature", "culture", "food", "social", "activity"]),
    score: z.number().int().min(0).max(100).nullable(),
    reason: z.string().min(1).max(500),
    evidenceIds: z.array(z.string()).max(8),
  })).length(6),
});
export type Diagnosis = z.infer<typeof diagnosisSchema>;
export type DiagnosisEvidence = { id: string; kind: "conversation" | "stay"; text: string };
export type DiagnosisInput = { evidence: DiagnosisEvidence[] };
export type DiagnosisReport = Diagnosis & { updatedAt: string | null; evidence: DiagnosisEvidence[] };
export interface DiagnosisAI { diagnose(input: DiagnosisInput): Promise<Diagnosis> }
export interface DiagnosisStore {
  readDiagnosis(actor: string): { fingerprint: string; report: DiagnosisReport } | undefined;
  saveDiagnosis(actor: string, fingerprint: string, report: DiagnosisReport): void;
}
