import { createHash } from "node:crypto";
import type { MapRepository, Place } from "../contracts";
import type { DiagnosisAI, DiagnosisReport, DiagnosisStore } from "../contracts/diagnosis";
import { diagnosisInput, emptyDiagnosis, validateDiagnosis } from "../domain/diagnosis";
export class DiagnosisService {
  private running = new Map<string, Promise<DiagnosisReport>>();
  constructor(private repo: MapRepository & DiagnosisStore, private ai: DiagnosisAI, private places: Place[]) {}
  async diagnose(actor: string): Promise<DiagnosisReport> {
    const input = diagnosisInput(this.repo.read(actor), this.places);
    const fingerprint = createHash("sha256").update("diagnosis-v1" + JSON.stringify(input)).digest("hex");
    const cached = this.repo.readDiagnosis(actor);
    if (cached?.fingerprint === fingerprint) return cached.report;
    const key = `${actor}:${fingerprint}`;
    const pending = this.running.get(key);
    if (pending) return pending;
    if (this.running.size >= 2) throw Error("診断が混み合っています。少し待って再試行してください。");
    const run = async () => {
      const diagnosis = input.evidence.length ? validateDiagnosis(await this.ai.diagnose(input), input) : emptyDiagnosis();
      const report = { ...diagnosis, updatedAt: input.evidence.length ? new Date().toISOString() : null, evidence: input.evidence };
      const current = diagnosisInput(this.repo.read(actor), this.places);
      if (JSON.stringify(current) === JSON.stringify(input)) this.repo.saveDiagnosis(actor, fingerprint, report);
      return report;
    };
    const work = run(); this.running.set(key, work);
    try { return await work; } finally { this.running.delete(key); }
  }
}
