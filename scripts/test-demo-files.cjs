// Code-only: inspect committed assets and submit their bytes through a stubbed browser adapter.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing TypeScript test harness pattern. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);
const samples = require('../lib/demo/file-samples.json');
const { extractionService } = require('../lib/ai/extraction.ts');
const { validFileSignature, extractionFileLimit } = require('../lib/ai/validation.ts');

(async () => {
  assert.equal(samples.length, 2); assert.equal(new Set(samples.map(s => s.id)).size, 2);
  let calls = 0;
  for (const sample of samples) {
    assert.match(sample.id, /^[a-z-]+$/);
    assert(sample.reviewTip && sample.summary);
    for (const [format, mime] of [['png', 'image/png'], ['pdf', 'application/pdf']]) {
      const bytes = fs.readFileSync(path.join(__dirname, '../public/samples', sample.id + '.' + format));
      assert(bytes.length > 100); assert(bytes.length < extractionFileLimit);
      assert(validFileSignature(bytes, mime));
      assert(!validFileSignature(bytes, format === 'png' ? 'application/pdf' : 'image/png'));
      global.fetch = async (url, options) => {
        calls++;
        assert.equal(url, '/api/extract'); assert.equal(options.method, 'POST');
        const uploaded = options.body.get('file');
        assert.equal(uploaded.type, mime); assert.equal(uploaded.name, sample.id + '.' + format);
        assert.deepEqual(Buffer.from(await uploaded.arrayBuffer()), bytes);
        assert.equal(options.body.get('text'), null); assert.equal(options.body.get('fields'), null);
        return Response.json({ provider: 'gemini', fields: {}, facts: {} });
      };
      const file = new File([bytes], sample.id + '.' + format, { type: mime });
      await extractionService.extract({ kind: 'file', file, document: { name: file.name, mime, origin: 'user' } });
    }
  }
  assert.equal(calls, 4);
  const detailed = samples.find(s => s.id === 'detailed-invoice');
  assert.equal(detailed.fields.length, 11);
  const incomplete = samples.find(s => s.id === 'incomplete-invoice');
  assert(!incomplete.fields.some(([label]) => /warranty|serial|expiry/i.test(label)));
  console.log('PASS: four downloadable assets, MIME/signature/size checks and exact binary upload through the normal extraction adapter. No rendering or real AI calls.');
})().catch(error => { console.error(error); process.exitCode = 1; });
