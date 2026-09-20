# Upload metadata limits

The demo accepts files up to 3 MiB (displayed as 3 MB), with these additional analysis limits:

- PDF: 1–5 pages, unencrypted and parseable.
- JPG, PNG, WebP: positive dimensions, at most 20,000,000 pixels and 8,192 pixels on either side.
- Plain-text purchases retain the existing 5,000-character limit.

These conservative demo defaults target a single receipt/purchase, not bulk document import.
The source screen displays the limits without changing the existing layout or workflow.

## Enforcement

`web/lib/ai/upload-policy.ts` defines the limits. After byte-size, MIME/signature and consent
checks, `/api/extract` calls `web/lib/ai/upload-inspection.ts` before creating an analysis
identity, reserving daily allowance or invoking Gemini. Rejected files return a safe HTTP 400
message explaining how to resize/export relevant pages or use manual entry. Busy inspection
returns 503. The existing client returns to Source with its selected input and manual-entry path.

A standalone Node worker uses pinned `pdf-lib` 1.17.1 and `image-size` 2.0.4. PDF page counts
come from the parsed page tree, including compressed object streams, not a regex or trusted
`/Count` field. Encryption is not ignored. Images are inspected for metadata only; no pixel
decoding or PDF rendering occurs. No source files are written, uploaded elsewhere or logged.
Parser diagnostics are suppressed and raw parser exceptions never reach the response.

Each worker has a three-second wall-clock timeout, 64 MiB old-generation / 16 MiB young-generation
V8 heap limits and a 2 MiB stack limit. Cancellation, timeout, malformed results and worker
failure all reject the input. Termination finishes before the concurrency slot is released.
At most two inspections run per Node process; there is no unbounded pending queue.

`web/next.config.ts` includes the standalone worker and its dependencies in output tracing.
Run Next.js from `web/`, as usual. Deployment packaging still needs verification before release;
this slice deliberately did not run a production build or publish anything.

## Validation without rendering

From `web/`, run `node scripts/test-upload-inspection.cjs` and
`node scripts/test-session-demo-api.cjs`.

Coverage includes the four existing downloadable sample files; five/six-page boundaries;
compressed and uncompressed PDFs; a forged page Count; zero-page, encrypted and malformed PDFs;
PNG/JPEG/WebP dimension boundaries; mismatched signatures, truncated headers and byte-size limits;
cancellation, timeout, unexpected worker exit/error, invalid results and concurrency cleanup.
Worker failure paths use deterministic stubs rather than a real decompression bomb. Synthetic
image-header fixtures test metadata limits, not full image decodability.

Route tests confirm rejected files cause zero identity, quota or provider calls, while accepted
samples follow the normal quota/provider path with external services stubbed. Existing extraction,
memory-item, onboarding and sample-file tests, TypeScript and scoped lint passed. No UI rendering,
production build, external AI calls or database changes were performed.

## Boundaries that remain

This is not malware scanning, sanitization or a complete decompression-bomb defense. Metadata
parsing does not prove all image pixels/frames are valid, bound animated-frame work, or constrain
embedded PDF image resolution/content streams. V8 limits do not bound all native/ArrayBuffer
memory. Workers are resource controls, not a security sandbox. Per-process concurrency is not
a distributed limit, and checks do not change browser preview behavior before analysis.

Production extraction remains disabled. Signup abuse protection, request/aggregate resource
controls, dependency/security review, provider/identity privacy review, legacy permissions and
deployment/end-to-end validation remain release gates. Do not claim this slice clears them.

Parser references: [PDFDocument](https://pdf-lib.js.org/docs/api/classes/pdfdocument),
[load options](https://pdf-lib.js.org/docs/api/interfaces/loadoptions),
[image-size metadata API](https://github.com/image-size/image-size).
