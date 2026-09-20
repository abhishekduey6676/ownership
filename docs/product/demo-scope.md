# Public AI demo — approved scope, 16 September 2026

## Authority and purpose

This is the current release scope. It supersedes conflicting requirements in the earlier
long-lived ownership-product roadmap, including permanent document storage and a full
household milestone before AI integration. Those remain future product possibilities.

Purpose: demonstrate product management judgment and practical AI knowledge in AI PM
interviews, targeted in roughly one month. Visitors should understand and complete the
experience without a presenter. This is a useful working demo, not a permanent records vault.

## Core promise and journey

Turn a receipt or purchase description into a structured item record that the user reviews.

Image / PDF / purchase prompt -> real AI proposals -> editable confirmation -> created item
-> temporary collection and detail page.

- Support three clearly labeled entry points: Image, PDF, Describe a purchase.
- One item per submission. Multi-item extraction and bulk import are deferred.
- Map supported facts into the existing form: name, category, brand, model, serial number,
  retailer, purchase date, price/currency, warranty duration, expiry, and physical location.
- Users can edit, clear, or supply missing fields. Only explicit confirmation saves an item.
- Missing facts stay missing. Never invent warranty terms, serials, prices or support data.
- Preserve Home, Items/search, Locations and Item Detail as views of one shared collection.
- Preserve the existing lime/violet design and Next.js framework.

## Plain-language purchase input

Example: "I bought a smartwatch today and it has a six-month warranty."

Suggest smartwatch, an explicit purchase date, and six-month warranty duration. Resolve
relative dates using a displayed reference date/timezone, not the fixed synthetic demo date.
Leave brand, model, serial and price blank unless supplied. A calculated expiry must show
its inputs and the assumed warranty start date; require review before using it as trusted
data. Ambiguous wording should produce a clarification or an unresolved field, not a guess.

## Self-guided first visit

Suggested opening copy: "Turn receipts and purchase notes into organized item records.
AI suggests the details; you decide what gets saved."

- Lead with Try a sample invoice; allow personal inputs alongside the sample action.
- Provide synthetic sample image/PDF documents and a sample purchase prompt.
- Include a complete invoice and a deliberately incomplete example to demonstrate abstention.
- Explain input, review and confirmation with brief, keyboard/touch-accessible tooltips.
- Important demo, processing and retention disclosures must remain visible without tooltips.
- Review distinguishes Found in source, Not found, Edited by you, and Calculated.
- Show Created only after the save succeeds, with View item and Try another input actions.
- After refresh, do not imply original document evidence is still stored or downloadable.

## Icons, not generated product images

Use a deterministic category-to-icon mapping from the existing icon library. Cover appliance,
audio, wearable, phone and computer categories, with a generic fallback. An unknown category
must not cause an image-generation call. Icons are illustrative, not evidence of brand/model.
Generated product images and per-item image-generation costs are out of scope.

## Temporary-data contract

1. Unconfirmed drafts and original inputs stay in browser memory for the current visit.
2. Send the selected input to the server/AI provider only when the visitor requests analysis.
   Do not persist original images, PDFs or raw purchase prompts in our document storage or logs.
   Processing is temporary; an unavoidable provider-side file mechanism must have explicit
   cleanup and verified retention before release. No permanent document library is planned.
3. Keep confirmed item details, edits and source previews in browser memory only. Do not
   send confirmed records to PostgreSQL or use localStorage, sessionStorage or IndexedDB.
4. In-app navigation preserves one shared collection. A full refresh starts from synthetic
   samples: added items, edits, drafts and original sources are gone. A new tab is independent.
5. The earlier 24-hour persistence and scheduled item-cleanup plan is withdrawn. No new item
   content is stored by the app server. Existing records from the old prototype are not
   automatically deleted by this change; review any requested legacy-data purge separately.
6. Anonymous AI-quota identity/cookies, operational metadata and Google processing may have
   separate retention. Browser-memory item handling is not a zero-retention provider promise.
7. No recoverable sign-in, cross-device recovery or household sharing is promised. Supabase
   stores anonymous identity and approved usage counters only, not new item content. Counters
   contain pseudonymous UUIDs, UTC dates and counts. Previous-day counters are removed on the
   first reservation after UTC rollover; during inactivity they remain. This is separate from
   browser-memory item lifetime, Auth metadata and provider retention.

Visible copy:
"Demo mode: Items and edits stay in this tab until refresh. Refresh restores the samples.
Original files aren't saved by this app."

Disclose external AI processing separately, using the actual provider/account configuration.
Do not claim GDPR compliance or zero provider retention from demo status alone.

## Public release gates and cost controls

- Server-only AI credentials; private per-user access; no service-role key in frontend code.
- Server-enforced file type/size/page, text-length, request and concurrency limits.
- Per-session abuse controls plus a global AI budget limit; new anonymous sessions must not
  provide an unlimited paid-call bypass. Select numeric limits before release and test them.
- Approved and implemented: 5 reserved attempts per anonymous browser identity and 50 total
  per UTC day, checked atomically in Supabase before Gemini. Failed/cancelled attempts may count.
  Manual entry remains available. Counter failures block AI; no local fallback is permitted.
- Timeouts, bounded retries, duplicate-save protection and a clear exhausted-budget state.
- No silent switch from Gemini to fictional extraction results. Explicit mock examples may
  remain available, visibly labeled as simulated.
- No raw source content, tokens or extracted personal details in telemetry or error logs.
- Keep privacy/retention notices accurate and test refresh reset before the public Vercel link.
- Manual correction and a usable failure path remain available when extraction fails.

## Deferred

Phone-to-laptop QR pairing is a nice-to-have: a short-lived QR link would let a phone submit
a photo into a specific desktop intake session. It needs scoped pairing tokens, expiry,
upload limits and explicit attachment confirmation. Do not implement it in the core release.

Also defer permanent storage, recoverable accounts, household sharing, maintenance/reminders,
replacement/lifecycle expansion, automated support discovery, claims, bulk imports and repair
advice. Existing Something's wrong navigation may remain, with honest missing-information states.

## Acceptance and interview evidence

- An unfamiliar visitor can complete the sample journey without spoken guidance.
- A real image, PDF and purchase prompt each produce source-dependent proposals, not fixtures.
- Edited/cleared values survive confirmation and in-app navigation across all collection views.
- Refresh restores pristine samples; added item links show a helpful unavailable state.
- Missing warranty/serial facts remain unknown; relative dates and derived expiry are reviewable.
- Category icons work without image generation, including the unknown-category fallback.
- Original sources are absent from persistent application storage and logs after processing.
- No item/source persistence calls occur during confirmation or editing. The retired item API
  rejects reads and writes, including calls from stale clients. New tabs cannot see additions.
- Cross-session access, oversized inputs, provider failures, quotas and retries are tested.
- Evaluate field accuracy, unsupported suggestions, correction effort, latency and AI cost on
  a documented test set. Observe up to five recruited friends; report actual findings and
  limitations rather than claiming product-market fit or invented success percentages.

## Current state versus planned work

Previously implemented and tested: anonymous-session PostgreSQL item persistence. That path
is now retired from the demo, with the database adapter/migration kept as historical code.
Current item architecture: one per-app in-memory repository feeds Home, Items, Locations and
Item Detail; confirmation/editing do not make item API calls. Refresh restores samples.

Subsequent implementation: shared category icons and local real Gemini extraction are now in place.
See [Gemini extraction](../engineering/gemini-extraction.md) for tests and the production safety gate.

Self-guided text-sample slice is implemented: Home entry, three labeled synthetic text examples,
editable source selection, optional walkthrough, review tips and Try another input. Samples
still use the ordinary real extraction endpoint after consent. See
[onboarding notes](../engineering/demo-onboarding.md) for code-only tests and their limits.

Downloadable detailed/incomplete PNG and PDF fixtures are now available alongside text samples.
Their structure and binary upload path are tested without rendering or paid calls; see
[sample-file notes](../engineering/demo-files.md). File-specific AI accuracy remains unmeasured.

Shared daily counters are applied and live SQL-tested; see [usage-limit notes](../engineering/analysis-usage-limits.md).
No service-role secret or item persistence was introduced. Public analysis remains disabled.

Still pending: public Vercel release, full onboarding/AI accuracy validation, signup abuse/resource controls,
provider/identity metadata review or QR pairing. Item expiry/cleanup is no longer a release
feature. Legacy database data and policies have not been purged or changed by this switch.
