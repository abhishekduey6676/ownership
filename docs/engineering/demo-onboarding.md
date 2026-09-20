# Self-guided demo — text-sample slice

Implemented 16 September 2026, preserving the existing visual language and memory-only item flow.

## Visitor journey

1. Home explains the task and links to the sample picker on Add Item.
2. Choose a detailed synthetic invoice, an incomplete invoice, or a natural-language purchase
   prompt. These are explicitly labeled **text samples**, not image/PDF upload demonstrations.
3. The chosen source appears in the editable purchase-description field. Choosing a sample
   makes no request and does not grant processing consent. Personal image/PDF uploads remain available.
4. After processing acknowledgment and Analyze, the ordinary browser adapter sends the text
   to `/api/extract`. No sample output bypasses Gemini or substitutes pre-filled confirmed values.
5. Review includes a scenario-specific suggestion: compare price/dates, notice missing warranty
   information, or check the reference date and assumptions behind derived warranty expiry.
6. Correct, clear or add values and confirm. Cleared proposals are labeled “Cleared by you.”
7. Created offers View item, Back to dashboard and Try another input. The latter resets only
   intake, including confirmation, consent and the save ID. Previously confirmed items remain
   in the collection until refresh. Source URLs belonging to those items are not revoked.

Optional help uses a native disclosure with keyboard and touch support, not hover-only text.
Processing and refresh notices stay visible outside the disclosure. Manual entry remains available.

## Files to inspect

- `web/lib/demo/samples.ts`: one catalog of source text, labels and review tips; no AI results.
- `web/components/demo-sample-picker.tsx`: sample choices and short walkthrough.
- `web/hooks/use-add-item.ts`: selection, consent and source retention, confirmation and restart.
- `web/lib/document-copy.ts`: truthful labels for synthetic, user and manual sources.

The production intake no longer imports the mock provider to access sample data. The mock
adapter re-exports the same invoice for compatibility with older test code. Unchanged known
sample text gets a synthetic-source label; edited text is treated as user input. Static initial
sample documents carry explicit sample provenance. File preview copy no longer falsely says
the source was never sent to a server; manual records no longer open an empty iframe.

## Code-only validation

`node scripts/test-demo-onboarding.cjs` passed. It uses stubbed hook primitives and AI responses,
not a React renderer. It exercises all sample choices, no call before consent, failure/source
retention, correction/clearing, revisiting unchanged input without reanalysis, confirmed values,
resetting intake, a second creation with a distinct ID and real browser-adapter request mapping.
It does not establish actual Gemini field accuracy or visual/accessibility behavior.

Existing memory-repository, extraction-validation and API-handler tests also passed. TypeScript
passed; scoped lint had zero errors and the existing native image-preview warning. No browser,
rendering, build, generated images or paid API calls were used in this slice.

## File-sample follow-up — 16 September 2026

Static detailed/incomplete PNG and PDF downloads and an upload shortcut are now implemented.
See [sample-file notes](demo-files.md) for generation, structural checks and limitations.
The text-sample journey above remains available alongside these binary examples.

## Remaining work

- Real-provider extraction checks for the new image/PDF fixtures; downloads and binary routing are implemented.
- Real-provider evaluation for all scenarios, including invention/abstention and correction effort.
- Visual, keyboard and touch validation when authorized; five-friend usability observations.
- Public AI cost/abuse controls and provider/identity privacy review before enabling Vercel analysis.

No new claims of readiness for public AI use or measured model accuracy are made here.
