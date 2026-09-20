// Metadata only: no rendering, network, storage or AI calls.
/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { EventEmitter } = require('node:events');
const { PDFDocument, PDFName, PDFNumber, PDFDict } = require('pdf-lib');
const load = Module._load;
let fakeWorker;
Module._load = function(name, ...args) {
  if (name === 'server-only') return {};
  if (name === 'node:worker_threads' && fakeWorker) return { Worker: fakeWorker };
  return load.call(this, name, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);
const { inspectUpload, UploadInspectionError } = require('../lib/ai/upload-inspection.ts');
const { uploadPolicy } = require('../lib/ai/upload-policy.ts');
const sample = fs.readFileSync(path.join(__dirname, '../public/samples/detailed-invoice.png'));
function png(width, height) {
  const bytes = Buffer.from(sample); bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20); return bytes;
}
function jpeg(width, height) {
  return Buffer.from([255,216,255,224,0,2,255,192,0,17,8,height>>8,height&255,width>>8,width&255,3,1,17,0,2,17,0,3,17,0,255,217]);
}
function webp(width, height) {
  const bytes = Buffer.alloc(30); bytes.write('RIFF'); bytes.writeUInt32LE(22,4); bytes.write('WEBPVP8X',8);
  bytes.writeUInt32LE(10,16); bytes.writeUIntLE(width-1,24,3); bytes.writeUIntLE(height-1,27,3); return bytes;
}
async function pdf(pages, compressed = true, tamper = false) {
  const document = await PDFDocument.create();
  for (let i = 0; i < pages; i++) document.addPage();
  if (tamper) document.catalog.Pages().set(PDFName.of('Count'), PDFNumber.of(1));
  return document.save({ useObjectStreams: compressed, addDefaultPage: false });
}
async function rejects(bytes, mime, message) {
  await assert.rejects(inspectUpload(bytes, mime), error => error instanceof UploadInspectionError && message.test(error.message));
}
(async () => {
  global.fetch = () => { throw new Error('No network permitted'); };
  for (const name of ['detailed-invoice', 'incomplete-invoice']) {
    for (const [extension, mime] of [['png','image/png'],['pdf','application/pdf']]) {
      await inspectUpload(fs.readFileSync(path.join(__dirname, '../public/samples', `${name}.${extension}`)), mime);
    }
  }
  for (const compressed of [true, false]) {
    await inspectUpload(await pdf(5, compressed), 'application/pdf');
    await rejects(await pdf(6, compressed), 'application/pdf', /5 pages/);
    await rejects(await pdf(6, compressed, true), 'application/pdf', /5 pages/);
  }
  await rejects(await pdf(0), 'application/pdf', /safely inspect/);
  const encrypted = await PDFDocument.create(); encrypted.addPage();
  encrypted.context.trailerInfo.Encrypt = encrypted.context.register(PDFDict.withContext(encrypted.context));
  await rejects(await encrypted.save(), 'application/pdf', /unencrypted/);
  await rejects(Buffer.from('%PDF-1.7\nprivate malformed document'), 'application/pdf', /safely inspect/);
  for (const [make, mime] of [[png,'image/png'],[jpeg,'image/jpeg'],[webp,'image/webp']]) {
    await inspectUpload(make(5000,4000), mime); // Exactly 20 megapixels.
    await inspectUpload(make(8192,1), mime);
    await rejects(make(5001,4000), mime, /20 megapixels/);
    await rejects(make(8193,1), mime, /8,192/);
    await rejects(make(1,8193), mime, /8,192/);
    await rejects(make(500,500).subarray(0,12), mime, /safely inspect/);
  }
  await rejects(png(0,100), 'image/png', /safely inspect/);
  await rejects(sample, 'image/jpeg', /valid JPG/);
  await rejects(Buffer.alloc(3 * 1024 * 1024 + 1), 'image/png', /3 MB/);
  await assert.rejects(inspectUpload(sample, 'image/png', AbortSignal.abort()), /cancelled/);

  // Exercise lifecycle failure paths deterministically without feeding a real decompression bomb.
  let lastWorker, terminated = 0, mode = 'hang';
  fakeWorker = class extends EventEmitter {
    constructor() {
      super(); if (mode === 'constructor') throw new Error('private parser path');
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- Test controls emitted worker events.
      lastWorker = this;
      this.stdout = this.stderr = { resume() {} };
      if (mode === 'error') queueMicrotask(() => this.emit('error', new Error('private source')));
      if (mode === 'exit') queueMicrotask(() => this.emit('exit', 1));
      if (mode === 'invalid') queueMicrotask(() => this.emit('message', { kind: 'image', width: NaN, height: 1 }));
    }
    async terminate() { terminated++; }
  };
  delete require.cache[require.resolve('../lib/ai/upload-inspection.ts')];
  const inspectFake = require('../lib/ai/upload-inspection.ts').inspectUpload;
  uploadPolicy.inspectionTimeoutMs = 20;
  await assert.rejects(inspectFake(sample, 'image/png'), /too long/);
  assert.equal(terminated, 1);
  for (mode of ['error','exit','invalid','constructor']) await assert.rejects(inspectFake(sample, 'image/png'), /safely inspect/);
  mode = 'hang'; uploadPolicy.inspectionTimeoutMs = 1000;
  const controller = new AbortController();
  const pending = inspectFake(sample, 'image/png', controller.signal);
  controller.abort(); await assert.rejects(pending, /cancelled/);
  const first = inspectFake(sample, 'image/png'); const firstWorker = lastWorker;
  const second = inspectFake(sample, 'image/png'); const secondWorker = lastWorker;
  await assert.rejects(inspectFake(sample, 'image/png'), /busy/);
  for (const worker of [firstWorker, secondWorker]) worker.emit('message', { kind: 'image', type: 'png', width: 1, height: 1 });
  await Promise.all([first, second]);
  mode = 'exit'; await assert.rejects(inspectFake(sample, 'image/png'), /safely inspect/); // Slots released.
  console.log('PASS: sample metadata, PDF page limits/compressed objects/forged Count/encryption, PNG/JPEG/WebP boundaries, malformed input, cancellation, timeout, failure cleanup and concurrency. No rendering or paid calls.');
})().catch(error => { console.error(error); process.exitCode = 1; });
