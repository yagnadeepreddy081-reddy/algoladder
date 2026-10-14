export type DemoStatus = 'todo' | 'attempted' | 'solved';
export interface DemoEntry { status: DemoStatus; bookmark: boolean; note: string; revision: boolean }
export type DemoState = Record<string, DemoEntry>;
export const DEMO_STORAGE_KEY = 'algoladder-guest-v1';
export const emptyEntry = (): DemoEntry => ({ status: 'todo', bookmark: false, note: '', revision: false });

/** Browser storage is untrusted and may contain an older or damaged document. */
export function parseDemoState(raw: string | null, ids: ReadonlySet<string>): DemoState {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const result: DemoState = {};
    for (const [id, value] of Object.entries(data)) {
      if (!ids.has(id) || !value || typeof value !== 'object') continue;
      const entry = value as Partial<DemoEntry>;
      result[id] = {
        status: entry.status === 'solved' || entry.status === 'attempted' ? entry.status : 'todo',
        bookmark: entry.bookmark === true,
        revision: entry.revision === true,
        note: typeof entry.note === 'string' ? entry.note.slice(0, 5000) : '',
      };
    }
    return result;
  } catch { return {}; }
}
