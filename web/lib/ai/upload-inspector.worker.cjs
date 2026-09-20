/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node worker, not browser code. */
// Only inspect metadata. Never render, execute PDF actions, fetch URLs or write source files.
const { parentPort, workerData } = require('node:worker_threads');
// Parsers may warn about malformed input; never leak document fragments into server logs.
console.warn = console.error = console.log = () => {};

(async () => {
  try {
    const { bytes, mime } = workerData;
    if (mime === 'application/pdf') {
      const { PDFDocument } = require('pdf-lib');
      const document = await PDFDocument.load(bytes, {
        ignoreEncryption: false, throwOnInvalidObject: true, updateMetadata: false,
      });
      // Traverses the actual page tree, including compressed objects, rather than regex /Count.
      parentPort.postMessage({ kind: 'pdf', pages: document.getPageCount() });
    } else {
      const { imageSize } = require('image-size');
      const { width, height, type } = imageSize(bytes);
      parentPort.postMessage({ kind: 'image', width, height, type });
    }
  } catch {
    parentPort.postMessage({ kind: 'invalid' });
  }
})();
