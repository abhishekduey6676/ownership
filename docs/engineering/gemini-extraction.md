# Real extraction — local development slice

## What changed

The image/PDF and purchase-description paths now call `/api/extract` through the existing
`ExtractionService` interface. The synthetic sample invoice is also analyzed by Gemini;
the original mock adapter remains available in code for explicit tests, not silent fallback.
The confirmation form and category icons are unchanged. As of 16 September, the shared item
repository is browser-memory-only; refresh restores samples. See [session-only demo](session-only-demo.md).

Read `web/lib/ai/gemini.ts` first for the provider prompt and JSON contract. Supporting files:

- `web/lib/ai/extraction.ts`: browser multipart adapter, no provider credentials.
- `web/app/api/extract/route.ts`: same-origin check, new/restored verified anonymous quota identity,
  processing acknowledgment, bounded input, file signature checks, shared quotas, and response.
- `web/lib/ai/validation.ts`: strict runtime schema, missing-field handling, currency/date
  validation and deterministic warranty derivation. Evidence is a model proposal, not independent verification.
- `web/hooks/use-add-item.ts`: editable draft, cancellation, date recalculation, manual entry,
  and explicit confirmation. No extraction result writes directly to confirmed item state.

## Configuration and privacy

`GEMINI_API_KEY` must be server-only. Never use `NEXT_PUBLIC_GEMINI_API_KEY`.
The mistakenly public-prefixed local variable was renamed; no application source reference
to that public-prefixed name was found. No key value is printed by tests or returned by the API.

`GEMINI_MODEL` is configurable; default is `gemini-3.5-flash-lite`. Live discovery listed it,
and real synthetic tests passed. The earlier 2.5 Flash-Lite model was listed but Google rejected
it for new users; there is no automatic model switching or retrying on a different provider.

Inputs are sent inline to Google, not to our document storage or the Gemini Files API.
No original inputs or raw provider responses are persisted/logged by this extraction layer.
Existing browser previews still last for the visit. This is NOT a claim of zero provider retention.
The processing notice recommends synthetic/redacted non-sensitive input and requires acknowledgment.
Review Google's [API terms](https://ai.google.dev/gemini-api/terms) against the actual account
and region before accepting personal data: unpaid-service handling can include model improvement
and human review. Paid-service terms differ. Account tier was not verified in this task.

## Local safeguards and public-release boundary

- 3 MB maximum image/PDF; 5,000-character text; no empty or mismatched-signature files.
- 40-second provider timeout, bounded JSON output, no automatic paid retries.
- Shared Supabase counters permit 5 attempts per identity per UTC day and 50 total, atomically
  reserved before Gemini. See [shared usage limits](analysis-usage-limits.md). Process-local
  concurrency allows at most two active requests and one per identity; it is not distributed.
- Production extraction currently fails closed. Complete signup abuse controls,
  PDF page/resource limits and provider/identity privacy review before enabling
  the public Vercel endpoint. Do not remove the gate merely to make a deployment work.
- Manual entry is available without sending source content to Google.

Currency remains INR-only to match the existing form. Non-INR or unevidenced-currency
prices remain blank with a warning; this implementation does not silently convert currencies.
Relative dates use the server clock in the visitor's supplied, validated timezone and show the
reference in review. Warranty derivation assumes purchase-date start, clamps the calendar-month
anniversary at month-end and subtracts one day for inclusive coverage; its assumption is visible.
Editing the start/duration recomputes an untouched derived expiry; manually changed/cleared expiry
is not silently replaced. The existing Item Detail warranty status still uses its labeled fixed
demo date; modernizing that separate display is not part of this extraction slice.

## Validation (no rendering)

`node scripts/test-extraction.cjs`: deterministic contract/error tests without network requests.
`node --env-file=.env.local scripts/test-extraction.cjs --live`: small synthetic provider tests.
Live text extraction, PDF field mapping and blank-image abstention passed. The image test verifies
the image input path and refusal to invent facts, not receipt-OCR accuracy on a varied image set.
The PDF fixture is assembled in memory as bytes; no renderer or browser is involved.

`node scripts/test-extraction-api.cjs`: HTTP-only integration check using a local running app;
one synthetic provider request plus consent/origin/file rejection checks. It never confirms an item.
No new database migrations, UI rendering, screenshots, or production build were run in this slice.
Use TypeScript and scoped ESLint checks alongside these tests. Broader evaluation and the public
release gates remain future work; passing a few fixtures is not an accuracy guarantee.
