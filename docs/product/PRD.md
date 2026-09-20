# Product requirements document

## Current release — 16 September 2026

The [approved public demo scope](demo-scope.md) takes precedence over the historical product
roadmap below. Real image/PDF/text extraction produces reviewable drafts. Confirmed records,
edits and source previews live only in this tab's memory; refreshing restores synthetic samples.
No item database persistence or 24-hour retention is part of this release. Preserve the existing
UI, category icons and shared collection. Public usage/privacy safeguards remain release gates.

## 1. Summary

Approved 13 September 2026: a narrow persistent personal prototype uses Supabase anonymous
sessions and per-user RLS, with no login UI, sharing, file storage, or Gemini. See
`../engineering/supabase-items.md` for the approved schema simplifications and limitations.

Ownership is a consumer application that turns scattered purchase evidence into a dependable, long-lived record of a physical item. It helps a person answer practical questions such as:

- What exactly did I buy, when, and from whom?
- Is it still under warranty, and what evidence do I have?
- What needs attention soon?
- Where is the item and what has happened to it?
- What information do I need when something goes wrong?

The product reduces manual entry by extracting candidate facts from uploads. It earns trust by making extraction reviewable, preserving sources, showing uncertainty, and never treating generated content as verified evidence.

## 2. Target user and job

The initial user is an individual or household member who owns several appliances, electronics, and other durable goods, but does not maintain formal records. Their primary job is:

> When I need to understand, maintain, claim warranty for, or retire something I own, help me find reliable information and take the next sensible action without searching across apps, paper, email, and memory.

The product is not enterprise asset management, inventory accounting, or a marketplace.

## 3. Goals

### MVP goals

1. Let a user register an item from text, an image, or a PDF with minimal typing.
2. Make AI-proposed facts easy to inspect, correct, and confirm.
3. Create a useful ownership page with facts, source documents, warranty, location, reminders, service history, and lifecycle history.
4. Surface a small, honest list of items needing attention.
5. Provide a focused “Something's wrong” view using verified information already stored for the item.
6. Preserve item history when it is replaced or archived.
7. Demonstrate the complete experience in mock AI mode without paid API use.

### Success signals for the polished demo

- A first-time user can create a confirmed item from a sample upload without instructions.
- The user can distinguish proposed, confirmed, missing, and conflicting information.
- Every important AI-proposed value can be traced to an uploaded source.
- A user can identify the next attention item from the dashboard within a few seconds.
- The “Something's wrong” view never presents unverified contact details or maintenance guidance as fact.
- The demo remains complete and coherent when Gemini is unavailable.

Instrumented product metrics are a post-demo concern. During the demo phase, use scenario-based acceptance testing rather than inventing conversion targets.

## 4. MVP scope

### 4.1 Dashboard

The dashboard is an action-focused home screen, not an analytics page. It must show:

- items needing attention, ordered by urgency;
- warranties expiring soon;
- upcoming and overdue user-created reminders;
- items with incomplete essential information;
- a compact view of recently added items; and
- an obvious Add item action.

Each attention card must explain why it appears and link to a relevant action. The dashboard must handle a new household with no items and a household with no current alerts.

### 4.2 Add item and source upload

The user can begin with:

- typed or pasted text;
- supported images such as JPEG, PNG, HEIC where the platform can process it; or
- PDF documents.

The flow supports one or more source files for a single new item, subject to documented size and count limits. It must:

- explain what will be extracted;
- show upload progress and recoverable failures;
- permit removing a file before processing;
- classify the source where possible without requiring it; and
- create no trusted item facts before confirmation.

The MVP does not need email import, retailer connections, bulk import, camera scanning, or automatic splitting of a multi-item invoice. If a source contains multiple products, the UI asks the user which single item to register and treats automatic multi-item creation as later scope.

### 4.3 AI extraction and confirmation

The extraction proposes these fields when supported by evidence:

- product name;
- category;
- brand;
- model;
- serial number;
- retailer;
- purchase date;
- purchase price and currency;
- warranty duration; and
- warranty expiry date.

For every proposed fact, the review screen must support:

- value, confidence band, and source reference;
- accept, edit, or leave blank;
- conflict display when sources disagree;
- a clear distinction between source-derived and user-entered values; and
- confirmation as a deliberate user action.

Missing values remain missing. The system may calculate warranty expiry from a confirmed start date and confirmed duration, but must label it as derived and retain both inputs.

### 4.4 Item detail

An item detail page is the canonical ownership record. It must include:

- identity: name, category, brand, model, serial number, photo if available;
- purchase: retailer, date, price, and supporting source;
- warranty: known coverage, dates, evidence, status, and missing-information state;
- documents: uploaded sources and user-assigned document types;
- physical location;
- reminders and applicable maintenance entries;
- service events;
- support information with verification/source labels;
- lifecycle status and history; and
- actions for editing, reporting a problem, replacing, and archiving.

The page must remain useful with partial data. Unknown fields are not filled with plausible values.

### 4.5 Warranty and maintenance timeline

The timeline combines dated, meaningful events:

- purchase;
- warranty start and expiry when known;
- user-created reminders;
- recorded service events; and
- lifecycle changes.

Maintenance is item-specific. The system does not create recurring schedules from category alone. In the MVP, maintenance entries are user-created or copied from evidence the user explicitly confirms.

### 4.6 Something's wrong

From an item, the user can open a focused problem view that shows:

- current warranty status and how it was determined;
- relevant invoices, warranty cards, manuals, and service records;
- missing information commonly required for a claim, based only on known record completeness;
- verified official support information already attached to the item; and
- basic, safety-conscious guidance only when its source is stored and visible.

The MVP does not diagnose faults, generate repair instructions, scrape support contacts, submit claims, or recommend repair versus replacement. When the record lacks reliable guidance, the product says so and helps the user gather their documents.

### 4.7 Replace and archive

The user can change an item from active to replaced, sold, gifted, lost, or disposed. This operation:

- records a dated lifecycle event;
- preserves the record and documents;
- removes non-active items from default active lists while keeping them accessible; and
- optionally links a replaced item to its replacement.

Creating the replacement may reuse non-unique context such as category and location, but not serial number, warranty, invoice, or other item-specific evidence.

### 4.8 Household and location model

The system models a household as the access boundary. A personal user receives a private household automatically. The MVP exposes one active household and a simple household name; invitations, roles beyond owner/member, and switching between several households are deferred.

Physical locations form a hierarchy within a household, for example `Home / Kitchen`. Moving an item changes location, not ownership or access.

## 5. Functional requirements

### Trust and provenance

- Important facts must record origin: user entry, extracted source, or deterministic derivation.
- AI extractions are immutable draft observations, not canonical item fields.
- A confirmation event records who accepted or edited a value and when.
- User edits take precedence in the current trusted view and do not erase earlier evidence.
- Conflicting facts remain visible in provenance history until resolved.

### Attention model

An attention item is created only from deterministic conditions, such as:

- a confirmed warranty expiry within a configured display window;
- an overdue or upcoming confirmed reminder; or
- an essential field explicitly marked incomplete.

Do not generate anxiety through vague health scores or invented urgency. Warranty status must support `active`, `expired`, `unknown`, and `not_applicable`; absence of a date means `unknown`, not `expired`.

### Documents

- Preserve the original upload as evidence.
- Store file metadata, checksum, uploader, and access scope.
- Permit a user to label a document as invoice, receipt, warranty card, manual, product photo, service record, or other.
- Do not expose raw storage paths to unauthorized users.
- Deleting a document that supports trusted facts requires a warning; provenance metadata may be retained even if the binary is deleted under a privacy request.

### Failure states

- If upload fails, preserve entered context and allow retry.
- If extraction fails or times out, let the user retry or enter details manually.
- If extraction returns invalid data, show a general failure rather than partial unvalidated output.
- If a file is unsupported, explain accepted formats and limits before upload when possible.
- If Gemini is unavailable, mock mode remains demonstrable; production does not silently substitute mock facts.

## 6. Non-functional requirements

- Responsive from small mobile screens through desktop.
- Keyboard accessible, screen-reader labeled, and usable at 200% text zoom.
- Strong tenant isolation through Supabase Row Level Security from the first database milestone.
- Private storage by default with short-lived signed URLs.
- No secrets in client bundles, logs, analytics, or repositories.
- Graceful handling of AI latency and provider limits.
- Common dashboard and item-detail reads should feel immediate on normal consumer broadband; optimize only after measuring.
- Audit important mutations: confirmation, trusted fact edit, document deletion, support-data change, lifecycle change, and membership change.

## 7. Out of MVP

- Financial dashboards, depreciation, total portfolio value, and insurance valuation
- Repair-versus-replace recommendations
- Resale listings, price estimates, and marketplace integrations
- Retailer, email, calendar, or manufacturer integrations
- Automated support discovery, warranty registration, or claim submission
- Fault diagnosis and AI-generated repair procedures
- Multiple active household switching, invitations, granular roles, and guest access
- Bulk import, multi-item invoice splitting, barcode scanning, and OCR-only scanning workflows
- Push, SMS, or email notification delivery; the MVP shows reminders in-app
- Native mobile applications and offline sync
- Microservices, queues, vector databases, and background workflow platforms
- Automatic maintenance schedules based solely on inferred category

## 8. Assumptions and open decisions

- The demo begins with one authenticated user and one household, even if auth UI is staged after the local prototype.
- Currency is stored with price; the app does not convert or aggregate currencies in the MVP.
- Dates use the household timezone for display and ISO dates for date-only facts.
- Category is a flexible controlled vocabulary rather than a rigid product taxonomy.
- Source highlighting can initially reference a document and page; precise bounding boxes are desirable but not required for the first working milestone.
- File limits, supported MIME types, and retention copy must be finalized before public testing.

## 9. Acceptance scenarios

1. Upload a sample air-fryer invoice, review the extracted purchase facts, correct one field, and create the item. The confirmed field shows user correction provenance; the original proposal remains inspectable.
2. Upload a source with no warranty information. The resulting item says warranty unknown and creates no expiry alert.
3. Add a confirmed warranty and a user-created maintenance reminder. Both appear correctly on the timeline and dashboard at the appropriate time.
4. Open “Something's wrong” for an item with an invoice but no official support record. The view exposes the invoice and states that verified support information is unavailable; it does not generate a phone number.
5. Replace an item and link a new item. Both histories remain accessible, the old item is no longer active, and no unique facts are copied.
6. Attempt to access another household's item or document. Database policy denies access even if the identifier is known.

## 10. Product risks

- Users may over-trust confident-looking AI output. Mitigation: field-level review, evidence, neutral confidence language, and explicit confirmation.
- Invoices contain sensitive personal information. Mitigation: private storage, minimization, redacted logs, clear deletion, and tenant-level authorization.
- Warranty rules can be ambiguous or conditional. Mitigation: store what the evidence says, separate dates from status derivation, and allow `unknown`.
- A universal maintenance model can create false tasks. Mitigation: user-confirmed, item-specific schedules only.
- Household collaboration can expand permission complexity. Mitigation: design the boundary now, expose simple single-household behavior in MVP, and add invitations later.
