import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({user:vi.fn(),execute:vi.fn(),cases:vi.fn(),run:vi.fn()}));
vi.mock('@/lib/auth/session', () => ({ getApiUser:mocks.user }));
vi.mock('@/lib/db', () => ({ execute:mocks.execute }));
vi.mock('@/lib/data/test-cases', () => ({ getTestCases:mocks.cases }));
vi.mock('@/lib/runner/sandbox', () => ({ runCode:mocks.run,outputMatches:(a:string,b:string)=>a===b }));
import { POST } from '@/app/api/run/route';

const good = {ran:true,stdout:'42',stderr:'',compileOutput:'',exitCode:0,signal:null,timedOut:false,truncated:false,wallTimeMs:10,language:'Python',version:'3'};
let n = 0;
function request() { return new Request('https://example.test/api/run', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'submit',problemId:'al-0001',language:'python',source:'print(42)'})}); }
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({id:`test-${++n}`});mocks.execute.mockResolvedValue(1);mocks.cases.mockResolvedValue([{input:'secret input',expected:'42',hidden:true}]);mocks.run.mockResolvedValue(good); });
describe('submission grading boundary', () => {
  it('does not accept matching output from a crashed program', async () => {mocks.run.mockResolvedValue({...good,exitCode:1});const body=await (await POST(request())).json();expect(body.passed).toBe(0);});
  it('does not mistake a compiler warning for a compile failure', async () => {mocks.run.mockResolvedValue({...good,compileOutput:'warning: unused variable'});const body=await (await POST(request())).json();expect(body.passed).toBe(1);});
  it('never exposes hidden-case output or diagnostics', async () => {mocks.run.mockResolvedValue({...good,stderr:'secret input'});const body=await (await POST(request())).json();expect(body.cases[0]).toMatchObject({actual:'',stderr:''});expect(body.cases[0].input).toBeUndefined();expect(body.cases[0].expected).toBeUndefined();});
  it('returns service failures without recording a wrong answer', async () => {mocks.cases.mockResolvedValue([{input:'a',expected:'42'},{input:'b',expected:'42'}]);mocks.run.mockResolvedValueOnce(good).mockResolvedValueOnce({...good,ran:false,error:'Compiler unavailable'});const response=await POST(request());expect(response.status).toBe(502);expect(mocks.execute).not.toHaveBeenCalled();});
});
