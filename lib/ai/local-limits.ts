import { AnalysisLimitError } from './usage-errors';

/** Extra per-process concurrency guard. Daily budgets are enforced by shared-limits, never here. */
const state = { active: new Set<string>() };
export function reserveExtraction(ownerId: string) {
  if (state.active.has(ownerId) || state.active.size >= 2) throw new AnalysisLimitError('Analysis is already running. Wait for it to finish or enter details manually.', 5);
  state.active.add(ownerId);
  return () => { state.active.delete(ownerId); };
}
