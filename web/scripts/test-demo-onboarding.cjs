// Code-only orchestration tests. Hook primitives and AI are stubbed: no React/DOM rendering.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing dependency-free TypeScript test harness pattern. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const originalLoad = Module._load;
const slots = []; let cursor = 0, extractionCalls = 0, shouldFail = false;
let store;
const fakeReact = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  },
  useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
  useEffect() { cursor++; },
};
Module._load = function(name, ...args) {
  if (name === 'react') return fakeReact;
  if (name === '@/components/mock-provider') return { useMock: () => ({
    createItem: (fields, documents, id) => store.create(id, fields, documents), keepUrl: () => {},
  }) };
  if (name === '@/lib/ai/extraction') return { extractionService: { extract: async () => {
    extractionCalls++;
    if (shouldFail) throw new Error('Synthetic analysis failure');
    const { fieldLabels } = require('../lib/mock-data.ts');
    const fields = Object.fromEntries(Object.keys(fieldLabels).map(key => [key, '']));
    fields.name = 'Stubbed AI proposal'; fields.brand = 'Demo brand';
    return { fields, provider: 'gemini', facts: Object.fromEntries(Object.keys(fieldLabels).map(key => [key, { source: 'Test source', confidence: 'unknown' }])) };
  } } };
  if (name.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '..', name.slice(2)), ...args);
  return originalLoad.call(this, name, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);
const { demoSamples, findDemoSample, purchaseTextSource } = require('../lib/demo/samples.ts');
const { documentCopy } = require('../lib/document-copy.ts');
const { createMemoryItemRepository } = require('../lib/items/repository.ts');
const { useAddItem } = require('../hooks/use-add-item.ts');
const { extractionService } = require('../lib/ai/extraction.ts');
const readHook = () => { cursor = 0; return useAddItem(); };

(async () => {
  store = createMemoryItemRepository();
  const initialCount = store.list().length;
  let hook = readHook();
  for (const sample of demoSamples) {
    assert.match(sample.text, /synthetic/i); assert(sample.reviewTip);
    hook.useSample(sample.id); hook = readHook();
    assert.equal(hook.tab, 'text'); assert.equal(hook.text, sample.text);
    assert.equal(hook.source.origin, 'sample'); assert.equal(hook.selectedSample.id, sample.id);
    assert.equal(hook.consent, false); assert.equal(hook.step, 'source');
    assert.equal(findDemoSample(sample.text).id, sample.id);
  }
  assert.equal(extractionCalls, 0); assert.equal(store.list().length, initialCount);
  assert(!/warranty|serial|expiry/i.test(demoSamples.find(s => s.id === 'missing').text));
  assert.match(demoSamples.find(s => s.id === 'prompt').text, /today.*six-month warranty/);
  await hook.analyze(); hook = readHook(); assert.equal(extractionCalls, 0); assert.match(hook.error, /processing notice/);
  hook.setText('My actual purchase description'); hook = readHook();
  assert.equal(hook.selectedSample, undefined); assert.equal(hook.source.origin, 'user');
  assert(!documentCopy(hook.source).label.includes('Synthetic'));
  hook.useSample('missing'); hook = readHook(); hook.setConsent(true); hook = readHook();
  shouldFail = true; await hook.analyze(); hook = readHook();
  assert.equal(hook.step, 'source'); assert.equal(hook.selectedSample.id, 'missing');
  shouldFail = false; await hook.analyze(); hook = readHook();
  assert.equal(hook.step, 'review'); assert.equal(store.list().length, initialCount);
  hook.editField('name', 'My corrected headphones'); hook.editField('brand', ''); hook = readHook();
  assert.equal(hook.fieldHint('name'), 'Edited by you'); assert.match(hook.fieldHint('brand'), /Cleared by you/);
  const callsBeforeBack = extractionCalls;
  hook.backToSource(); hook = readHook(); await hook.analyze(); hook = readHook();
  assert.equal(extractionCalls, callsBeforeBack); assert.equal(hook.fields.name, 'My corrected headphones');
  hook.setConfirmed(true); hook = readHook(); await hook.save({ preventDefault() {} }); hook = readHook();
  assert.equal(hook.step, 'created'); const firstId = hook.createdId;
  assert.equal(store.list().find(i => i.id === firstId).name, 'My corrected headphones');
  assert.equal(store.list().find(i => i.id === firstId).brand, '');
  hook.startAnother(); hook = readHook();
  assert.equal(hook.step, 'source'); assert.equal(hook.consent, false); assert.equal(hook.confirmed, false);
  assert.equal(hook.source, undefined); assert.equal(hook.text, ''); assert.equal(hook.draft, null);
  assert.equal(hook.createdId, ''); assert.equal(store.list().length, initialCount + 1);
  hook.enterManually(); hook = readHook(); assert.equal(hook.source.origin, 'manual');
  hook.editField('name', 'Second manual item'); hook.setConfirmed(true); hook = readHook();
  await hook.save({ preventDefault() {} }); hook = readHook();
  assert.notEqual(hook.createdId, firstId); assert.equal(store.list().length, initialCount + 2);
  assert.match(documentCopy(hook.source).description, /No supporting source/);
  assert(!documentCopy({ name: 'receipt.png', url: 'blob:synthetic' }).description.includes('has not been sent'));

  // Verify the real browser adapter submits each sample as input, never as a fixture result.
  let requests = 0;
  global.fetch = async (url, options) => {
    requests++; assert.equal(url, '/api/extract'); assert.equal(options.method, 'POST');
    assert.equal(options.body.get('text'), demoSamples[requests - 1].text);
    assert.equal(options.body.get('consent'), 'yes'); assert.equal(options.body.get('file'), null);
    assert.equal(options.body.get('fields'), null);
    return Response.json({ provider: 'gemini', fields: { name: 'Stubbed server result' }, facts: {} });
  };
  for (const sample of demoSamples) assert.equal((await extractionService.extract(purchaseTextSource(sample.text))).provider, 'gemini');
  assert.equal(requests, 3);
  console.log('PASS: sample selection without calls, consent, source retention, edited/cleared hints, confirmation, second intake, document labels and real adapter routing. AI and hook primitives stubbed; no rendering or paid calls.');
})().catch(error => { console.error(error); process.exitCode = 1; });
