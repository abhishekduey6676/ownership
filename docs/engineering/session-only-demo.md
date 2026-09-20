# Session-only item demo — 16 September 2026

## Current behavior

Items, edits, drafts and selected sources live in browser memory. Navigating with the app's
links keeps the mounted root provider and its collection. Refreshing recreates the provider
with pristine synthetic samples. A new tab has its own collection; an added-item link opened
there or after refresh shows the unavailable state. No recovery or cross-device sync is promised.

## Read the code in this order

1. `web/lib/items/repository.ts`: `createMemoryItemRepository()` owns one collection, validates
   and normalizes confirmed fields, publishes immutable snapshots and deduplicates creation IDs.
   It has no fetch, database, localStorage, sessionStorage or IndexedDB calls.
2. `web/components/mock-provider.tsx`: creates one repository per mounted app and subscribes
   React with `useSyncExternalStore`. Home, Items/search, Locations and Item Detail all consume
   that snapshot. The legacy provider name is retained to avoid unrelated consumer changes.
3. `web/hooks/use-add-item.ts`: selected input -> extraction -> editable draft -> explicit
   confirmation -> memory repository -> Created -> item detail. AI cannot auto-confirm an item.

Sources are cloned into confirmed item document references for this visit. Object URLs are
released when the provider unmounts; a full refresh also discards the document's memory.
This is ordinary browser-memory lifetime, not a guarantee about browser/OS forensic erasure.

## Server boundaries

- `/api/items` is retired: GET/POST/PATCH return 410 without reading bodies, bootstrapping
  identity, seeding samples or issuing database queries. Stale clients cannot persist through it.
- `/api/extract` still sends consented image/PDF/text to Gemini and returns a validated draft.
  It now establishes/verifies an anonymous quota identity itself after input validation,
  rather than relying on the removed item-loading request. No item or source is sent to Supabase.
- Supabase Auth identity/cookies and approved daily attempt counters are separate operational
  metadata, not item persistence. [Shared limits](analysis-usage-limits.md) enforce 5 attempts
  per identity and 50 total per UTC day; stale counters are cleared on the next day's request.
  Browsing and manual entry do not require Supabase. AI analysis still needs its existing
  public URL/publishable key configuration and anonymous sign-ins. No new item migration is needed.
- Server-only Gemini credentials, origin/consent/file checks and quotas remain. Production AI
  is still disabled pending signup abuse controls, distributed resource protection, input
  resource limits and privacy review. Shared daily attempt limits are implemented and tested.

## What this change does not erase

The old Supabase item adapter, migrations, database rows, revisions, policies and anonymous
accounts were not deleted. They are not used for current item reads/writes. Existing Data API
access remains governed by the previously configured grants/RLS; retiring a Next.js endpoint
does not revoke those database policies. Any legacy purge or access retirement is a separate,
explicitly scoped database task. Do not claim earlier stored records were cleared by refresh.

Google receives sources for analysis. Its account-specific processing/retention terms remain
separate from this app's memory-only item lifecycle. Do not claim zero provider retention.
The earlier 24-hour item expiry/cleanup plan is withdrawn, not implemented.

## Validation without rendering

From `web`:

- `node scripts/test-memory-items.cjs`: all editable fields, blanks, normalization, validation,
  document retention, duplicate-save handling, shared snapshots, search/location projection,
  independent collections and reset to samples by creating a fresh provider repository.
- `node scripts/test-session-demo-api.cjs`: direct route-handler tests with external services
  stubbed; 410 item operations, fresh verified extraction identity, consent/origin rejection,
  failed identity denial and production gate. No network, browser or paid AI calls.
- `node scripts/test-extraction.cjs`: existing extraction contract/error regression tests.
- `node node_modules/typescript/bin/tsc --noEmit` and scoped ESLint.

These passed for this slice. No browser/render, visual navigation check or build was run at
the user's request. Reset semantics are tested at the repository lifecycle, not with a browser.
