# Shared AI attempt limits — 20 September 2026

Approved: 5 analysis attempts per anonymous browser identity per UTC day, 50 attempts total
across the demo. This is a request-count cap, not an exact currency-denominated spending cap.
One person can create several anonymous identities; the global limit still applies.

## Implementation

- `web/lib/ai/shared-limits.ts` is a server-only adapter. The existing verified Supabase client
  calls `reserve_demo_analysis()` without arguments. No source text, filename, extracted facts,
  item record, IP address, caller-selected ID, date or limits are passed to this function.
- `web/supabase/sql/demo-analysis-usage.sql` contains the reviewed SQL source. It was applied
  remotely to OwnershipProduct as migration `20260920065017_demo_analysis_usage_limits`.
  The local CLI was unavailable; remote migration history is authoritative for this operation.
- `ownership_usage.demo_budget`: one row with UTC usage date and total attempt count.
- `ownership_usage.visitor_budget`: at most 50 current-day anonymous UUIDs, dates and counts.
  These IDs are pseudonymous operational metadata, not guaranteed anonymous personal data.
- Both tables have RLS enabled and no client table privileges or policies. Deny-all direct
  access is intentional. The private security-definer function has an empty search path,
  fixed SQL and an `auth.uid()` check; the public RPC wrapper is security-invoker. Execution
  is granted to authenticated identities, including Supabase anonymous sign-ins, not `anon`.
- A singleton row lock serializes reservations. Database time is read after acquiring it.
  Both counters update in one transaction before the function permits an AI attempt. No lock
  is held during the Gemini call, and no service-role secret was added.

The route validates source/consent/origin and identity first, takes the existing process-local
concurrency slot, reserves shared allowance, then calls Gemini. Local daily counters are removed;
process-local concurrency remains an additional guard, not a distributed semaphore.

If the database is missing/unavailable, times out, or returns an invalid response, analysis
fails closed with a manual-entry path. There is no local quota fallback and no automatic retry.
Quota denial returns HTTP 429 plus Retry-After until the next UTC midnight. Concurrency denial
also returns 429 with a short retry delay. Raw database errors are not shown or logged.

An accepted reservation counts even if Gemini fails, the user cancels, or the HTTP response is
lost. No refunds are attempted: uncertain outcomes must not enable unmetered repeated AI calls.
Invalid sources rejected before reservation do not consume shared allowance. Manual entry and
sample downloads do not consume it. New browser sessions do not reset the global counter.

## Privacy and lifecycle

No item persistence has been reintroduced. Confirmed items, corrections and source previews
still live in this tab's memory and disappear on refresh. Existing legacy item rows/policies
are untouched. Counter metadata is separate from that item lifecycle.

On the first reservation after a UTC date rollover, the total resets and older visitor counters
are removed. During inactivity, the previous day's metadata remains until that next request;
there is no exact-duration deletion promise or background cleanup job. Supabase Auth accounts,
cookies, platform logs/backups and Google processing have their separate retention concerns.

An authenticated caller can directly consume its own allowance through the RPC without an AI
call. This cannot increase permitted Gemini calls, but malicious anonymous account creation can
exhaust the global demo allowance. CAPTCHA/signup abuse controls remain a public-release gate.
Do not expose the private schema through the Data API configuration.

## Validation

- Live transaction test `web/supabase/tests/demo-analysis-usage.sql` passed: allowed requests
  1–5, visitor denial at 6, total allowed 50, global denial at 51 including a fresh identity,
  date rollover, stale counter removal, missing identity denial, anon RPC denial and denial of
  direct authenticated table reads/writes. All fixture changes rolled back. A follow-up read
  confirmed zero used attempts and zero visitor rows.
- An unsigned HTTP RPC request with the publishable key was denied with SQL code 42501.
- `node scripts/test-session-demo-api.cjs` passed with mocked external services: quota must
  succeed before Gemini; both quota denial types return 429/Retry-After; invalid/missing/error
  responses cannot call Gemini; errors do not leak; failure paths release local slots.
- Existing extraction, memory-item, onboarding and sample-file tests, TypeScript and scoped
  ESLint passed. No rendering, build or paid Gemini calls.
- Multi-connection load testing and a signed-in HTTP-to-Gemini end-to-end test were not run.
  The database uses one locking path and constraints, but those tests should precede release.

## Security-advisor review

The new private tables produce informational [RLS-without-policy notices](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy):
this is intentional deny-all client table access, with access only through the restricted function.
Do not add permissive policies to silence this notice.

Unchanged legacy findings remain:

- `public.record_item_revision()` and `public.rls_auto_enable()` have broad execution grants.
  Review [anon definer-function access](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
  and [authenticated definer-function access](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
  before public release. Trigger return types limit direct invocation, but broad grants still warrant review.
- Old item/revision policies allow anonymous signed-in users: [advisor guidance](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins).
  That was intentional per-owner isolation in the retired persistence prototype; its retirement
  or hardening is separate from the counter change.
- Password leak protection is disabled: [guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
  This demo has no password sign-in flow; revisit this if password accounts are introduced.

The narrow function privileges and short locking transaction follow the Supabase skill and
[database-function guidance](https://supabase.com/docs/guides/database/functions). Current
function documentation and the Supabase changelog were reviewed for relevant changes.

## Still gated

Production extraction remains disabled. Shared daily limits do not complete signup abuse
controls, distributed concurrency/resource protection, PDF page/image dimension limits,
provider/identity privacy review, legacy permission review or full deployment validation.
