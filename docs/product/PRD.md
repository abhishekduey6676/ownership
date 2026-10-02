# Ownership Product Requirements Document

## Document control

Version 1.0 | 2 October 2026 | As built product specification

Audience: general readers, product and engineering collaborators, and portfolio reviewers.

Ownership helps people turn purchase evidence into organized item records. This document explains the problem, implemented experience, decisions and evidence still needed. It is a retrospective specification, not a claim that every intended capability is publicly available.

The code baseline is [main at ff78ad9](https://github.com/abhishekduey6676/ownership/tree/ff78ad9bf92252f1c390cbf43ba168a63c696a94). The [approved demo scope](demo-scope.md) remains authoritative over conflicting roadmaps. The [earlier roadmap](PRD-roadmap-archive.md) is archived. This Markdown file is the canonical source for the portfolio Word version.

The [public demo](https://ownership-rho.vercel.app) was recorded as successfully deployed on 27 September 2026. This is not a new live browser test. Code inspection confirms that production AI analysis is deliberately disabled; a deployed interface is not the same as a publicly enabled AI service.

## 1 Executive summary

Receipts and purchase notes often remain scattered across paper, scanned files and messages. A scan preserves a document without necessarily making its useful facts easy to retrieve. Ownership focuses on the next step: mapping purchase evidence into an editable record for a physical item.

The intended interaction is to provide an image, PDF or purchase description, inspect suggested fields, correct or clear them, and confirm an item. The confirmed item appears in one shared collection across Home, Items, Locations and Item Detail. Users decide what is saved.

The current product is a session based demo, not a permanent ownership vault. Added items, edits and source previews remain in the current tab's memory. Refresh restores synthetic samples. This limits application storage and cost, but prevents recovery and cross-device access. Visitors must not use it as their only purchase archive.

Real Gemini extraction is implemented for configured local development. The public deployment supports browsing and manual creation, but Analyze is blocked before provider processing. Public AI activation remains a separate release decision with unfinished safeguards and validation.

The project also demonstrates product management and practical AI judgment: defining value beyond OCR, separating suggestions from decisions, designing failure paths, controlling costs and reporting evidence without overstating it.

## 2 Problem and intended users

### Problem statement

The creator already uses Adobe Scan to preserve papers and read their text. The unmet need is not simply OCR. It is organizing scattered information into a useful item record: what was bought, where, for how much, when, and what warranty information is actually known.

The hypothesis is that assisted field entry followed by review can reduce the effort of organizing these facts. This has not been established through a measured comparative study.

### Jobs to be done

- A person with a receipt wants useful details organized without copying every field.
- A person without a receipt wants to record remembered facts without invented details.
- A person with a product problem wants known purchase facts and available evidence in one place.
- A first-time portfolio visitor wants to understand and try the product without a presenter or sensitive personal documents.

This release addresses those jobs only within a temporary visit. It does not satisfy the long-term job of maintaining a recoverable purchase history.

### Early evidence

The creator reports that two friends tried or validated the product. Feedback concerned uploading pictures through a phone and handling sensitive data. These are qualitative signals, not proof of demand, repeat use, task completion or extraction accuracy.

No participant quotes, test dates, device breakdown, timings, completion counts or accuracy scores were supplied. This PRD does not invent them. The feedback supports investigating mobile intake and understandable data handling; it does not establish that QR pairing is the necessary solution.

## 3 Goals and boundaries

### Release goals

1. Make structured purchase records understandable on a first visit.
2. Support editable drafts from an image, PDF or description when analysis is enabled.
3. Preserve edited and cleared values through confirmation and collection views.
4. Keep manual entry usable when AI is unavailable or inappropriate.
5. Communicate missing facts, calculated dates and temporary storage honestly.
6. Keep credentials server side and paid analysis bounded.
7. Produce credible portfolio evidence without presenting a demo as a validated business.

### Outside this release

Permanent item or file storage, recoverable accounts, household sharing, cross-device synchronization, claims submission, repair diagnosis, automated support discovery, reminders, maintenance scheduling, bulk extraction and durable lifecycle history are excluded. Phone-to-desktop QR transfer and a real appliance-photo library are ideas, not shipped features. There is no image generation per item.

### Short scope history

Ownership began as a broader, persistent ownership-record product and briefly used database-backed items. It was narrowed to a refresh-reset demo for cost, privacy and delivery focus; the intermediate 24-hour item-retention proposal was withdrawn.

## 4 Capability and availability

| Capability | Current implementation | Availability boundary |
| --- | --- | --- |
| Home, Items, Locations and Item Detail | Shared sample and confirmed-item views | Public interface; current items are temporary |
| Manual creation and editing | Editable fields, confirmation and creation | No Gemini or AI allowance required |
| Image and PDF intake | Selection, preview, validation and analysis adapter | Public UI exists; production analysis is blocked |
| Purchase descriptions | Text input and the same review contract | Real extraction only in configured local development |
| Gemini extraction | Server adapter, validation and draft response | Explicitly disabled in production |
| Synthetic examples | Text scenarios and downloadable PNG and PDF fixtures | Analyze uses the ordinary endpoint, not an offline mock result |
| Something is wrong | Warranty information, documents, copyable facts and honest gaps | No verified support lookup or repair guidance |
| AI usage limits | Anonymous identity and shared daily counters | Not item persistence |
| Appliance visuals | Category icons with a generic fallback | No generated images or maintained photo library |

Sample-oriented onboarding describes the intended AI experience although the production gate prevents completing it. This is an expectation gap, not evidence that public extraction works.

## 5 Decisions and tradeoffs

### Organize facts rather than compete on scanning alone

The proposed value is turning evidence into fields that can be reviewed and retrieved. OCR enables this but is not sufficient differentiation. Form quality, trust and follow-through matter as much as recognition.

### Require confirmation rather than auto save

AI output remains a draft. Visitors can edit, add or clear values before confirming. The review step adds effort but reduces the risk of a misread or invented fact silently becoming a record. Confirmation means user accepted, not independently verified.

### Prefer missing facts to plausible completion

Unknown serials, prices or warranty terms should remain blank rather than being inferred from what is typical. This produces incomplete records, deliberately prioritizing uncertainty over unsupported certainty.

### Keep item content temporary

One memory-based collection avoids persistent item storage in this demo. Refresh therefore loses the visitor's changes. The retention notice is part of the product contract, not a hidden implementation detail. A persistent release would require new access, retention and recovery decisions.

### Separate identity from item storage

Supabase anonymous identity and minimal counters support analysis limits. They do not imply a recoverable account or saved collection. A quota cookie cannot restore items.

### Keep manual entry independent of AI

Provider failure, exhausted allowances and production restrictions do not prevent manual creation. There is no silent fallback to fictional extraction. Consequently the public demo currently demonstrates record management more fully than AI.

### Limit one input to one item

Multi-item receipts require grouping and attribution decisions, so bulk extraction is deferred. Category icons provide recognition without generation costs; they illustrate a category rather than proving product identity.

### Preserve the existing interface

The Next.js, TypeScript and Tailwind application retains its lime and violet visual language, shared navigation and cards. Help is available through a disclosure rather than hover alone; essential processing and refresh notices remain visible. This PRD does not redesign screens or migrate frameworks.

## 6 Journeys and states

### First visit and samples

Home introduces the task and links to sample intake. Visitors can choose a complete synthetic invoice, an incomplete invoice or a purchase description. Downloadable PNG and PDF examples support file intake without personal documents. Examples are labeled synthetic.

Sample selection neither grants consent nor starts analysis. Text examples appear in the editable description field. When analysis is permitted, they use the normal provider route, not prefilled successful AI responses. In production they encounter the disabled-analysis state and visitors can continue manually.

### Add Item

Source → Analyze → Confirm → Created → Shared collection

1. **Source.** Choose a supported file, enter text, select a sample or use manual entry. Input is retained between wizard steps, but the draft is not promised to survive leaving the Add Item route.
2. **Analyze.** Acknowledge external processing and request analysis. In an enabled environment the server validates input, verifies quota identity, reserves an attempt and invokes Gemini. Pending work is not shown as a created record.
3. **Confirm.** Review every field. Source-derived, missing, calculated, edited and cleared values are distinguished. Correct the record and explicitly confirm. Manual entry joins this step with a blank draft.
4. **Created.** Success appears after the repository accepts the final values. Open the item, return Home or try another input.
5. **Collection.** All relevant pages use the same item state. Trying another input resets intake, not previously confirmed records.

Revisiting an unchanged source can reuse the draft and preserve corrections without another paid request. Cancel requests an abort and prevents a late result from becoming the active draft. Failure keeps the selected input available for retry or manual entry; a reserved attempt may still count.

### Find and edit

Home shows the collection count, up to four recent items and a simple missing-purchase-date attention cue. Items performs case-insensitive substring search across name, brand, model, serial number, category, location and retailer. Locations groups by location text, with an explicit unset-location group.

Item Detail shows fields, documents and a limited purchase, confirmation and expiry timeline. Editing updates shared state. Location is a descriptive grouping, not a household, transfer of ownership or permission boundary. There are no additional category/location filter controls or reminder engine.

### Something is wrong

Dashboard → Item → Item Detail → Something is wrong

The page assembles known warranty information, available documents and copyable item facts. It shows missing official support and troubleshooting information rather than inventing a number, validating a claim or diagnosing a repair. Clipboard failure has an error state. A problem note is component-local and can disappear when leaving; it is not saved service history.

### Refresh and missing records

In-app navigation preserves the collection. Refresh restores pristine samples and removes new items and edits from application memory. A new tab has an independent collection. A now-missing item link shows an unavailable state with navigation back into the app, not a false recovery promise.

## 7 Fields and business rules

| Field | Meaning | Current rule |
| --- | --- | --- |
| Product name | What the item is | Required after trimming whitespace |
| Category | Product type | Optional text; influences an illustrative icon |
| Brand | Stated brand or manufacturer | Optional; not inferred from typical products |
| Model | Model identifier | Optional; unknown remains blank |
| Serial number | Individual identifier | Optional; clearly indicate when not found |
| Retailer | Where it was purchased | Optional source or user-supplied fact |
| Purchase date | Recorded purchase day | Optional valid calendar date |
| Purchase price | Amount in rupees | Optional finite nonnegative value; no currency conversion |
| Warranty duration | Recorded coverage period | Optional text, not verified policy terms |
| Warranty expiry | Stated or calculated last day | Optional valid date; cannot precede purchase when both exist |
| Location | Where the item is kept | Optional text; blank groups under Location not set |

The repository also assigns an ID, creation timestamp, confirmation marker, documents and status. Source association does not mean permanent file storage. Initial sample items are synthetic and separate from additions.

### Dates and warranty

Words such as today resolve against a server reference date in the visitor's validated timezone, included in the review context. They do not use the fixed sample-status date.

If purchase date and a recognized duration exist but expiry does not, the system can calculate expiry assuming coverage starts on purchase. It adds the duration, clamps an invalid anniversary to month end, then subtracts one day for an inclusive period. For example, 10 September 2026 plus two years becomes 9 September 2028. Actual warranty terms may differ, so this is a proposal requiring review.

Recognized duration expressions cover supported numeric month/year wording up to 120 months. Unrecognized wording need not produce an expiry. Explicit expiry is retained. Draft edits to date/duration update an untouched calculated expiry, while a manually cleared or overridden expiry is preserved. The confirmed-item edit form does not automatically recalculate expiry; related dates need manual review.

Status currently uses the fixed synthetic reference date 12 September 2026, including for new records. Blank expiry is unknown; otherwise the label is active or expired relative to that date. This is not current warranty eligibility and has no expiring-soon calculation. Live-date status is a gap, not a shipped capability.

### Currency and provenance

The form is INR-based. Extraction clears a price when currency is unknown or non-INR and warns rather than converting it. Review includes short source evidence and uncertainty information, but these are model-provided aids, not independent verification or calibrated probabilities.

Per-field extraction evidence and edit history are not retained as a durable audit trail in the confirmed item model. It keeps accepted fields and document association, not a complete history of how every value was obtained.

## 8 Functional acceptance criteria

These criteria describe the implemented contract unless restricted above. They are not claims that every scenario has been observed in a browser.

| ID | Requirement | Acceptance condition |
| --- | --- | --- |
| IN 01 | One input | One supported file or nonempty text; combined or duplicated sources rejected |
| IN 02 | Deliberate processing | Source selection alone makes no AI request; acknowledgment required |
| IN 03 | Draft continuity | Step navigation preserves input and edits; unrelated source changes do not silently reuse facts |
| AI 01 | Structured proposals | Validate output before review; missing evidence leaves a field blank |
| AI 02 | Honest failure | Error and manual path instead of fictional fallback results |
| RV 01 | User control | Every field editable or clearable; required/invalid values block confirmation |
| RV 02 | Final values | Saved item includes corrections and cleared optional fields |
| SV 01 | Duplicate protection | Repeated save ID does not create another item or overwrite a record |
| SV 02 | Truthful success | Created follows successful repository creation |
| ST 01 | Shared collection | Home, search, location grouping and detail reflect additions/edits |
| ST 02 | Honest reset | Refresh restores samples; new-item links become unavailable |
| FT 01 | Independent manual path | No Gemini, quota reservation or item database required |
| PR 01 | Production restriction | Production analysis is refused before provider invocation |
| PR 02 | No item persistence | Confirmation/editing make no item-storage calls; retired API rejects use |

## 9 AI and architecture

### Model responsibilities

Gemini proposes supported fields, evidence, confidence categories and warnings from submitted text or a file. It is instructed to treat source content as untrusted data, not instructions. It has no product-granted tools to modify items, find support contacts or submit claims.

The server validates structured output. Malformed responses, invalid dates or invalid prices can fail the entire extraction rather than silently accepting corrupted fields. Temperature is zero, output is bounded, and the provider timeout is 40 seconds with no automatic retries. These settings do not eliminate hallucination or guarantee determinism.

A field without evidence is cleared. Evidence itself is model-generated, not independently matched to the source. Instructions to abstain on illegible, ambiguous, conflicting or multi-item documents are not proved semantic guarantees. Accuracy needs evaluation.

### Data flow and boundaries

Source in memory → validated server analysis → draft → user edits and confirmation → memory repository → shared page views

The browser adapter and extraction contract isolate the form from provider implementation. Gemini runs through a server adapter. Mock extraction remains for explicit development/tests, not a hidden fallback in the deployed journey.

One root-owned repository exposes a shared collection through React subscriptions. Pages do not maintain independent item copies. Creation normalizes and validates final values, prepends the record and protects against repeated IDs. Editing changes that same collection without creating a durable history.

A future persistence adapter could reuse this boundary, but replacing it would not alone solve authentication, access control, recovery, documents or retention. Those require additional product and security decisions.

## 10 Privacy security and cost

### Data lifetime

| Data | Where and how long | Limitation |
| --- | --- | --- |
| Input and unconfirmed draft | Browser memory during intake | Refresh or leaving intake can lose the draft |
| Confirmed items and edits | Current tab's memory repository | No localStorage, sessionStorage, IndexedDB or new item database persistence |
| Source previews | Temporary browser objects or text | No application file storage or permanent document library |
| Allowed analysis request | Temporary server processing and Google | Provider retention depends on service/account configuration |
| Quota identity | Supabase Auth and cookies | Separate lifetime; not a recoverable item account |
| Counters | Pseudonymous identity, UTC date and count | Old-day cleanup on later reservation, not a guaranteed 24-hour timer |
| Legacy database records | Earlier prototype tables may remain | Not automatically purged by the memory migration |

The promise concerns new item/source persistence by the app. It is not forensic memory erasure, zero retention by third parties or GDPR compliance. Friends' sensitive-data feedback makes this distinction important.

Documents can contain addresses, payment details and identifiers. Synthetic examples are preferred for demonstration. Acknowledgment neither anonymizes a file nor establishes every legal requirement. Provider configuration, identity metadata and privacy wording require review before public AI activation. No compliance certification is claimed.

### Input and resource controls

- Supported uploads are JPG, PNG, WebP and PDF with matching signatures. HEIC is unsupported.
- The effective file cap is 3 MiB, displayed as 3 MB. Text is limited to 5,000 characters.
- PDFs must be readable, unencrypted and contain one to five pages. Images must have positive dimensions within 20 megapixels and 8,192 pixels per side.
- Metadata inspection precedes quota reservation in a time-limited worker, with two inspections per process. The server checks request structure, source count, acknowledgment and timezone.
- Same-origin checks and verified anonymous identity precede paid analysis. Provider credentials remain server side; the frontend publishable key is not a service-role secret.
- Production requests are blocked before provider processing. Finishing an individual safeguard does not open that gate.

These are not malware scanning or proof against every resource attack. Metadata inspection does not fully decode images. Worker heap limits do not fully bound native/buffer allocations. Signup abuse and aggregate resource protection remain unresolved concerns.

### Paid usage controls

Limits reserve five attempts per anonymous browser identity and fifty total per UTC day, atomically checked through Supabase before Gemini. Failed or cancelled requests may count because reservation precedes the outcome. A global allowance limits paid calls across new identities, but is not a precise currency cap or protection against someone consuming everyone's allowance.

Local concurrency allows two analyses per process and one per identity; it is not distributed concurrency control. Busy requests receive a retry response. Failed shared quota checks block analysis rather than reverting to unlimited local counters. Manual entry consumes no analysis attempt.

## 11 Edge cases

| Situation | Current behavior or explicit gap |
| --- | --- |
| Empty input | Cannot analyze; manual entry remains available |
| HEIC or another unsupported file | Rejected; conversion/mobile guidance is not implemented |
| Empty, oversized or mismatched file | Rejected; an older client helper retains inconsistent 10 MB wording for very large files |
| Encrypted, malformed or six-page PDF | Inspection rejects it before provider use |
| Huge image dimensions but small byte size | Dimension limits still apply |
| More than 5,000 text characters | Not accepted by the analysis contract |
| Multiple sources or duplicate fields | Server rejects rather than choosing silently |
| Product photo without purchase evidence | Model instructed to leave purchase facts unknown; accuracy unproven |
| Several purchases on a receipt | Bulk extraction unsupported; model should warn rather than reliably split items |
| Missing serial or warranty | Blank with missing-information indication; user can supply it |
| Relative date near midnight | Validated timezone and displayed reference date require review |
| Ambiguous warranty wording | May leave expiry unresolved; duration remains editable |
| Expiry before purchase | Validation prevents confirmation |
| Non-INR or unknown currency | Clear extracted price and warn; no conversion |
| User clears a suggestion | Blank survives confirmation rather than reverting |
| Source changed after review | Must follow the appropriate new-source review path |
| Cancel or back during analysis | Request abort and ignore late results; reserved attempt may count |
| Timeout or invalid AI response | No created item; retry or manual path |
| Quota exhausted | Refuse analysis with explanation; manual still usable |
| Quota database unavailable | Fail closed; no unrestricted fallback |
| Repeat confirmation | Stable ID protects within the repository, not across sessions |
| Same product intentionally added twice | Separate IDs allowed; no semantic duplicate detection |
| Location blank or spelled differently | Explicit blank group; separate strings form separate groups |
| Search has no results | Empty state and clear-search action |
| Refresh after creation | Added data disappears and pristine samples return |
| New-item link in another tab | Independent collection shows unavailable item |
| Edit confirmed purchase date/duration | No automatic dependent-expiry recalculation |
| Ask for customer care or repair advice | Missing verified information shown, not invented |
| Leave a problem note and navigate away | Component-local note may be lost |
| Analyze on public deployment | Unavailable error, including for synthetic samples |

## 12 Validation and evidence

### Technical evidence already recorded

Targeted tests cover memory state, extraction contracts, API safeguards, onboarding, sample files and upload inspection. Engineering notes record successful runs and TypeScript checks during implementation. Local production build and the corrected Vercel deployment previously succeeded. These are historical results, not tests repeated by writing this PRD.

Memory tests cover creation, edits, cleared fields, search/grouping projections, duplicate IDs and independent/reset collections. Onboarding tests use stubbed hooks and responses, not a rendered browser. File checks establish structure and binary routing, not OCR accuracy.

Upload tests cover malformed/encrypted PDFs, page counts including compressed structures, image limits and simulated worker failures/timeouts. They do not prove resilience against all decompression attacks. Shared quota SQL was tested with rollback for access, limits and rollover, not multi-connection stress.

Engineering notes record limited real-provider checks for text, PDF and blank-image abstention. They are smoke checks, not a representative benchmark. Public analysis remains gated despite local successes.

### Human evidence

Two friends' feedback is the reported human evidence. Mobile picture intake and sensitive-data handling are research questions. There is no substantiated conversion rate, retention rate, time saved, willingness to pay or extraction accuracy percentage to publish.

### Proposed evaluation

Use synthetic ground-truth cases for complete and incomplete receipts, photos without purchase facts, ambiguous dates, non-INR prices and multi-item documents. Measure correct fields and inappropriate completion of unknown fields. Compare proposals with final edits without assuming acceptance proves correctness.

Observe unfamiliar visitors choosing input, reviewing fields and finding the created item without spoken guidance. Check understanding of temporary mode. Report counts with the small sample size, completion-time ranges, corrections and failure reasons. Expand toward the originally discussed five friends only when additional participants are actually recruited.

Measure latency, reserved attempts, provider outcomes and estimated cost in a controlled evaluation. Do not record raw receipts or personal extracted details in analytics. Agree targets before formal evaluation; do not invent retrospective thresholds or results.

## 13 Gaps and next decisions

### Before describing this as publicly enabled AI

1. Resolve provider/identity metadata handling, privacy copy, abuse controls and remaining resource risks before deciding to remove the gate.
2. Align onboarding with the manual path that is usable publicly today. Synthetic samples do not bypass unavailable AI.
3. Run representative extraction evaluation and authorized public-environment end-to-end tests, including corrections, failures, quotas and refresh.
4. Review legacy database records and grants separately; do not assume they were deleted.

### Questions arising from friend feedback

For mobile intake, distinguish selecting a picture on the same phone from transferring a phone picture to a desktop session. The file picker supports part of the first case, subject to browser/format support. QR pairing addresses the second and is deferred. The feedback does not yet establish which caused difficulty.

For privacy, test whether visitors understand three lifetimes: temporary records, external AI processing, and identity/usage metadata. Measure comprehension rather than assuming that displaying a notice is sufficient.

### Other known gaps

Keep fixed-date warranty status, oversized-file wording, dependent-expiry edits and lack of durable field provenance visible in the backlog. A real-image library would require licensing, maintenance and fallback decisions; it has not replaced icons.

These are recommendations and unresolved decisions, not newly approved features. This document neither enables public AI nor promises a persistent consumer release date.

## 14 Source guide

Start with [the Add Item state machine](../../web/hooks/use-add-item.ts) for input, analysis, review, confirmation and reset. Then inspect shared state and the server boundary.

| Area | Source |
| --- | --- |
| Approved release | [Demo scope](demo-scope.md) |
| Guardrails | [Product principles](product-principles.md) |
| Shared collection | [Repository](../../web/lib/items/repository.ts) and [root provider](../../web/components/mock-provider.tsx) |
| AI contract | [Contracts](../../web/lib/ai/contracts.ts) and [validation](../../web/lib/ai/validation.ts) |
| Server processing | [Endpoint](../../web/app/api/extract/route.ts) and [Gemini adapter](../../web/lib/ai/gemini.ts) |
| Self-guided samples | [Onboarding](../engineering/demo-onboarding.md) and [sample files](../engineering/demo-files.md) |
| Session lifetime | [Session demo](../engineering/session-only-demo.md) |
| Input safeguards | [Upload safety](../engineering/upload-safety.md) |
| Cost controls | [Usage limits](../engineering/analysis-usage-limits.md) |
| Provider limitations | [Gemini notes](../engineering/gemini-extraction.md) |
| Earlier plans | [Archived roadmap](PRD-roadmap-archive.md) |

### Glossary

- **OCR:** reading text from images or scans.
- **Extraction:** mapping evidence into fields such as retailer and purchase date.
- **Draft:** suggestions not yet confirmed by the user.
- **Repository:** the code boundary for reading and changing shared items.
- **Browser memory:** temporary running-page state, not recoverable storage.
- **Anonymous identity:** an allowance identifier, not an account with saved items.
- **Provenance:** where a fact or suggestion came from.
- **Production gate:** a rule that blocks analysis in the deployed environment.

## 15 Change record

Version 1.0, 2 October 2026: replaced the mixed historical roadmap with an as-built specification; preserved the roadmap as an archive; included two-friend feedback with evidence limits; distinguished public manual functionality from locally enabled AI. The portfolio Word document is generated from this source. No application behavior changed.
