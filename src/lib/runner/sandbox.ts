import 'server-only';

import { LANGUAGES, type LanguageId, type RunnerLanguage } from '@/lib/runner/languages';

/**
 * Thin client for a Wandbox compiler service.
 *
 * Wandbox compiles and runs the snippet in its own sandbox, which is the part
 * you do not want to build yourself. The public instance is the default and
 * needs no key; set WANDBOX_URL to point at a self-hosted one.
 *
 * (This replaced the public Piston API, which became whitelist-only in
 * February 2026 and now refuses anonymous requests.)
 */

const DEFAULT_BASE = 'https://wandbox.org/api';

/** How long a single run may take before we give up on it, in milliseconds. */
const REQUEST_TIMEOUT_MS = 30_000;

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

interface WandboxCompiler {
  name: string;
  language: string;
  version?: string;
}

interface WandboxResponse {
  status?: string;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  program_output?: string;
  program_error?: string;
}

function baseUrl(): string {
  return (process.env.WANDBOX_URL ?? DEFAULT_BASE).replace(/\/+$/, '');
}

/* ------------------------------------------------------------ compilers --- */

interface CompilerCache {
  at: number;
  byLanguage: Map<LanguageId, WandboxCompiler>;
}

let compilerCache: CompilerCache | null = null;
const COMPILER_TTL_MS = 60 * 60 * 1000;

/**
 * Compiler names on Wandbox carry their version ("gcc-13.2.0"), so pinning one
 * guarantees it goes stale. Instead we ask the instance what it has and pick
 * the best match per language, caching the answer for an hour.
 *
 * Wandbox lists newest first, so "the first entry that is not a nightly build"
 * is the current stable release.
 */
async function loadCompilers(): Promise<Map<LanguageId, WandboxCompiler>> {
  if (compilerCache && Date.now() - compilerCache.at < COMPILER_TTL_MS) {
    return compilerCache.byLanguage;
  }

  const res = await fetch(`${baseUrl()}/list.json`, {
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`The compiler service answered with HTTP ${res.status}.`);

  const all = (await res.json()) as WandboxCompiler[];
  const byLanguage = new Map<LanguageId, WandboxCompiler>();

  for (const id of Object.keys(LANGUAGES) as LanguageId[]) {
    const language = LANGUAGES[id];
    const candidates = all.filter(
      (c) => c.language === language.wandboxLanguage && !/head|trunk|nightly/i.test(c.name),
    );
    const preferred =
      candidates.find((c) => language.compilerPrefix.test(c.name)) ?? candidates[0];
    if (preferred) byLanguage.set(id, preferred);
  }

  compilerCache = { at: Date.now(), byLanguage };
  return byLanguage;
}

/* -------------------------------------------------------------- execute --- */

function clip(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_OUTPUT_CHARS) return { text, truncated: false };
  return {
    text: `${text.slice(0, MAX_OUTPUT_CHARS)}\n\n… output truncated at ${MAX_OUTPUT_CHARS} characters.`,
    truncated: true,
  };
}

function blank(language: RunnerLanguage): Omit<RunResult, 'error'> {
  return {
    ran: false,
    stdout: '',
    stderr: '',
    compileOutput: '',
    exitCode: null,
    signal: null,
    timedOut: false,
    truncated: false,
    wallTimeMs: 0,
    language: language.label,
    version: '',
  };
}

export async function runCode({
  languageId,
  source,
  stdin,
}: {
  languageId: LanguageId;
  source: string;
  stdin: string;
}): Promise<RunResult> {
  const language = LANGUAGES[languageId];
  const started = Date.now();

  let compiler: WandboxCompiler | undefined;
  try {
    compiler = (await loadCompilers()).get(languageId);
  } catch {
    return {
      ...blank(language),
      wallTimeMs: Date.now() - started,
      error:
        'Could not reach the compiler service. Check your internet connection, or set WANDBOX_URL to a reachable Wandbox instance.',
    };
  }

  if (!compiler) {
    return {
      ...blank(language),
      wallTimeMs: Date.now() - started,
      error: `The compiler service does not currently offer a ${language.label} compiler.`,
    };
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/compile.json`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        compiler: compiler.name,
        code: source,
        stdin,
        'compiler-option-raw': language.compilerOptions,
        save: false,
      }),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'TimeoutError';
    return {
      ...blank(language),
      version: compiler.version ?? '',
      wallTimeMs: Date.now() - started,
      timedOut: aborted,
      error: aborted
        ? 'The compiler service did not answer in time. Try again in a moment.'
        : 'Could not reach the compiler service. Check your internet connection.',
    };
  }

  if (res.status === 429) {
    return {
      ...blank(language),
      version: compiler.version ?? '',
      wallTimeMs: Date.now() - started,
      error: 'The compiler service is rate-limiting us. Wait a few seconds and run again.',
    };
  }

  if (!res.ok) {
    return {
      ...blank(language),
      version: compiler.version ?? '',
      wallTimeMs: Date.now() - started,
      error: `The compiler service answered with HTTP ${res.status}.`,
    };
  }

  const body = (await res.json()) as WandboxResponse;

  const stdout = clip(body.program_output ?? '');
  const stderr = clip(body.program_error ?? '');
  // compiler_error holds the diagnostics; compiler_output is usually empty.
  const compileOutput = clip(body.compiler_error || body.compiler_output || '');

  const status = Number(body.status);
  const exitCode = Number.isFinite(status) ? status : null;

  return {
    ran: true,
    stdout: stdout.text,
    stderr: stderr.text,
    compileOutput: compileOutput.text,
    exitCode,
    signal: body.signal ?? null,
    // Wandbox kills an overlong run rather than letting it finish.
    timedOut: /killed|terminated/i.test(body.signal ?? ''),
    truncated: stdout.truncated || stderr.truncated || compileOutput.truncated,
    wallTimeMs: Date.now() - started,
    language: compiler.language,
    version: compiler.version ?? compiler.name,
  };
}

/* ------------------------------------------------------------- checking --- */

/**
 * Compare program output against an expected answer the way a human would:
 * trailing spaces on a line and blank lines at the end are not mistakes.
 * Everything else — including case and internal spacing — must match.
 */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

export function outputMatches(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
