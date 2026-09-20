'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { buttonClass } from '@/components/ui/primitives';
import { saveCodeDraftAction } from '@/lib/actions/code';
import { USE_INPUT_EVENT } from '@/components/problems/statement';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_IDS,
  LANGUAGE_LIST,
  LANGUAGES,
  type LanguageId,
} from '@/lib/runner/languages';

/* Monaco is large and browser-only, so it never joins the server bundle. */
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[hsl(var(--surface-2))]">
      <p className="text-sm text-[hsl(var(--text-subtle))]">Loading the editor…</p>
    </div>
  ),
});

/* ---------------------------------------------------------------- types --- */

interface RunResponse {
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
  error?: string;
}

export interface PlaygroundDraft {
  source: string;
  stdin: string;
}

type DraftMap = Partial<Record<LanguageId, PlaygroundDraft>>;
type TextMap = Record<LanguageId, string>;

/* ----------------------------------------------------------- theme sync --- */

/** Follows the app's own `.dark` class rather than the OS preference. */
function useIsDark(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains('dark'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

/* ---------------------------------------------------------------- icons --- */

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/* ----------------------------------------------------------- component --- */

export function CodePlayground({
  problemId,
  drafts = {},
}: {
  problemId: string;
  drafts?: DraftMap;
}) {
  const isDark = useIsDark();

  const initialLanguage = useMemo<LanguageId>(() => {
    const used = LANGUAGE_IDS.find((id) => drafts[id]?.source?.trim());
    return used ?? DEFAULT_LANGUAGE;
  }, [drafts]);

  const [language, setLanguage] = useState<LanguageId>(initialLanguage);

  const [sources, setSources] = useState<TextMap>(() =>
    Object.fromEntries(
      LANGUAGE_IDS.map((id) => [id, drafts[id]?.source || LANGUAGES[id].template]),
    ) as TextMap,
  );

  const [stdins, setStdins] = useState<TextMap>(() =>
    Object.fromEntries(LANGUAGE_IDS.map((id) => [id, drafts[id]?.stdin ?? ''])) as TextMap,
  );

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [expanded, setExpanded] = useState(false);

  const source = sources[language];
  const stdin = stdins[language];

  /* ------------------------------------------------------------- run --- */

  const run = useCallback(async () => {
    if (running) return;
    if (!source.trim()) {
      setResult({
        ran: false,
        stdout: '',
        stderr: '',
        compileOutput: '',
        exitCode: null,
        signal: null,
        timedOut: false,
        truncated: false,
        wallTimeMs: 0,
        language,
        version: '',
        error: 'There is nothing to run yet — write some code first.',
      });
      return;
    }

    setRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ problemId, language, source, stdin }),
      });
      const body = (await res.json()) as RunResponse & { error?: string };
      setResult(body);
    } catch {
      setResult({
        ran: false,
        stdout: '',
        stderr: '',
        compileOutput: '',
        exitCode: null,
        signal: null,
        timedOut: false,
        truncated: false,
        wallTimeMs: 0,
        language,
        version: '',
        error: 'The request never made it out. Check that you are still online.',
      });
    } finally {
      setRunning(false);
    }
  }, [language, problemId, running, source, stdin]);

  /* Monaco's keybinding closes over `run`, so keep a live reference to it. */
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  /* ------------------------------------------- input from an example --- */

  /**
   * "Use this input" in the statement above drops that example straight into
   * the Input box, so trying an example never means retyping it.
   */
  useEffect(() => {
    const onUseInput = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (typeof value !== 'string') return;
      setStdins((prev) => ({ ...prev, [language]: value }));
      setResult(null);
    };
    window.addEventListener(USE_INPUT_EVENT, onUseInput);
    return () => window.removeEventListener(USE_INPUT_EVENT, onUseInput);
  }, [language]);

  /* ---------------------------------------------------------- autosave --- */

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setSaveState('saving');
    const timer = setTimeout(() => {
      saveCodeDraftAction({ problemId, language, source, stdin })
        .then((r) => setSaveState(r.ok ? 'saved' : 'error'))
        .catch(() => setSaveState('error'));
    }, 1_200);

    return () => clearTimeout(timer);
  }, [language, problemId, source, stdin]);

  /* ------------------------------------------------------------ resets --- */

  const resetToTemplate = useCallback(() => {
    setSources((prev) => ({ ...prev, [language]: LANGUAGES[language].template }));
    setResult(null);
  }, [language]);

  /* ------------------------------------------------------------ output --- */

  const verdict = useMemo(() => {
    if (!result) return null;
    if (result.error) return { label: 'Could not run', tone: 'bad' as const };
    if (result.compileOutput.trim()) return { label: 'Compile error', tone: 'bad' as const };
    if (result.timedOut) return { label: 'Timed out', tone: 'warn' as const };
    if (result.exitCode !== 0) {
      return { label: `Exited ${result.exitCode ?? '—'}`, tone: 'warn' as const };
    }
    return { label: 'Ran successfully', tone: 'good' as const };
  }, [result]);

  const editorHeight = expanded ? '70vh' : '380px';

  return (
    <section
      id="playground"
      className="overflow-hidden rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] scroll-mt-4"
      aria-labelledby="playground-heading"
    >
      {/* ------------------------------------------------------- toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-3">
        <div className="min-w-0">
          <h2
            id="playground-heading"
            className="text-sm font-semibold text-[hsl(var(--text))]"
          >
            Write and run your solution
          </h2>
          <p className="text-xs text-[hsl(var(--text-muted))]">
            Runs in a sandbox. Your draft saves as you type.
          </p>
        </div>

        <span className="flex-1" />

        {/* language tabs */}
        <div
          role="tablist"
          aria-label="Language"
          className="flex items-center gap-0.5 rounded-lg bg-[hsl(var(--surface-3))] p-0.5"
        >
          {LANGUAGE_LIST.map((lang) => (
            <button
              key={lang.id}
              type="button"
              role="tab"
              aria-selected={language === lang.id}
              onClick={() => {
                setLanguage(lang.id);
                setResult(null);
              }}
              className={clsx(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                language === lang.id
                  ? 'bg-[hsl(var(--surface))] text-[hsl(var(--text))] shadow-[var(--shadow-soft)]'
                  : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]',
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <button type="button" onClick={resetToTemplate} className={buttonClass('ghost', 'sm')}>
          Reset
        </button>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className={buttonClass('primary', 'sm')}
          data-testid="run-code"
        >
          {running ? <SpinnerIcon /> : <PlayIcon />}
          {running ? 'Running…' : 'Run'}
        </button>
      </div>

      {/* -------------------------------------------------------- editor */}
      <div style={{ height: editorHeight }} className="bg-[hsl(var(--surface-2))]">
        <MonacoEditor
          height="100%"
          language={LANGUAGES[language].monaco}
          theme={isDark ? 'vs-dark' : 'light'}
          value={source}
          onChange={(value) =>
            setSources((prev) => ({ ...prev, [language]: value ?? '' }))
          }
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
              void runRef.current();
            });
          }}
          options={{
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 14, bottom: 14 },
            smoothScrolling: true,
            renderLineHighlight: 'line',
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
            lineNumbersMinChars: 3,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* ------------------------------------------------- input / output */}
      <div className="grid border-t border-[hsl(var(--border))] md:grid-cols-2">
        {/* stdin */}
        <div className="flex flex-col border-b border-[hsl(var(--border))] md:border-r md:border-b-0">
          <label
            htmlFor="playground-stdin"
            className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-2 text-xs font-semibold tracking-wide text-[hsl(var(--text-muted))] uppercase"
          >
            Input
          </label>
          <textarea
            id="playground-stdin"
            value={stdin}
            onChange={(e) => setStdins((prev) => ({ ...prev, [language]: e.target.value }))}
            spellCheck={false}
            placeholder={'Whatever your program reads from standard input.\nOne value or line at a time.'}
            className="h-40 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-[hsl(var(--text))] placeholder:text-[hsl(var(--text-subtle))] focus:outline-none"
          />
        </div>

        {/* output */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-2">
            <span className="text-xs font-semibold tracking-wide text-[hsl(var(--text-muted))] uppercase">
              Output
            </span>
            {verdict ? (
              <span
                className={clsx(
                  'rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                  verdict.tone === 'good' &&
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
                  verdict.tone === 'warn' &&
                    'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300',
                  verdict.tone === 'bad' &&
                    'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
                )}
              >
                {verdict.label}
              </span>
            ) : null}
            <span className="flex-1" />
            {result && !result.error ? (
              <span className="tabular text-[11px] text-[hsl(var(--text-subtle))]">
                {result.wallTimeMs} ms
              </span>
            ) : null}
          </div>

          <div
            className="h-40 flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed"
            aria-live="polite"
          >
            {running ? (
              <p className="text-[hsl(var(--text-subtle))]">Compiling and running…</p>
            ) : !result ? (
              <p className="text-[hsl(var(--text-subtle))]">
                Press Run — or ⌘/Ctrl + Enter in the editor — to see the output here.
              </p>
            ) : result.error ? (
              <p className="whitespace-pre-wrap text-rose-600 dark:text-rose-400">{result.error}</p>
            ) : (
              <>
                {result.compileOutput.trim() ? (
                  <pre className="whitespace-pre-wrap text-rose-600 dark:text-rose-400">
                    {result.compileOutput}
                  </pre>
                ) : null}

                {result.stdout.trim() ? (
                  <pre className="whitespace-pre-wrap text-[hsl(var(--text))]">{result.stdout}</pre>
                ) : !result.compileOutput.trim() && !result.stderr.trim() ? (
                  <p className="text-[hsl(var(--text-subtle))]">
                    The program ran and printed nothing.
                  </p>
                ) : null}

                {result.stderr.trim() ? (
                  <pre className="mt-2 whitespace-pre-wrap text-rose-600 dark:text-rose-400">
                    {result.stderr}
                  </pre>
                ) : null}

                {result.timedOut ? (
                  <p className="mt-2 text-amber-700 dark:text-amber-400">
                    The sandbox stopped your program for running too long — look for a loop that
                    never ends.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- footer */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-2 text-[11px] text-[hsl(var(--text-subtle))]">
        <span>
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Draft saved'
              : saveState === 'error'
                ? 'Could not save your draft'
                : 'Drafts are kept per language'}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-medium text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]"
        >
          {expanded ? 'Shrink editor' : 'Expand editor'}
        </button>
      </div>
    </section>
  );
}
