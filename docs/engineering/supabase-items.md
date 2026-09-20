# Persistent personal prototype — 13 September 2026

## Retired item integration — 16 September 2026

The current demo uses [browser-memory-only items](session-only-demo.md). Refresh restores
samples; /api/items returns 410 and no longer reads, seeds or writes PostgreSQL. Supabase
anonymous identity remains solely for AI usage checks. The records, migrations and database
policies from this older prototype have not been purged or changed. Everything below is
historical implementation documentation, not current setup or acceptance criteria.

## Historical status — 15 September 2026

The project is now configured. The live browser test (`work/supabase-live.cjs`) passed creation,
confirmed edits/clears, refresh, subsequent editing, Home/search/Locations, sample navigation
and separate-session collection isolation. The earlier unconfigured-status notes below are
historical; direct SQL isolation/advisor checks are not claimed by that browser test.

The 15 September proposal for 24-hour details was withdrawn on 16 September in favor of
memory-only items. Legacy database records still have no automatic expiry.

## Approved scope

The user approved anonymous Supabase sessions with per-user RLS, without a login screen.
This narrow persistence slice supersedes the temporary-state milestone. It is not the full
household milestone: `items.owner_id` currently provides private personal access. Household
membership and household_id will require a later migration, not inference from location.
Amounts use PostgreSQL numeric(12,2) in INR for this existing decimal-price form; the broader
minor-unit money model remains a future migration. Warranty duration remains editable text.

## Setup

1. Create a development Supabase project.
2. Enable Anonymous Sign-Ins under Authentication settings.
3. Run `web/supabase/migrations/202609130001_items.sql` once in the SQL editor.
4. Copy `web/.env.example` to `web/.env.local` and supply the project URL and publishable key.
5. Restart `pnpm dev` from `web`.

The URL and publishable key are safe for frontend exposure with RLS enabled. This implementation
uses them on the server only. Never configure a service-role/secret key under NEXT_PUBLIC.
No privileged key is needed. No migration is automatically applied against a remote project.

## Read this code first

Start with `web/lib/items/repository.ts`, then `web/components/mock-provider.tsx`.
The context remains the single shared UI cache. It starts empty, loads once, and reports errors
without silently substituting sample data. The legacy MockProvider name avoids consumer churn.

Source -> mock extraction -> editable draft -> confirmation -> browser repository ->
Next.js `/api/items` -> server validation -> Supabase repository -> PostgreSQL + RLS ->
saved row -> shared cache -> Home / Items / Locations / Detail.

`web/lib/ai/mock-extraction.ts` is unchanged. Only confirmed fields travel to the API.
`web/lib/items/supabase-repository.ts` owns all item queries and maps nullable SQL fields to
the existing string form model. `web/lib/supabase/server.ts` owns sessions, using HTTP-only,
same-site cookies (Secure in production). API mutations require a same-origin request.

Creation uses a stable UUID for retry idempotency. Save success waits for the returned row.
Sample records are inserted with conflict-ignore per owner/sample key, so refresh never resets
sample edits. Legacy sample detail links resolve sample_key to the persisted UUID.
Database triggers retain append-only snapshots of initial confirmation and later edits.
No delete permission or sharing mechanism is exposed.

## Limitations

- Anonymous access survives refresh in the same browser; clearing cookies loses access.
  Do not silently create a replacement identity when an existing session cannot be restored.
  Account linking/recovery and cross-device access are not implemented.
- Files, blob URLs, and source text are NOT sent to PostgreSQL. Local document previews last
  only for this visit; synthetic fixture documents can be regenerated after refresh.
- Mock AI provenance remains a temporary draft; database snapshots are not the full future
  observation/provenance schema. Gemini and private Storage remain deferred.
- Before public release, add CAPTCHA/abuse protection to anonymous signup, rate limits,
  account recovery and retention tooling. Use synthetic records for this private prototype.
- Live migration, RLS isolation, and save-refresh validation require configured Supabase.

## Live acceptance checks

Create from sample, edit name/serial/location and clear a field, confirm, open detail, refresh.
Verify exact values, search, Home and location membership. Edit and refresh an existing sample.
Open another isolated browser context and verify the first user's item ID is unavailable.
Test direct authenticated PostgREST read/update attempts using the second identity and confirm
RLS denies access. Check item_revisions records the edit. Disconnect network and verify retry
retains the draft and a repeated confirmation creates only one item.

Database isolation regression: run `web/supabase/tests/items-rls.sql` in the development SQL
editor after applying the migration. It checks private reads, edits, denied foreign inserts,
denied deletion, anonymous-role denial, and revision snapshots, then rolls back its fixtures.

## Validation performed without credentials

- TypeScript and production build passed.
- ESLint passed with four pre-existing next/image warnings.
- `node work/supabase-ui.cjs` passed against a simulated HTTP repository: load error/retry,
  uncertain save/retry with a stable ID, field editing/clearing, detail refresh, post-creation
  editing, Home, search, Locations and the legacy sample detail/problem routes.
- The real unconfigured API returns a helpful setup error, not fake save success.
- Live PostgreSQL persistence and the SQL RLS regression are NOT yet executed: no Supabase
  project environment is configured. The simulated UI test does not prove database behavior.
