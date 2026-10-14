import type { RunResult } from './sandbox';

/** A matching output is insufficient if the program crashed or output was clipped. */
export function executionSucceeded(result: RunResult): boolean {
  return result.ran && !result.error && !result.timedOut && !result.truncated
    && result.exitCode === 0 && !result.signal;
}
