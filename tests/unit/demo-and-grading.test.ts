import { describe, expect, it } from 'vitest';
import { parseDemoState } from '@/lib/demo-state';
import { safeRedirect } from '@/lib/auth/redirect';
import { executionSucceeded } from '@/lib/runner/grading';
import type { RunResult } from '@/lib/runner/sandbox';

describe('guest progress recovery', () => {
  const ids = new Set(['al-0001']);
  it('recovers corrupted storage without crashing', () => {
    for (const raw of [null, '{', 'null', '[]', '42']) expect(parseDemoState(raw, ids)).toEqual({});
  });
  it('keeps valid progress but drops unknown IDs and validates fields', () => {
    expect(parseDemoState(JSON.stringify({ 'al-0001': {status:'solved',bookmark:true,note:'Remember edge cases',revision:true}, unknown:{status:'solved'} }),ids)).toEqual({ 'al-0001': {status:'solved',bookmark:true,note:'Remember edge cases',revision:true} });
    expect(parseDemoState('{"al-0001":{"status":"admin","bookmark":"true","note":99}}',ids)['al-0001']).toEqual({status:'todo',bookmark:false,note:'',revision:false});
  });
  it('bounds note size', () => expect(parseDemoState(JSON.stringify({'al-0001':{note:'x'.repeat(6000)}}),ids)['al-0001'].note).toHaveLength(5000));
});

describe('safe login redirects', () => {
  it.each(['https://evil.test','//evil.test','/\\evil.test','/\n/evil.test',null])('rejects %s', value => expect(safeRedirect(value)).toBe('/dashboard'));
  it('preserves a local path and its query', () => expect(safeRedirect('/problems/two-sum?tab=notes')).toBe('/problems/two-sum?tab=notes'));
});

describe('grading execution results', () => {
  const good: RunResult = {ran:true,stdout:'42',stderr:'',compileOutput:'',exitCode:0,signal:null,timedOut:false,truncated:false,wallTimeMs:100,language:'C++',version:'13'};
  it('accepts successful execution even with compiler warnings', () => expect(executionSucceeded({...good,compileOutput:'warning: unused variable'})).toBe(true));
  it.each([{exitCode:1},{exitCode:null},{signal:'SIGSEGV'},{timedOut:true},{truncated:true},{ran:false},{error:'service unavailable'}])('rejects a failed execution %j', patch => expect(executionSucceeded({...good,...patch})).toBe(false));
});
