# Data model

## Current release — 16 September 2026

See [approved demo scope](../product/demo-scope.md). Current records are ItemFields plus ID,
confirmation metadata and browser-only document references inside one in-memory repository.
A refreshed or independently opened tab starts from pristine synthetic samples. No item rows,
revisions or original sources are written to PostgreSQL by this demo. The 24-hour expiry schema
is withdrawn. Legacy database contents are not deleted by this switch; anonymous AI-quota
identity has a separate lifecycle. The household/persistent model below is future scope.

Update — 20 September: the private `ownership_usage` schema holds a singleton daily total
and per-identity UUID/date/attempt counters, not item records. See [usage schema and lifecycle](analysis-usage-limits.md).
Older counters are removed at the next UTC day's first reservation, not by an exact 24-hour timer.

## 1. Modeling principles

1. Every user-owned record belongs to a household access boundary.
2. AI observations are immutable drafts, separate from trusted fact revisions.
3. Important facts have provenance; confidence belongs to an observation, not to truth.
4. Current values are projections over revision history, not destructive overwrites.
5. Lifecycle changes and replacements preserve history.
6. Physical location is separate from access and lifecycle ownership.
7. Money has currency; dates do not imply a time that was never evidenced.

Use UUID primary keys, `timestamptz` audit timestamps, `date` for evidence that contains only a calendar date, and PostgreSQL enums or constrained text for small stable state sets.

## 2. Relationship overview

```text
users ──< household_members >── households
                                  │
                                  ├──< locations ──< items
                                  └──< items
                                        ├──< documents
                                        ├──< extraction_runs ──< extracted_facts ──< fact_sources >── documents
                                        ├──< item_fact_revisions ──< fact_sources
                                        ├──< warranties
                                        ├──< reminders
                                        ├──< service_events ──< service_event_documents >── documents
                                        ├──< support_information
                                        ├──< lifecycle_events
                                        └──< item_relationships >── items
```

Intake documents may exist before an item is confirmed. They belong to a household and an intake session, then receive an `item_id` during confirmation.

## 3. Identity and tenancy

### `users`

Application profile keyed to Supabase Auth.

| Column | Notes |
| --- | --- |
| `id uuid pk` | Matches `auth.users.id` |
| `display_name text` | Optional |
| `created_at`, `updated_at` | Audit timestamps |

Do not duplicate email or authentication secrets unless the product needs a controlled profile copy.

### `households`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Tenant identifier |
| `name text` | User-facing name |
| `timezone text` | IANA timezone for display and date rules |
| `created_by uuid fk users` | Initial owner |
| `created_at`, `updated_at` | Audit timestamps |

### `household_members`

| Column | Notes |
| --- | --- |
| `household_id uuid fk` | Composite primary key with `user_id` |
| `user_id uuid fk` | Member |
| `role text` | `owner` or `member` initially |
| `status text` | `active`, later `invited` or `removed` |
| `joined_at`, `updated_at` | Audit timestamps |

At least one active owner must remain. Invitation tokens and flows are later-phase additions, not nullable columns on this table.

## 4. Locations and items

### `locations`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Location identifier |
| `household_id uuid fk` | Access boundary |
| `parent_id uuid fk locations` | Nullable hierarchy parent |
| `name text` | e.g. Home, Kitchen |
| `sort_order int` | Stable display order |
| `created_at`, `updated_at` | Audit timestamps |

Constraints prevent self-parenting and cross-household parents. Detect deeper cycles in a transaction or recursive constraint function. Unique normalized sibling names are helpful but should not block legitimate similarly named locations in different branches.

### `items`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Item identifier |
| `household_id uuid fk` | Access boundary |
| `location_id uuid fk locations` | Nullable current physical location |
| `display_name text` | Required trusted name after confirmation |
| `category text` | Flexible controlled vocabulary, nullable |
| `status text` | `active`, `replaced`, `sold`, `gifted`, `lost`, `disposed` |
| `primary_image_document_id uuid` | Nullable product photo reference |
| `created_by uuid fk users` | Creator |
| `created_at`, `updated_at` | Audit timestamps |
| `archived_at timestamptz` | Set for non-active states if useful for filtering |

`display_name`, `category`, `location_id`, and `status` are useful current projections. Their changes must still create fact, location, or lifecycle history. Cross-household foreign keys should be enforced with composite unique keys plus composite foreign keys where possible.

## 5. Intake and documents

### `intake_sessions`

Tracks an unconfirmed add-item flow.

| Column | Notes |
| --- | --- |
| `id uuid pk` | Stable draft identifier |
| `household_id uuid fk` | Access boundary |
| `created_by uuid fk users` | Actor |
| `status text` | `draft`, `processing`, `ready`, `confirmed`, `failed`, `abandoned` |
| `context_text text` | Optional user-supplied context |
| `confirmed_item_id uuid fk items` | Set once confirmed |
| `created_at`, `updated_at`, `expires_at` | Retention control |

### `documents`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Document identifier |
| `household_id uuid fk` | Access boundary |
| `item_id uuid fk items` | Nullable until confirmation |
| `intake_session_id uuid fk` | Nullable after direct item upload |
| `kind text` | `invoice`, `receipt`, `warranty_card`, `manual`, `product_photo`, `service_record`, `text`, `other` |
| `original_filename text` | Display only; never used as storage key |
| `storage_bucket`, `storage_key` | Private object reference |
| `mime_type text`, `size_bytes bigint`, `sha256 text` | Validation and integrity |
| `processing_status text` | `uploaded`, `processing`, `ready`, `failed`, `deleted` |
| `uploaded_by uuid fk users` | Actor |
| `created_at`, `deleted_at` | Retention state |

A plain-text source may store sanitized text in a private column or a private object. Prefer a uniform document abstraction. A deleted binary can retain a minimal tombstone so provenance does not misleadingly disappear.

## 6. AI draft layer

### `extraction_runs`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Run identifier |
| `household_id uuid fk` | Access boundary |
| `intake_session_id uuid fk` | Draft being processed |
| `provider text` | `mock` or `gemini` |
| `model text` | Exact model or fixture version |
| `schema_version int` | Output contract version |
| `status text` | `queued`, `running`, `succeeded`, `failed`, `superseded` |
| `started_at`, `completed_at` | Timing |
| `error_code text` | Safe classified failure, no document content |
| `usage_metadata jsonb` | Minimal provider usage/cost fields |
| `created_by uuid fk users` | Actor |

### `extracted_facts`

One immutable candidate observation per field/value.

| Column | Notes |
| --- | --- |
| `id uuid pk` | Observation identifier |
| `household_id uuid fk` | Access boundary |
| `extraction_run_id uuid fk` | Producing run |
| `fact_key text` | Versioned key such as `purchase.date` |
| `value_json jsonb` | Typed value matching contract |
| `normalized_value_json jsonb` | Optional deterministic normalization |
| `confidence numeric(4,3)` | Provider estimate from 0 to 1, nullable |
| `confidence_band text` | `high`, `medium`, `low`, `unknown` |
| `status text` | `proposed`, `accepted`, `rejected`, `superseded` |
| `created_at` | Immutable observation time |

Confidence never transfers to trusted facts as a truth score. Conflicting observations remain separate rows.

### `fact_sources`

Links either an extracted fact or a trusted revision to evidence.

| Column | Notes |
| --- | --- |
| `id uuid pk` | Link identifier |
| `household_id uuid fk` | Access boundary |
| `extracted_fact_id uuid fk` | Nullable; exactly one target type |
| `item_fact_revision_id uuid fk` | Nullable; exactly one target type |
| `document_id uuid fk` | Evidence document |
| `page_number int` | Nullable, one-based |
| `locator_json jsonb` | Optional bounding box or text span |
| `excerpt text` | Short evidence excerpt, access-controlled |
| `source_role text` | `direct`, `supporting`, `conflicting` |

A check constraint requires exactly one of `extracted_fact_id` and `item_fact_revision_id`.

## 7. Trusted facts and revisions

### `item_fact_revisions`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Revision identifier |
| `household_id uuid fk` | Access boundary |
| `item_id uuid fk` | Parent item |
| `fact_key text` | e.g. `identity.brand`, `purchase.price` |
| `value_json jsonb` | Typed trusted value; nullable for explicit clearing |
| `revision_no int` | Monotonic per item and fact key |
| `origin_type text` | `user_entered`, `extraction_confirmed`, `derived` |
| `confirmed_from_fact_id uuid fk extracted_facts` | Nullable draft provenance |
| `derived_from_revision_ids uuid[]` | Or normalized join table if richer queries are needed |
| `is_current boolean` | One current revision per item/fact key |
| `created_by uuid fk users` | Actor |
| `created_at` | Revision time |

Enforce a unique partial index on `(item_id, fact_key) where is_current`. Confirmation and edits flip the earlier revision and insert the new revision in one transaction.

Typed values use an allowlisted fact-key registry in code that defines schema, display label, and sensitivity. Do not accept arbitrary paths from the client. Frequently queried values may also be projected into `items`, `warranties`, or indexed generated columns.

## 8. Ownership features

### `warranties`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Warranty record |
| `household_id uuid fk`, `item_id uuid fk` | Parent and tenant |
| `kind text` | Manufacturer, retailer, extended, other |
| `provider_name text` | Nullable trusted value |
| `start_date date`, `end_date date` | Nullable; confirmed or derived |
| `duration_months int` | Nullable confirmed duration |
| `status_override text` | Nullable explicit `not_applicable`; avoid manual active/expired |
| `terms_note text` | Plain text, source-backed where possible |
| `created_by`, `created_at`, `updated_at` | Audit |

Active/expired/unknown is computed from trusted dates at read time. Warranty evidence links through fact revisions and documents; a direct `primary_document_id` may be used for convenience but is not the full provenance model.

### `reminders`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Reminder |
| `household_id uuid fk`, `item_id uuid fk` | Scope |
| `title text`, `note text` | User-facing content |
| `due_at timestamptz` | Next occurrence |
| `recurrence_rule text` | Nullable constrained recurrence representation |
| `source_fact_revision_id uuid fk` | Nullable confirmed guidance source |
| `status text` | `scheduled`, `completed`, `dismissed` |
| `created_by`, `created_at`, `updated_at`, `completed_at` | Audit |

Use a separate `reminder_occurrences` table when recurrence history is implemented; do not overwrite the only due date and lose completion history.

### `service_events`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Service event |
| `household_id uuid fk`, `item_id uuid fk` | Scope |
| `service_date date` | Event date |
| `provider_name text`, `summary text`, `outcome text` | User-entered |
| `cost_minor bigint`, `currency char(3)` | Nullable money pair |
| `created_by`, `created_at`, `updated_at` | Audit |

### `service_event_documents`

Join table linking service events to receipts, reports, or photos. Both sides must belong to the same household and item.

### `support_information`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Support record |
| `household_id uuid fk`, `item_id uuid fk` | Scope |
| `kind text` | `phone`, `email`, `url`, `address`, `note` |
| `label text`, `value text` | Display and destination |
| `source_document_id uuid fk` | Nullable stored evidence |
| `source_url text` | Nullable original official URL |
| `verification_status text` | `user_provided`, `source_confirmed`, `official_verified`, `unverified` |
| `verified_at timestamptz` | Nullable |
| `created_by`, `created_at`, `updated_at` | Audit |

MVP should normally expose user-provided or source-confirmed records. `official_verified` requires an explicit verification workflow, not an AI assertion.

### `lifecycle_events`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Event identifier |
| `household_id uuid fk`, `item_id uuid fk` | Scope |
| `from_status text`, `to_status text` | Transition |
| `effective_date date` | User-selected or event date |
| `note text` | Optional |
| `created_by`, `created_at` | Audit |

Items are not hard-deleted through lifecycle actions.

### `item_relationships`

| Column | Notes |
| --- | --- |
| `id uuid pk` | Relationship |
| `household_id uuid fk` | Both items must share this household |
| `from_item_id uuid fk items` | Prior item |
| `to_item_id uuid fk items` | New item |
| `relationship_type text` | `replaced_by` initially |
| `effective_date date`, `note text` | Context |
| `created_by`, `created_at` | Audit |

Prevent self-links and duplicate active replacement links. Whether one item can replace several should remain allowed for future consolidation, but the MVP UI handles one-to-one replacement.

## 9. Audit events

### `audit_events`

Append-only metadata for consequential operations.

| Column | Notes |
| --- | --- |
| `id uuid pk` | Event ID |
| `household_id uuid fk` | Tenant |
| `actor_user_id uuid fk` | Nullable only for documented system action |
| `action text` | Allowlisted action |
| `entity_type text`, `entity_id uuid` | Target |
| `metadata jsonb` | IDs and safe deltas; no document content or secrets |
| `created_at` | Event time |

## 10. Integrity and access requirements

- All nested writes verify the parent and child share a household.
- RLS derives access from active `household_members`; client-supplied household IDs are never sufficient.
- Unique partial indexes enforce one current fact revision and appropriate current relationships.
- Price and service cost require both amount and ISO currency or neither.
- End dates cannot precede start dates without an explicit exceptional-state design.
- Source page numbers are positive; confidence values stay within 0–1.
- Storage deletion and database tombstoning are coordinated and idempotent.
- Current projections and append-only history update in one transaction.

## 11. Deliberate simplifications

- No general asset-owner table: household is the MVP ownership/access context.
- No universal product-specification schema: use allowlisted common facts and category-specific extensions only when product behavior needs them.
- No event-sourcing framework: revision and event tables preserve the important history while ordinary relational tables serve current reads.
- No graph database: replacement and provenance relations fit PostgreSQL.
- No generic notification table until an outbound channel exists; reminders and in-app attention are sufficient.
