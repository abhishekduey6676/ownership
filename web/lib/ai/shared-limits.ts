import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { AnalysisLimitError } from './usage-errors';

const resultSchema = z.object({
  allowed: z.boolean(),
  reason: z.enum(['allowed', 'visitor_limit', 'demo_limit']),
  retry_after_seconds: z.number().int().min(0).max(86400),
}).strict().refine(value => value.allowed
  ? value.reason === 'allowed' && value.retry_after_seconds === 0
  : value.reason !== 'allowed' && value.retry_after_seconds > 0);

/** Atomic server-side reservation. No source, item, caller ID or client-defined limits cross this boundary. */
export async function reserveSharedAnalysis(client: Pick<SupabaseClient, 'rpc'>, signal?: AbortSignal) {
  let result: unknown;
  try {
    const timeout = AbortSignal.any([AbortSignal.timeout(5000), ...(signal ? [signal] : [])]);
    const { data, error } = await client.rpc('reserve_demo_analysis').abortSignal(timeout);
    if (error) throw new Error('Counter unavailable');
    result = data;
  } catch {
    // No fallback or retry: an uncertain reservation may already have consumed an attempt.
    throw new Error('Analysis usage checks are unavailable. Try later or enter details manually.');
  }
  const parsed = resultSchema.safeParse(result);
  if (!parsed.success) throw new Error('Analysis usage checks are unavailable. Try later or enter details manually.');
  if (!parsed.data.allowed) {
    const message = parsed.data.reason === 'visitor_limit'
      ? 'Your 5 daily analysis attempts are used. Limits reset at 00:00 UTC. You can still enter details manually.'
      : 'The demo’s 50 daily analysis attempts are used. Limits reset at 00:00 UTC. You can still enter details manually.';
    throw new AnalysisLimitError(message, parsed.data.retry_after_seconds);
  }
}
