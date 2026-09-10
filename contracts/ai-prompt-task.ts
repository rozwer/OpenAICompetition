/** Optional prompt-task ABI. It contains no SDK, HTTP, database, or AiPort implementation. */
import type * as D from './domain';
import type { ServiceId, ServiceLookup, ServiceMap } from './entries';

export type AiPromptTaskId = D.AiInput['task'];
export type AiPromptTaskInput<K extends AiPromptTaskId> = Extract<D.AiInput, { task: K }>['input'];
export type AiPromptTaskOutput<K extends AiPromptTaskId> = Extract<D.AiOutput, { task: K }>['output'];

export type AiPromptJson = string | number | boolean | null |
  readonly AiPromptJson[] | { readonly [key: string]: AiPromptJson };
export type AiPromptOutputSchema = boolean | { readonly [key: string]: AiPromptJson };

export type AiPromptFailureReason =
  | 'ABORTED'
  | 'STALE_SCOPE'
  | 'CONFIGURATION_INVALID'
  | 'AUTH_UNAVAILABLE'
  | 'PROVIDER_FAILED'
  | 'OUTPUT_INVALID';

export type AiPromptFailurePhase =
  | 'resolve'
  | 'configure'
  | 'authenticate'
  | 'execute'
  | 'freshness'
  | 'decode';

export class AiPromptTaskError extends Error {
  readonly name = 'AiPromptTaskError';

  constructor(
    readonly reason: AiPromptFailureReason,
    readonly phase: AiPromptFailurePhase,
    message: string,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** A prompt resolver cannot request the AiPort that is currently dispatching it. */
export type AiPromptServiceId = Exclude<ServiceId, 'ai'>;
export interface AiPromptServiceLookup {
  get<K extends AiPromptServiceId>(id: K): ServiceMap[K];
}

export type AiPromptEvidenceRole = 'original' | 'question-answer' | 'supporting';

/** Resolver-only identity fields. They are validated and removed before prompt construction. */
export interface AiPromptResolvedEvidence {
  readonly id: D.Id;
  readonly namespaceId: D.Id;
  readonly actorId: D.Id;
  readonly revision: number;
  readonly role: AiPromptEvidenceRole;
  readonly text: string;
}

export interface AiPromptResolvedSource<Context> {
  /** Exact scope snapshot used for this resolution, including pinned entity revisions. */
  readonly scope: D.Scope;
  /** Null only for tasks that have no distinguished person-authored original. */
  readonly originalEvidenceId: D.Id | null;
  /** Exact evidence allowlist. Extra resolver evidence is rejected. */
  readonly requiredEvidenceIds: readonly D.Id[];
  readonly evidence: readonly AiPromptResolvedEvidence[];
  /** Task-specific, deliberately projected model context. */
  readonly context: Context;
}

export interface AiPromptModelEvidence {
  readonly id: D.Id;
  readonly role: AiPromptEvidenceRole;
  readonly text: string;
}

/** Only this identity-minimized value reaches buildPrompt/decode. */
export interface AiPromptModelContext<Context> {
  readonly context: Context;
  readonly evidence: readonly AiPromptModelEvidence[];
}

export interface AiPromptSourceResolver<K extends AiPromptTaskId, Context> {
  resolve(
    input: AiPromptTaskInput<K>,
    scope: D.Scope,
    signal: AbortSignal,
  ): Promise<AiPromptResolvedSource<Context>>;
  /** Called after the provider returns and before its output can be decoded/applied. */
  isCurrent(source: AiPromptResolvedSource<Context>, signal: AbortSignal): Promise<boolean>;
}

export interface AiPromptTaskDefinition<K extends AiPromptTaskId, Context> {
  readonly task: K;
  readonly outputSchema: AiPromptOutputSchema;
  readonly resolver: AiPromptSourceResolver<K, Context>;
  buildPrompt(model: AiPromptModelContext<Context>): string;
  decode(value: unknown, model: AiPromptModelContext<Context>): AiPromptTaskOutput<K>;
}

export interface AiPreparedPrompt<K extends AiPromptTaskId> {
  readonly task: K;
  readonly prompt: string;
  readonly outputSchema: AiPromptOutputSchema;
  /** Must run after the single provider turn and before decode/apply. */
  assertCurrent(signal: AbortSignal): Promise<void>;
  decode(value: unknown): AiPromptTaskOutput<K>;
}

/** Adapter-facing erased context; defineAiPromptTask retains its concrete Context internally. */
export interface AiPromptTask<K extends AiPromptTaskId> {
  readonly task: K;
  prepare(input: AiPromptTaskInput<K>, scope: D.Scope, signal: AbortSignal): Promise<AiPreparedPrompt<K>>;
}

export interface AiPromptTaskRegistration<K extends AiPromptTaskId> {
  readonly kind: 'prompt-task';
  create(services: AiPromptServiceLookup): AiPromptTask<K>;
}

/**
 * Preserves task-specific input/context/output types while exposing one adapter ABI.
 * Authentication and the provider turn remain adapter responsibilities (AI-012).
 */
export function defineAiPromptTask<K extends AiPromptTaskId, Context>(
  definition: AiPromptTaskDefinition<K, Context>,
): AiPromptTask<K> {
  return {
    task: definition.task,
    async prepare(input, scope, signal) {
      throwIfAborted(signal, 'resolve');
      const source = await definition.resolver.resolve(input, scope, signal);
      throwIfAborted(signal, 'resolve');
      const model = validateAndProject(scope, source);
      const prompt = definition.buildPrompt(model);
      if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new AiPromptTaskError(
          'CONFIGURATION_INVALID', 'configure', 'Prompt builder returned an empty prompt', false,
        );
      }
      return {
        task: definition.task,
        prompt,
        outputSchema: definition.outputSchema,
        async assertCurrent(currentSignal) {
          throwIfAborted(currentSignal, 'freshness');
          if (!await definition.resolver.isCurrent(source, currentSignal)) {
            throw new AiPromptTaskError(
              'STALE_SCOPE', 'freshness', 'Prompt result belongs to an older scope snapshot', false,
            );
          }
          throwIfAborted(currentSignal, 'freshness');
        },
        decode(value) {
          try {
            return definition.decode(value, model);
          } catch (error) {
            if (error instanceof AiPromptTaskError) throw error;
            throw new AiPromptTaskError(
              'OUTPUT_INVALID', 'decode', 'Prompt output failed task-specific validation', false, { cause: error },
            );
          }
        },
      };
    },
  };
}

/** The full ServiceLookup can be narrowed for an opt-in prompt factory, never widened back to ai. */
export function promptServiceLookup(services: ServiceLookup): AiPromptServiceLookup {
  return {
    get(id) {
      if ((id as ServiceId) === 'ai') {
        throw new AiPromptTaskError(
          'CONFIGURATION_INVALID', 'configure', 'Prompt resolver cannot depend on the dispatching AiPort', false,
        );
      }
      return services.get(id);
    },
  };
}

function validateAndProject<Context>(
  requestedScope: D.Scope,
  source: AiPromptResolvedSource<Context>,
): AiPromptModelContext<Context> {
  if (!sameScope(requestedScope, source.scope)) {
    throw new AiPromptTaskError(
      'STALE_SCOPE', 'resolve', 'Resolver returned a different scope snapshot', false,
    );
  }

  const requiredIds = new Set(source.requiredEvidenceIds);
  if (requiredIds.size !== source.requiredEvidenceIds.length) invalidSource('requiredEvidenceIds contains duplicates');
  const evidenceIds = new Set(source.evidence.map((item) => item.id));
  if (evidenceIds.size !== source.evidence.length) invalidSource('resolver evidence contains duplicate IDs');
  if (evidenceIds.size !== requiredIds.size || [...evidenceIds].some((id) => !requiredIds.has(id))) {
    invalidSource('resolver evidence must exactly match requiredEvidenceIds');
  }

  for (const item of source.evidence) {
    if (item.namespaceId !== requestedScope.namespaceId || item.actorId !== requestedScope.actorId) {
      invalidSource(`evidence ${item.id} is outside the actor or namespace scope`);
    }
    if (!Number.isSafeInteger(item.revision) || item.revision < 1) {
      invalidSource(`evidence ${item.id} has an invalid revision`);
    }
    if (!requestedScope.entityVersions.some((version) =>
      version.type === 'Evidence' && version.id === item.id && version.revision === item.revision)) {
      throw new AiPromptTaskError(
        'STALE_SCOPE', 'resolve', `evidence ${item.id} revision is not pinned in scope`, false,
      );
    }
    if (item.text.trim().length === 0) invalidSource(`evidence ${item.id} has blank source text`);
  }

  if (source.originalEvidenceId !== null) {
    const original = source.evidence.filter((item) => item.role === 'original');
    if (original.length !== 1 || original[0]?.id !== source.originalEvidenceId || !requiredIds.has(source.originalEvidenceId)) {
      invalidSource('originalEvidenceId must identify the single original source');
    }
  } else if (source.evidence.some((item) => item.role === 'original')) {
    invalidSource('original evidence requires originalEvidenceId');
  }

  return {
    context: source.context,
    evidence: source.evidence.map(({ id, role, text }) => ({ id, role, text })),
  };
}

function sameScope(left: D.Scope, right: D.Scope): boolean {
  const signature = (scope: D.Scope) => ({
    actorId: scope.actorId,
    namespaceId: scope.namespaceId,
    placeId: scope.placeId,
    experienceId: scope.experienceId,
    peerId: scope.peerId,
    candidateSetId: scope.candidateSetId,
    dateRange: scope.dateRange === null ? null : {
      startAt: scope.dateRange.startAt,
      endAt: scope.dateRange.endAt,
      precision: scope.dateRange.precision,
      label: scope.dateRange.label,
      timeZone: scope.dateRange.timeZone,
    },
    entityVersions: sortedVersions(scope.entityVersions),
    grantVersions: sortedVersions(scope.grantVersions),
    settingsRevision: scope.settingsRevision,
  });
  return JSON.stringify(signature(left)) === JSON.stringify(signature(right));
}

function sortedVersions(versions: readonly D.VersionRef[]): readonly D.VersionRef[] {
  return [...versions].sort((left, right) =>
    left.type.localeCompare(right.type) || left.id.localeCompare(right.id) || left.revision - right.revision);
}

function invalidSource(message: string): never {
  throw new AiPromptTaskError('CONFIGURATION_INVALID', 'resolve', message, false);
}

function throwIfAborted(signal: AbortSignal, phase: 'resolve' | 'freshness'): void {
  if (signal.aborted) {
    throw new AiPromptTaskError('ABORTED', phase, 'Prompt task was canceled', false, { cause: signal.reason });
  }
}
