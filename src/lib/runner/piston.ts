import 'server-only';

import { LANGUAGES, type RunnerLanguage } from '@/lib/runner/languages';

/**
 * Thin client for a Piston execution engine.
 *
 * Piston runs untrusted code in a throwaway sandbox with its own CPU, memory
 * and process limits, which is precisely the part you do not want to build
 * yourself. The public instance at emkc.org is the default; set PISTON_URL to
 * point at a self-hosted one when the rate limit starts to bite.
 */

const DEFAULT_BASE = 'https://emkc.org/api/v2/piston';

/** How long a single run may take before we give up on it, in milliseconds. */
const REQUEST_TIMEOUT_MS = 30_000;

/** Piston's own per-run limits. */
const COMPILE_TIMEOUT_MS = 10_000;
const RUN_TIMEOUT_MS = 8_000;

/** Never hand more than this much text back to the browser. */
const MAX_OUTPUT_CHARS = 20_000;

export interface RunResult {
  /** True when the sandbox actually ran the program, whatever it then did. */
  ran: boolean;
  stdout: string;
  stderr: string;
  compileOutput: string;
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  truncated: boolean;
  wallTimeMs: number;
  language: string;
  version: string;
  /** Set only when the run could not be attempted at all. */
  error?: string;
}

interface PistonStage {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number | null;
  signal?: string | null;
}

interface PistonResponse {
  language?: string;
  version?: string;
  run?: PistonStage;
  compile?: PistonStage;
  message?: string;
}

function baseUrl(): string {
  return (process.env.PISTON_URL ?? DEFAULT_BASE).replace(/\/+$/, '');
}

/* ------------------------------------------------------------- versions --- */

interface RuntimeCache {
  at: number;
  versions: Map<string, string>;
}

let runtimeCache: RuntimeCache | null = null;
const RUNTIME_TTL_MS = 60 * 60 * 1000;

/**
 * Piston wants an exact version string. Rather than pinning versions that go
 * stale, ask the instance what it has and cache the answer for an hour. If the
 * list cannot be fetched we fall back to the pinned version in languages.ts.
 */
async function resolveVersion(language: RunnerLanguage): Promise<string> {
  const fresh = runtimeCache && Date.now() - runtimeCache.at < RUNTIME_TTL_MS;

  if (!fresh) {
    try {
      const res = await fetch(`${baseUrl()}/runtimes`, {
        signal: AbortSignal.timeout(8_000),
        cache: 'no-store',
      });
      if (res.ok) {
        const list = (await res.json()) as Array<{
          language: string;
          version: string;
          aliases?: string[];
        }>;
        const versions = new Map<string, string>();
        for (const rt of list) {
          if (!versions.has(rt.language)) versions.set(rt.language, rt.version);
          for (const alias of rt.aliases ?? []) {
            if (!versions.has(alias)) versions.set(alias, rt.version);
          }
        }
        runtimeCache = { at: Date.now(), versions };
      }
    } catch {
      // Offline, blocked or slow — the pinned fallback below is good enough.
    }
  }

  return runtimeCache?.versions.get(language.pistonLanguage) ?? language.pistonVersion;
}

/* -------------------------------------------------------------- execute --- */

function clip(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_OUTPUT_CHARS) return { text, truncated: false };
  return {
    text: `${text.slice(0, MAX_OUTPUT_CHARS)}\n\n… output truncated at ${MAX_OUTPUT_CHARS} characters.`,
    truncated: true,
  };
}

export async function runCode({
  languageId,
  source,
  stdin,
}: {
  languageId: keyof typeof LANGUAGES;
  source: string;
  stdin: string;
}): Promise<RunResult> {
  const language = LANGUAGES[languageId];
  const started = Date.now();

  const empty: Omit<RunResult, 'error'> = {
    ran: false,
    stdout: '',
    stderr: '',
    compileOutput: '',
    exitCode: null,
    signal: null,
    timedOut: false,
    truncated: false,
    wallTimeMs: 0,
    language: language.pistonLanguage,
    version: language.pistonVersion,
  };

  let version: string;
  try {
    version = await resolveVersion(language);
  } catch {
    version = language.pistonVersion;
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/execute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        language: language.pistonLanguage,
        version,
        files: [{ name: language.filename, content: source }],
        stdin,
        compile_timeout: COMPILE_TIMEOUT_MS,
        run_timeout: RUN_TIMEOUT_MS,
      }),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'TimeoutError';
    return {
      ...empty,
      version,
      wallTimeMs: Date.now() - started,
      timedOut: aborted,
      error: aborted
        ? 'The execution service did not answer in time. Try again in a moment.'
        : 'Could not reach the execution service. Check your internet connection, or set PISTON_URL to a reachable Piston instance.',
    };
  }

  if (res.status === 429) {
    return {
      ...empty,
      version,
      wallTimeMs: Date.now() - started,
      error: 'The execution service is rate-limiting us. Wait a few seconds and run again.',
    };
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as PistonResponse;
      detail = body.message ?? '';
    } catch {
      /* body was not JSON — the status code is all we have */
    }
    return {
      ...empty,
      version,
      wallTimeMs: Date.now() - started,
      error: detail || `The execution service answered with HTTP ${res.status}.`,
    };
  }

  const body = (await res.json()) as PistonResponse;
  const run = body.run ?? {};
  const compile = body.compile ?? {};

  const stdout = clip(run.stdout ?? '');
  const stderr = clip(run.stderr ?? '');
  const compileOutput = clip(compile.stderr || compile.output || '');

  return {
    ran: true,
    stdout: stdout.text,
    stderr: stderr.text,
    compileOutput: compileOutput.text,
    exitCode: run.code ?? null,
    signal: run.signal ?? null,
    // Piston kills a run that overstays with SIGKILL and no exit code.
    timedOut: run.signal === 'SIGKILL' && (run.code ?? null) === null,
    truncated: stdout.truncated || stderr.truncated || compileOutput.truncated,
    wallTimeMs: Date.now() - started,
    language: body.language ?? language.pistonLanguage,
    version: body.version ?? version,
  };
}
