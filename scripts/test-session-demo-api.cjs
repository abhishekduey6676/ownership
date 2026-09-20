// Invoke route handlers directly with stubbed external services. No paid calls or rendering.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing Node/TypeScript test harness pattern. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
let identityCalls = 0, providerCalls = 0, verified = true;
let quotaCalls = 0, quotaError = null;
let quotaResult = { allowed: true, reason: 'allowed', retry_after_seconds: 0 };
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === 'server-only') return {};
  if (name === '@/lib/supabase/server') return { sessionClient: async allowNew => {
    assert.equal(allowNew, true); identityCalls++;
    return { client: {
      auth: { getUser: async () => ({ data: { user: verified ? { id: 'quota-identity' } : null }, error: null }) },
      rpc: (...arguments_) => {
        assert.deepEqual(arguments_, ['reserve_demo_analysis']); quotaCalls++;
        return { abortSignal: async signal => { assert(signal instanceof AbortSignal); return { data: quotaResult, error: quotaError }; } };
      },
    } };
  } };
  if (name === '@/lib/ai/gemini') return { extractWithGemini: async input => { providerCalls++; assert.equal(input.text, 'Synthetic watch'); return { provider: 'gemini', fields: { name: 'Watch' } }; } };
  if (name.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '..', name.slice(2)), ...args);
  return originalLoad.call(this, name, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);
global.fetch = () => { throw new Error('External calls must be stubbed in this test'); };
const { NextRequest } = require('next/server');
const items = require('../app/api/items/route.ts');
const extraction = require('../app/api/extract/route.ts');
const request = (origin = 'http://localhost:5173', consent = true) => {
  const body = new FormData(); body.set('text', 'Synthetic watch'); body.set('timeZone', 'Asia/Kolkata');
  if (consent) body.set('consent', 'yes');
  return new NextRequest('http://localhost:5173/api/extract', { method: 'POST', headers: { Origin: origin }, body });
};
(async () => {
  for (const method of ['GET', 'POST', 'PATCH']) {
    const response = await items[method](); assert.equal(response.status, 410);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal(identityCalls, 0); assert.equal(providerCalls, 0);
  process.env.NODE_ENV = 'development'; process.env.GEMINI_API_KEY = 'synthetic-unit-key';
  assert.equal((await extraction.POST(request('https://example.invalid'))).status, 403);
  assert.equal((await extraction.POST(request(undefined, false))).status, 400);
  assert.equal(identityCalls, 0); // Rejected inputs do not create anonymous users.
  const response = await extraction.POST(request());
  assert.equal(response.status, 200); assert.equal((await response.json()).fields.name, 'Watch');
  assert.equal(identityCalls, 1); assert.equal(providerCalls, 1);
  assert.equal(quotaCalls, 1);
  for (const reason of ['visitor_limit', 'demo_limit']) {
    quotaResult = { allowed: false, reason, retry_after_seconds: 120 };
    const limited = await extraction.POST(request());
    assert.equal(limited.status, 429); assert.equal(limited.headers.get('retry-after'), '120');
    assert.equal(limited.headers.get('cache-control'), 'no-store');
    assert.match((await limited.json()).error, /manually/); assert.equal(providerCalls, 1);
  }
  for (const invalid of [null, {}, { allowed: true, reason: 'demo_limit', retry_after_seconds: 0 },
    { allowed: false, reason: 'visitor_limit', retry_after_seconds: -1 },
    { allowed: true, reason: 'allowed', retry_after_seconds: 0, unexpected: 'data' }]) {
    quotaResult = invalid;
    assert.equal((await extraction.POST(request())).status, 503);
    assert.equal(providerCalls, 1);
  }
  quotaError = { message: 'private database error must not leak' };
  const unavailable = await extraction.POST(request()); assert.equal(unavailable.status, 503);
  assert(!JSON.stringify(await unavailable.json()).includes(quotaError.message));
  assert.equal(providerCalls, 1);
  quotaError = null; quotaResult = { allowed: true, reason: 'allowed', retry_after_seconds: 0 };
  // All failure paths release the process-local concurrency slot.
  assert.equal((await extraction.POST(request())).status, 200); assert.equal(providerCalls, 2);
  const previousQuotaCalls = quotaCalls;
  verified = false;
  assert.equal((await extraction.POST(request())).status, 401);
  assert.equal(providerCalls, 2); assert.equal(quotaCalls, previousQuotaCalls);
  process.env.NODE_ENV = 'production';
  assert.equal((await extraction.POST(request())).status, 503);
  assert.equal(providerCalls, 2); assert.equal(quotaCalls, previousQuotaCalls);
  console.log('PASS: shared quota required before AI; 429/retry/manual path; fail-closed unavailable or malformed quota; no raw error leaks; slots released; verified identity and production gate. No rendering or external calls.');
})().catch(error => { console.error(error); process.exitCode = 1; });
