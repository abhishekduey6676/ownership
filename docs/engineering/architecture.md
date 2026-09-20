# Engineering architecture

## Current release — 16 September 2026

The [approved demo scope](../product/demo-scope.md) takes precedence over the future persistent
pipeline below. One Next.js app uses a per-provider memory repository and useSyncExternalStore;
there is no module-global collection or browser persistence. Confirmation and edits never call
an item API. The retired /api/items route returns 410 without database access. Gemini remains
server-only, sending inline sources and returning validated drafts. Supabase anonymous identity
is established only for analysis usage checks; no item data is passed to it. The old database
adapter and migration are inactive historical code. Production AI stays gated on public cost
and abuse safeguards. See [session-only demo](session-only-demo.md).

Update — 20 September: Supabase also stores approved minimal [daily usage counters](analysis-usage-limits.md).
One atomic reservation enforces 5 attempts per identity and 50 total per UTC day before Gemini;
no item/source content enters these tables. Production extraction remains disabled.

## 1. Architecture goals

- Keep the portfolio demo inexpensive, understandable, and easy to run.
- Enforce household isolation and private document access from the beginning.
- Separate untrusted extraction output from trusted domain data.
- Make AI providers replaceable without changing product workflows.
- Support graceful manual operation when AI is unavailable.
- Avoid infrastructure whose operational cost exceeds current product learning.

## 2. System context

```text
Browser
  │ HTTPS
  ▼
Next.js application on Vercel
  ├── UI and server actions / route handlers
  ├── Domain services and validation
  ├── AI provider interface ──► Mock provider or Gemini API
  └── Supabase client
         ├── PostgreSQL + Row Level Security
         ├── Private Storage buckets
         └── Auth (introduced with authenticated milestone)
```

This is one deployable web application. There are no microservices or queues in MVP.

## 3. Responsibilities

### Client components

- File selection and preflight validation
- Upload progress and retry UI
- Review and correction interactions
- Responsive presentation and optimistic feedback for low-risk actions

Clients never receive AI provider secrets or privileged Supabase service keys. They do not decide authorization or promote draft facts to trusted facts independently.

### Next.js server boundary

- Authenticate the caller and resolve active household membership
- Issue or process private uploads using least-privilege access
- Validate input and call domain services
- Invoke the selected AI adapter
- Validate and persist extraction envelopes
- Transactionally confirm selected facts
- Compute deterministic attention and warranty projections from trusted data
- Produce time-limited document access URLs
- Write audit events for consequential changes

Prefer Server Components for read-heavy screens and server actions or route handlers for mutations. Keep provider SDK imports on the server.

### Supabase PostgreSQL

- Canonical records, revision history, extraction observations, provenance, and audit data
- Household isolation with Row Level Security
- Database constraints for tenant consistency and valid state transitions where practical
- Transactional confirmation of draft facts

### Supabase Storage

- Private original uploads and optional derived previews
- Paths partitioned by household and immutable document ID
- Access through authenticated requests or short-lived signed URLs

The database stores metadata and provenance; binaries stay in Storage.

### AI providers

- `mock`: deterministic, fixture-driven responses for development, tests, and portfolio demonstration
- `gemini`: multimodal extraction using the configured Gemini model and server-side credentials

Both return the same validated provider-neutral envelope. A provider may propose facts and source references but cannot write trusted item fields.

## 4. Suggested code boundaries

```text
app/                     routes, layouts, server actions
components/              product and UI components
lib/auth/                session and household resolution
lib/domain/              item, fact, warranty, reminder, lifecycle services
lib/ai/contracts.ts      provider-neutral request/response types
lib/ai/provider.ts       interface and provider selection
lib/ai/providers/        mock and Gemini adapters
lib/ai/validation.ts     schema validation and normalization
lib/supabase/            browser/server clients
lib/storage/             upload and signed-access helpers
supabase/migrations/     schema and RLS policies
fixtures/ai/             safe deterministic mock cases
```

Keep domain rules out of React components and provider adapters. The UI may format a status, but the server determines it from trusted facts.

## 5. Main write paths

### Upload and extract

1. Server validates membership and creates a draft intake session.
2. File metadata is validated; binary uploads to a private household path.
3. A document row records checksum, MIME type, size, uploader, and processing state.
4. The server creates an extraction run and invokes the configured adapter.
5. The adapter response is schema-validated, normalized, and stored as immutable draft observations with source links and confidence.
6. Review UI reads the stored observations. It does not trust a provider response held only in client state.

For the MVP, extraction can run within a bounded request. If provider latency exceeds hosting limits, introduce a minimal database-backed polling job executed by a scheduled/serverless mechanism; do not add a queue preemptively.

### Confirm an item

1. Client submits selected observation IDs plus edits and explicit blank decisions.
2. Server re-fetches observations, validates membership and the submitted values, and rejects stale or foreign references.
3. One database transaction creates or updates the item, appends trusted fact revisions, records provenance and confirmation, and marks the intake confirmed.
4. Derived values are recomputed only from trusted inputs and labeled as derived.

### Edit a trusted fact

Create a new revision with actor and timestamp, then update the current projection. Never mutate an extraction observation. Optimistic concurrency or an `updated_at` precondition prevents silently overwriting another edit.

### Change lifecycle status

Append a lifecycle event and update the item's current status transactionally. Replacement uses an explicit relation between two items in the same household.

## 6. Read models

Start with ordinary SQL views or query functions rather than a separate search or analytics system.

- `item_summary`: current trusted identity, location, status, warranty projection, and next attention.
- `dashboard_attention`: deterministic union of overdue/upcoming reminders, known warranty expiry, and explicit incompleteness.
- `item_timeline`: normalized projection of purchase, warranty, reminder, service, location, and lifecycle events.

These are projections over source tables, not new authorities. Add indexes for household, item, status, relevant dates, and normalized search terms after measuring query plans.

## 7. Configuration

Required server variables should include:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-only; only if a narrow operation requires it
AI_MODE=mock                     # mock | gemini
GEMINI_API_KEY=                  # required only for gemini
GEMINI_MODEL=                    # explicit, reviewed model identifier
```

Application startup validates the mode and required variables. Unknown modes fail closed. Production must not default to mock responses.

## 8. Validation and errors

- Use one runtime schema system at server boundaries and for AI envelopes.
- Validate MIME type using content inspection where feasible, not extension alone.
- Normalize dates to date-only values when time is not evidenced.
- Store money as integer minor units with ISO currency.
- Preserve provider raw output only when needed for debugging/audit, access-controlled and retention-limited.
- Return stable, user-safe error codes; keep secrets and raw document content out of logs.
- Make creation and confirmation endpoints idempotent to tolerate retries.

## 9. Testing strategy

- Unit tests for warranty status, attention ordering, lifecycle transitions, normalization, and provider contract validation
- Contract tests that run identical fixture cases through mock and Gemini response normalization
- Database tests for constraints, transactional confirmation, and RLS isolation
- Integration tests for upload → extraction → confirmation → item detail
- End-to-end acceptance scenarios from the PRD, including provider failure and unknown warranty

The mock provider should offer fixtures for clean extraction, missing fields, low confidence, conflicting sources, multiple products, invalid output, and provider failure.

## 10. Observability and cost controls

- Structured logs with request/run IDs, never source content or sensitive fact values
- Record provider name, model, latency, token/usage metadata when available, and outcome
- Per-user or household extraction limits to protect the free tier
- File count and size limits before provider invocation
- Basic failure-rate and latency monitoring using hosting-native tools

## 11. Deferred architecture

Do not add until a demonstrated need exists:

- microservices, event buses, or managed queues;
- vector search or embeddings;
- a standalone OCR pipeline;
- automated web crawling;
- real-time subscriptions for ordinary record changes;
- cross-region data replication;
- a generic rules engine for every product category.
