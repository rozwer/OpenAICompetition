/** Trusted build-time task adapters. User uploads cannot register executable entries. */
import type * as D from './domain';
import type { ServiceLookup, ServiceId } from './entries';
import type { AiPromptTaskRegistration } from './ai-prompt-task';
export type AiTaskId=D.AiInput['task'];
export type AiTaskRunner<K extends AiTaskId>=(input:Extract<D.AiInput,{task:K}>['input'],scope:D.Scope,signal:AbortSignal)=>Promise<Extract<D.AiOutput,{task:K}>['output']>;
export type AiTaskEntry<K extends AiTaskId=AiTaskId>={[S in K]:{
  kind:'ai-task';id:string;task:S;requiresServices:readonly ServiceId[];
  /** Optional AI-011 prompt path. Absence preserves the v2.1 runner behavior. */
  prompt?:AiPromptTaskRegistration<S>;
  create(services:ServiceLookup):AiTaskRunner<S>;
}}[K];
