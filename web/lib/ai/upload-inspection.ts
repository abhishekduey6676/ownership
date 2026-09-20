import 'server-only';
import { Worker } from 'node:worker_threads';
import * as path from 'node:path';
import { uploadPolicy } from './upload-policy';
import { extractionFileLimit, validFileSignature } from './validation';

export class UploadInspectionError extends Error {
  constructor(message: string, readonly status = 400) { super(message); this.name = 'UploadInspectionError'; }
}

const unreadable = 'Could not safely inspect this file. Use an unencrypted PDF or a valid JPG, PNG or WebP, or enter details manually.';
// Bound simultaneous metadata work per Node process. No unbounded inspection queue.
let active = 0;

export async function inspectUpload(bytes: Uint8Array, mime: string, signal?: AbortSignal): Promise<void> {
  if (!bytes.length || bytes.length > extractionFileLimit || !validFileSignature(bytes, mime)) {
    throw new UploadInspectionError('Choose a valid JPG, PNG, WebP or PDF up to 3 MB, or enter details manually.');
  }
  if (signal?.aborted) throw new UploadInspectionError('File inspection cancelled. Try again or enter details manually.');
  if (active >= 2) throw new UploadInspectionError('File checks are busy. Try again shortly or enter details manually.', 503);
  active++;
  let worker: Worker | undefined;
  try {
    worker = new Worker(path.join(process.cwd(), 'lib/ai/upload-inspector.worker.cjs'), {
      workerData: { bytes, mime },
      resourceLimits: { maxOldGenerationSizeMb: 64, maxYoungGenerationSizeMb: 16, stackSizeMb: 2 },
      stdout: true, stderr: true,
    });
    // Discard parser output, including warnings from dependencies.
    worker.stdout.resume(); worker.stderr.resume();
    const metadata: unknown = await new Promise((resolve, reject) => {
      const abort = () => finish(new UploadInspectionError('File inspection cancelled. Try again or enter details manually.'));
      const timer = setTimeout(() => finish(new UploadInspectionError('File inspection took too long. Use a simpler file or enter details manually.')), uploadPolicy.inspectionTimeoutMs);
      let settled = false;
      function finish(error?: Error, value?: unknown) {
        if (settled) return;
        settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
        if (error) reject(error); else resolve(value);
      }
      worker!.once('message', value => finish(undefined, value));
      worker!.once('error', () => finish(new UploadInspectionError(unreadable)));
      worker!.once('exit', () => finish(new UploadInspectionError(unreadable)));
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
    });
    if (!metadata || typeof metadata !== 'object') throw new UploadInspectionError(unreadable);
    const result = metadata as Record<string, unknown>;
    if (mime === 'application/pdf') {
      const pages = result.pages;
      if (result.kind !== 'pdf' || typeof pages !== 'number' || !Number.isSafeInteger(pages) || pages < 1) throw new UploadInspectionError(unreadable);
      if (pages > uploadPolicy.maxPdfPages) throw new UploadInspectionError('PDFs can have up to 5 pages. Export only the relevant pages or enter details manually.');
    } else {
      const { width, height } = result;
      const expectedType = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime];
      if (result.kind !== 'image' || result.type !== expectedType || typeof width !== 'number' || typeof height !== 'number'
        || !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) throw new UploadInspectionError(unreadable);
      if (width > uploadPolicy.maxImageSide || height > uploadPolicy.maxImageSide || width * height > uploadPolicy.maxImagePixels) {
        throw new UploadInspectionError('Images must be at most 20 megapixels and 8,192 pixels per side. Resize the image or enter details manually.');
      }
    }
  } catch (error) {
    if (error instanceof UploadInspectionError) throw error;
    throw new UploadInspectionError(unreadable);
  } finally {
    // Wait for termination before releasing the slot, including after timeout/cancellation.
    try { await worker?.terminate(); } finally { active--; }
  }
}
