# MVP delivery plan

## Current release — 16 September 2026

The [16 September demo scope](../product/demo-scope.md) supersedes the historical milestones below.

1. Implemented: category icons, real local AI extraction and reviewable draft mapping.
2. Implemented: per-tab memory repository; refresh restores samples. The item API is retired,
   navigation is preserved and retention notices/code-only tests are updated.
3. Self-guided experience: text-sample picker, optional walkthrough, review tips and restart
   are implemented, with downloadable image/PDF sample files. Next: live evaluation and usability validation.
4. Public safeguards: shared 5-per-identity/50-total daily attempt counters are implemented and
   live SQL-tested. Remaining: signup abuse protection, input resource caps and accurate
   provider/identity disclosures. No 24-hour item expiry or cleanup milestone is needed.
5. Vercel publication and evaluation with five friends after public safeguards pass.

QR pairing, recoverable login and permanent storage remain deferred. Old database data is
not purged by this slice; any legacy cleanup requires a separately scoped operation.

## Planning rule

13 September 2026 update: the user approved the personal persistence slice described in
`../engineering/supabase-items.md`: anonymous sessions, per-user RLS, item persistence and
append-only edit snapshots. This supersedes the temporary-state restriction below, but does
not declare the full household/auth, document, or AI-provenance milestones complete.

Current approved slice (12 September 2026): implement both core journeys as a complete temporary-state mock interface before backend milestones. File selection, simulated analysis, editable review, explicit confirmation, created-item navigation, item detail, document previews, and Something’s Wrong are functional. Native Next.js runs the app; Supabase, Gemini, authentication, and durable storage remain deferred. Demo fixtures and dates are visibly labeled. Item and location navigation reuse the same in-memory collection.

Each milestone ends with a coherent, working application state that can be demonstrated without unfinished screens on the main path. Mock AI mode is the default development path. Do not begin the next milestone until the current exit checks pass.

## Milestone 0 — Product foundation

Outcome: the repository has an agreed product boundary and development baseline.

Deliver:

- This documentation set reviewed for consistent terminology and scope
- Next.js + TypeScript + Tailwind + shadcn/ui project shell
- Environment validation and `.env.example`
- CI build/typecheck and basic test command
- Initial visual tokens, responsive shell, error boundary, and accessible navigation
- Safe synthetic fixtures for an air fryer and earphones

Exit checks:

- Application builds and opens to a polished empty dashboard shell.
- No production credentials are required to run locally.
- No application feature claims information that does not yet exist.

## Milestone 1 — Local working ownership loop

Outcome: a portfolio viewer can experience the core shape without backend or AI cost.

Deliver:

- Empty and populated dashboard fixtures
- Item library and one complete item detail fixture
- Mock Add item source selection
- Mock extraction review with accepted, edited, missing, and low-confidence fields
- In-memory or fixture-backed confirmation that navigates to item detail
- Responsive layouts and core accessibility states

Exit checks:

- The demo path Dashboard → Add → Review → Item detail works in one session.
- Draft versus confirmed values are visually unmistakable.
- Refresh limitations are clearly acceptable for this milestone and do not masquerade as persistence.

## Milestone 2 — Persistent household records and auth

Outcome: one signed-in user can securely retain a private household and items.

Deliver:

- Supabase Auth integration
- Automatic private household creation for a new user
- PostgreSQL schema migrations for users, households, memberships, locations, items, fact revisions, lifecycle events, relationships, and audit events
- RLS policies and cross-household isolation tests
- Persistent dashboard, items, locations, and trusted fact edits
- Seed/demo data mechanism separate from production data

Exit checks:

- A new account receives exactly one usable private household.
- Data persists across sessions.
- Direct attempts to read or mutate another household fail at the database boundary.
- Trusted edits create history instead of overwriting it.

## Milestone 3 — Private documents and intake

Outcome: a user can safely attach evidence to a draft item and keep it private.

Deliver:

- Intake sessions
- Private Supabase Storage bucket and policies
- Image, PDF, and plain-text sources with defined size/count/type limits
- Upload progress, remove, retry, unsupported, and unreadable states
- Document metadata, checksum, user-facing classification, and signed access
- Abandoned-intake retention behavior

Exit checks:

- A source uploads, survives refresh, and remains accessible only to household members.
- Invalid files fail with useful messaging while other completed work remains.
- Raw filenames cannot influence storage paths or rendered markup.

## Milestone 4 — Mock AI extraction to trusted record

Outcome: the full trust pipeline is persistent and works without external AI use.

Deliver:

- Provider-neutral contracts and runtime validation
- Fixture-driven mock adapter selected through `AI_MODE=mock`
- Extraction runs, draft facts, fact sources, and confidence display
- Review with accept, edit, clear, conflict resolution, and manual fallback
- Transactional item confirmation and idempotency
- Provenance detail on Item detail
- Fixtures for partial, conflicting, failed, and malicious-input cases

Exit checks:

- Every trusted extracted value has an observation and valid source.
- Re-running extraction does not alter trusted values.
- Invalid or malicious model output cannot escape the draft layer.
- Provider failure still allows manual item creation.

## Milestone 5 — Attention, warranty, and maintenance

Outcome: the application helps the user notice and act on real, confirmed needs.

Deliver:

- Warranty records and deterministic active/expired/unknown/not-applicable projection
- User-created reminders, including recurrence only if completion history is implemented correctly
- Service events and attachments
- Item timeline combining purchase, warranty, reminder, service, location, and lifecycle events
- Dashboard attention ordered by explicit rules
- Empty, upcoming, overdue, and incomplete states

Exit checks:

- Unknown warranty never appears expired.
- Draft dates never create alerts.
- No category automatically creates a maintenance task.
- Completing a reminder updates dashboard and preserves history.

## Milestone 6 — Something's wrong

Outcome: a user can gather reliable information for an item problem without receiving fabricated advice.

Deliver:

- Focused problem view
- Warranty evidence summary
- Relevant document grouping
- Completeness checklist based on the record, carefully labeled as record gaps rather than universal claim requirements
- User-provided/source-confirmed support records
- Safe empty state when verified guidance is unavailable
- Record service and add missing information actions

Exit checks:

- No support contact or troubleshooting step is generated without a visible source.
- An item with sparse data still produces an honest, useful view.
- The flow links back to item context and preserves user work.

## Milestone 7 — Lifecycle and replacement

Outcome: ownership history remains useful after an item leaves active use.

Deliver:

- Status transitions for replaced, sold, gifted, lost, and disposed
- Append-only lifecycle events
- Archived-items filter
- Replacement relationship to an existing or newly created item
- Carry-forward limited to suggested category and physical location
- Confirmation and audit trail

Exit checks:

- Archived items remain accessible with documents and history.
- Replaced items link both ways.
- Serial number, warranty, price, invoice, and other unique facts are never copied.
- Canceling replacement leaves the original item unchanged.

## Milestone 8 — Gemini integration and demo hardening

Outcome: the app can extract from real supported sources while retaining a reliable no-cost demo mode.

Deliver:

- Server-only Gemini adapter using the shared contract
- Explicit model configuration, timeouts, transient retries, and per-household limits
- Provider disclosure and privacy copy before processing
- Synthetic evaluation suite and contract tests
- Production-safe mode validation so mock output cannot masquerade as real extraction
- Loading, quota, timeout, malformed-output, and manual-fallback states
- Final responsive and accessibility pass for the complete Phase 1 journey

Exit checks:

- Gemini and mock responses traverse the same validation and confirmation path.
- The evaluation set passes invention, attribution, identifier, and conflict gates.
- Provider outages do not corrupt records or block manual entry.
- The complete Phase 1 journey works on mobile and desktop.

## Milestone 9 — Private portfolio release

Outcome: a controlled hosted demo is safe to share with reviewers.

Deliver:

- Vercel deployment and production Supabase project
- Environment separation and secret review
- CSP and core security headers
- Logging redaction and basic failure/latency monitoring
- Backup/restore expectation and known-limitations note
- Scenario-based acceptance run from the PRD
- Deliberate choice of demo mode: clearly labeled mock, or Gemini with strict limits

Exit checks:

- No secrets appear in the client or repository.
- Household isolation and signed-document access pass production smoke tests.
- The demo includes no dead-end navigation or promises of deferred features.
- Known limitations, especially malware scanning and deletion operations, are accurately disclosed.

## Scope moved out of MVP

These are useful ideas, but they do not improve the first evidence-backed ownership loop enough to justify their cost now:

- household invitations, multiple-household switching, granular permissions;
- outbound email, push, SMS, or calendar notifications;
- automatic official support/manual discovery and warranty registration;
- multi-item invoice splitting, retailer/email imports, and bulk capture;
- AI diagnosis, repair instructions, repair-versus-replace, and service-provider recommendations;
- finance, depreciation, insurance valuation, resale, and marketplace features;
- automatic maintenance templates based only on category;
- native apps, offline sync, analytics warehouse, microservices, queues, and vector search.

The database anticipates household membership and replacement relationships because retrofitting those boundaries is costly. The product UI does not expose the deferred workflows.

## Cross-document consistency check

The MVP is consistent on these points:

- Household is the access boundary; location is physical organization.
- AI creates immutable draft observations; only confirmation creates trusted revisions.
- Warranty and attention use trusted facts only.
- Support and maintenance information require a stored source or explicit user entry.
- Lifecycle status changes preserve history and are not privacy deletion.
- Mock and Gemini providers share one contract and one product flow.
- One Next.js application, Supabase, and Vercel are sufficient; no distributed architecture is planned.

## Major issues and recommendations

### 1. “Shared household” is broader than the Phase 1 journey

Recommendation: build the household tenancy model and RLS early, but ship the MVP UI as one private household per user. Add invitations only after the core ownership flow is trustworthy. This avoids both schema rework and premature permission complexity.

### 2. “Official support” cannot safely be inferred by the extraction model

Recommendation: in MVP, accept support information only when user-entered or found in an uploaded source, with a visible status. Automated discovery needs a later verification and freshness system. Do not label AI-extracted contact data “official” merely because confidence is high.

### 3. Multi-item receipts can quietly double the product scope

Recommendation: ask the user to choose one product per intake in MVP. Retain the source so another item can reuse it later, but defer automatic line-item splitting and batch review.

### 4. Serverless extraction duration may become a constraint

Recommendation: begin with bounded synchronous orchestration and realistic timeout states. Measure real Gemini/PDF latency before adding async infrastructure. If needed, adopt the smallest database-backed job/polling design compatible with Vercel rather than introducing a queue platform.

### 5. Document deletion and trusted provenance can conflict

Recommendation: distinguish deleting the binary from removing a trusted fact. Warn when evidence supports confirmed data, delete binaries and previews on request, and retain a minimal, non-content provenance tombstone when justified and disclosed.

### 6. The term “ownership” can imply legal proof

Recommendation: position the record as a personal organizer of evidence, not legal certification of title, warranty eligibility, or authenticity. Reflect this in future onboarding and terms.

## Change control

Before pulling a deferred feature into MVP, document:

1. the user problem it resolves in the Phase 1 journey;
2. the new data, permission, privacy, and failure states it creates;
3. the milestone it enters and what moves out; and
4. the updates required across PRD, user flows, IA, data model, AI contract, security, and acceptance scenarios.
