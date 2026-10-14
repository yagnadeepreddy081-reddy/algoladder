'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wordmark } from '@/components/brand';
import { ThemeToggle } from '@/components/theme';
import { DEMO_STORAGE_KEY, emptyEntry, parseDemoState, type DemoEntry, type DemoState } from '@/lib/demo-state';
import styles from './guest-demo.module.css';

interface Problem { id: string; title: string; topicSlug: string; topicName: string; difficulty: string;
  overallNo: number; externalUrl: string; tags: string[]; description: string; hints: string[];
  timeComplexity: string; spaceComplexity: string }
type View = 'roadmap' | 'bookmarks' | 'revision' | 'notes';
const PAGE_SIZE = 20;

export function GuestDemo({ problems, topics }: { problems: Problem[]; topics: {slug: string; name: string}[] }) {
  const [state, setState] = useState<DemoState>({});
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState('');
  const [view, setView] = useState<View>('roadmap');
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const closeProblem = useCallback(() => setSelected(null), []);
  const ids = useMemo(() => new Set(problems.map(p => p.id)), [problems]);

  useEffect(() => {
    try { setState(parseDemoState(localStorage.getItem(DEMO_STORAGE_KEY), ids)); }
    catch { setStorageWarning('Browser storage is unavailable. Changes will last for this visit only.'); }
    setReady(true);
  }, [ids]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); }
    catch { setStorageWarning('Your browser could not save these changes. Export your progress before leaving.'); }
  }, [state, ready]);
  useEffect(() => { setPage(1); }, [view, search, topic, difficulty, status]);

  const entry = (id: string) => state[id] ?? emptyEntry();
  function update(id: string, patch: Partial<DemoEntry>) {
    setState(prev => ({ ...prev, [id]: { ...(prev[id] ?? emptyEntry()), ...patch } }));
  }
  const solved = problems.filter(p => entry(p.id).status === 'solved').length;
  const attempted = problems.filter(p => entry(p.id).status === 'attempted').length;
  const bookmarked = problems.filter(p => entry(p.id).bookmark).length;
  const filtered = problems.filter(p => {
    const e = entry(p.id);
    return (!topic || p.topicSlug === topic) && (!difficulty || p.difficulty === difficulty)
      && (!status || e.status === status)
      && (!search || `${p.title} ${p.topicName} ${p.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase().trim()))
      && (view !== 'bookmarks' || e.bookmark) && (view !== 'revision' || e.revision)
      && (view !== 'notes' || e.note.trim());
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const current = problems.find(p => p.id === selected);
  const next = problems.find(p => entry(p.id).status !== 'solved');

  function exportProgress() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), progress: state }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'algoladder-guest-progress.json'; a.click(); URL.revokeObjectURL(url);
  }

  return <div className={styles.shell}>
    <header className={styles.header}><Wordmark /><div className={styles.headerActions}><ThemeToggle compact /><Link href="/signup">Create account ↗</Link></div></header>
    <main id="main" className={styles.main}>
      <div className={styles.banner}><span className={styles.dot} />Guest workspace <span>Progress stays in this browser · accounts use separate cloud storage</span></div>
      <section className={styles.hero}><div><p className={styles.eyebrow}>YOUR NEXT CHAPTER</p><h1>Small steps.<br /><em>Stronger problem solving.</em></h1><p>One thoughtful problem at a time. Follow the roadmap, keep what you learn, and return to the questions that challenge you.</p></div><div className={styles.next}><span className={styles.eyebrow}>NEXT ON YOUR LADDER</span><h2>{next?.title ?? 'You climbed the whole ladder!'}</h2><p>{next ? `${next.topicName} · ${next.difficulty}` : 'Revisit your revision queue to stay sharp.'}</p>{next && <button onClick={() => { setSelected(next.id); setHints(0); }}>Explore problem →</button>}</div></section>
      <section aria-label="Your progress" className={styles.stats}>
        {[['Solved', solved], ['Attempted', attempted], ['Bookmarked', bookmarked], ['Total problems', problems.length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{ready ? value : '—'}</strong></div>)}
      </section>
      <div className={styles.progress}><div><span>Roadmap completion</span><strong>{Math.round(solved / problems.length * 100)}%</strong></div><progress max={problems.length} value={solved} /></div>
      {storageWarning && <p role="status" className={styles.warning}>{storageWarning}</p>}
      <nav className={styles.mobileTabs} aria-label="Guest workspace views">{(['roadmap', 'bookmarks', 'revision', 'notes'] as View[]).map(v => <button key={v} aria-current={view === v ? 'page' : undefined} onClick={() => setView(v)}>{v === 'roadmap' ? 'Roadmap' : v === 'bookmarks' ? 'Bookmarks' : v === 'revision' ? 'Revision' : 'Notes'}</button>)}</nav>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}><p className={styles.eyebrow}>YOUR WORKSPACE</p><nav aria-label="Workspace views">{(['roadmap', 'bookmarks', 'revision', 'notes'] as View[]).map(v => <button key={v} aria-current={view === v ? 'page' : undefined} onClick={() => setView(v)}>{({roadmap:'▤ Roadmap', bookmarks:'☆ Bookmarks', revision:'↻ Revision queue', notes:'✎ My notes'})[v]}</button>)}</nav><p className={styles.eyebrow}>TOPIC PROGRESS</p>{topics.map(t => { const list = problems.filter(p => p.topicSlug === t.slug); const count = list.filter(p => entry(p.id).status === 'solved').length; return <button className={styles.topicButton} key={t.slug} onClick={() => {setTopic(t.slug); setView('roadmap');}}><span>{t.name}</span><small>{count}/{list.length}</small><progress max={list.length} value={count} /></button>; })}</aside>
        <section className={styles.catalogue}><div className={styles.sectionTitle}><div><h2>{({roadmap:'The roadmap', bookmarks:'Your bookmarks', revision:'Revision queue', notes:'Your notes'})[view]}</h2><p>{filtered.length} problems · ordered from foundations to advanced patterns</p></div><button className={styles.secondary} onClick={exportProgress}>Export progress ↓</button></div>
          <div className={styles.filters}><label className={styles.search}>Search problems<input type="search" placeholder="Search titles, topics or tags…" value={search} onChange={e => setSearch(e.target.value)} /></label><label>Topic<select value={topic} onChange={e => setTopic(e.target.value)}><option value="">All topics</option>{topics.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></label><label>Difficulty<select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="">All levels</option>{['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}</select></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="todo">To do</option><option value="attempted">Attempted</option><option value="solved">Solved</option></select></label></div>
          {!filtered.length && <div className={styles.empty}><h3>No problems here yet</h3><p>{view === 'roadmap' ? 'Try another search or clear your filters.' : 'Add problems from the roadmap to build this collection.'}</p><button onClick={() => {setView('roadmap');setSearch('');setTopic('');setDifficulty('');setStatus('');}}>Show all problems</button></div>}
          <ol className={styles.list}>{filtered.slice((currentPage - 1)*PAGE_SIZE, currentPage*PAGE_SIZE).map(p => {const e = entry(p.id); return <li key={p.id}><span className={styles.number}>{String(p.overallNo).padStart(3,'0')}</span><button className={styles.problemTitle} onClick={() => {setSelected(p.id);setHints(0);}}><strong>{p.title}</strong><small>{p.topicName}</small>{view === 'notes' && <small>{e.note.slice(0,100)}</small>}</button><span className={styles.difficulty} data-level={p.difficulty}>{p.difficulty}</span><label className={styles.statusLabel}><span className={styles.srOnly}>Status for {p.title}</span><select value={e.status} disabled={!ready} onChange={event => update(p.id, {status: event.target.value as DemoEntry['status']})}><option value="todo">To do</option><option value="attempted">Attempted</option><option value="solved">Solved ✓</option></select></label><button disabled={!ready} className={styles.bookmark} aria-label={`${e.bookmark?'Remove':'Add'} bookmark for ${p.title}`} aria-pressed={e.bookmark} onClick={() => update(p.id,{bookmark:!e.bookmark})}>{e.bookmark?'★':'☆'}</button></li>;})}</ol>
          <div className={styles.pagination}><button disabled={currentPage === 1} onClick={() => setPage(currentPage-1)}>← Previous</button><span>Page {currentPage} of {pages}</span><button disabled={currentPage === pages} onClick={() => setPage(currentPage+1)}>Next →</button></div>
        </section>
      </div>
      <footer className={styles.footer}>Built by Surasani Yagnadeep Reddy · Independent DSA study tracker <Link href="https://github.com/yagnadeepreddy081-reddy/algoladder" target="_blank" rel="noopener noreferrer">View source ↗</Link></footer>
    </main>
    {current && <div className={styles.overlay} onClick={e => {if (e.target === e.currentTarget) setSelected(null);}}><ProblemDialog problem={current} entry={entry(current.id)} hints={hints} revealHint={() => setHints(hints+1)} update={patch => update(current.id,patch)} close={closeProblem} /></div>}
  </div>;
}

function ProblemDialog({problem: p, entry: e, hints, revealHint, update, close}: {problem: Problem; entry: DemoEntry; hints: number; revealHint: () => void; update: (p: Partial<DemoEntry>) => void; close: () => void}) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.getElementById('guest-problem-dialog') as HTMLDialogElement;
    dialog.showModal();
    const onCancel = (event: Event) => { event.preventDefault(); close(); };
    dialog.addEventListener('cancel', onCancel);
    return () => { dialog.removeEventListener('cancel', onCancel); dialog.close(); previous?.focus(); };
  }, [close]);
  return <dialog id="guest-problem-dialog" className={styles.dialog} aria-labelledby="guest-problem-title"><button className={styles.close} onClick={close} aria-label="Close problem">×</button><p className={styles.eyebrow}>{p.topicName} · {p.difficulty} · #{p.overallNo}</p><h2 id="guest-problem-title">{p.title}</h2><p>{p.description}</p><div className={styles.tags}>{p.tags.map(t => <span key={t}>{t}</span>)}</div><a className={styles.primary} href={p.externalUrl} target="_blank" rel="noopener noreferrer">Solve on the original platform ↗</a><h3>Think through the pattern</h3>{p.hints.slice(0,hints).map((h,i) => <p key={i} className={styles.hint}>{h}</p>)}{hints < p.hints.length && <button className={styles.secondary} onClick={revealHint}>Reveal hint {hints+1} of {p.hints.length}</button>}<p className={styles.complexity}>Time {p.timeComplexity} · Space {p.spaceComplexity}</p><label className={styles.noteLabel}>Your notes<textarea maxLength={5000} value={e.note} placeholder="What did you learn? What should future-you remember?" onChange={event => update({note:event.target.value})} /></label><label className={styles.check}><input type="checkbox" checked={e.revision} onChange={event => update({revision:event.target.checked})} />Add to revision queue</label><button className={styles.primary} onClick={() => update({status:e.status === 'solved'?'todo':'solved'})}>{e.status === 'solved'?'Mark as to do':'Mark as solved ✓'}</button><p className={styles.localNote}>Guest notes and progress are saved in this browser. Use Export progress to keep a copy.</p></dialog>;
}
