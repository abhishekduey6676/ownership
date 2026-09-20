# Mock Add Item implementation

Persistence update (13 September 2026): the temporary collection described below is now a
Supabase-backed shared cache. See [Supabase items](supabase-items.md) for current setup, security,
database calls and validation. Source selection and mock extraction remain unchanged. The old
refresh-reset regression is historical; `work/supabase-ui.cjs` tests the new UI repository contract.

## Start here

Read `web/hooks/use-add-item.ts` first. It coordinates the Source → Analyze → Confirm → Created journey. The page in `web/app/items/new/page.tsx` renders the existing UI and delegates behavior to this hook.

## Data flow

1. Source: retain a local File plus its document preview, the selected sample invoice, or plain text. File and text inputs are separate, so switching tabs does not overwrite either.
2. Analyze: call `extractionService.extract(source, { signal })`. Cancellation aborts the pending run. Errors return to Source without losing the chosen input.
3. Draft: the service returns editable fields plus proposal source/confidence metadata. Nothing is added to the collection yet.
4. Confirm: users edit, clear, or fill values. Serial number begins empty. Every edit clears the confirmation checkbox. Revisiting an unchanged source preserves edits.
5. Created: validate and normalize the reviewed fields, then call the shared store's `createItem`. Only the allowlisted editable fields are copied; a fresh ID is assigned once.
6. Read: Home, Items, Locations, and Item Detail all consume the same Context collection. Search and location grouping derive from that collection and have no separate copies of new items.

## Files and responsibilities

- `web/lib/ai/contracts.ts`: typed source, draft result, and asynchronous provider interface.
- `web/lib/ai/mock-extraction.ts`: hardcoded Philips example and sample invoice. It returns a fresh draft per run, includes a short simulated delay, and makes no network requests.
- `web/lib/ai/extraction.ts`: the provider selection point used by the hook.
- `web/hooks/use-add-item.ts`: pending input, analysis cancellation/errors, editable draft, explicit confirmation, and creation result.
- `web/lib/mock-data.ts`: item types, seed records, field labels, normalization, and validation.
- `web/components/mock-provider.tsx`: one confirmed item collection and create/update operations, mounted above routes in the root layout.

## Why Context

The prototype has a small collection shared by five screens. React Context and state already meet this need without another library. Drafts stay local to the Add Item flow; only confirmed records enter shared state. Route navigation retains the collection, while refresh resets it to seeds. Files stay in memory and object URLs are released when the provider unmounts.

## Later replacements

For Gemini, implement the extraction interface with a client adapter calling a server endpoint. Keep credentials and Gemini calls on the server. Validate and translate that response into `DraftItem`; the review screen does not need provider-specific logic. Real source attribution must replace the current explicitly fictional fixture metadata.

For Supabase, replace the provider's in-memory loading/create/update operations with a repository/API implementation and handle asynchronous loading/save errors. Keep the same shared collection for consumers. Document persistence and authenticated access will need their own implementation; no such services are connected now.

## Validation

Run `pnpm build`, `node node_modules/typescript/bin/tsc --noEmit`, and `pnpm lint` from `web/`. Browser regression scripts are in `work/ownership-flows.cjs` and `work/add-item-propagation.cjs`; these currently use this machine's bundled Playwright runtime. They test source selection, cancellation, editable confirmation, propagation, document viewing, sample-item behavior, and refresh reset.
