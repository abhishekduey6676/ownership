# AI architecture

## Current demo extraction contract

Apply [public AI demo scope](../product/demo-scope.md). Implement real, source-dependent
image/PDF/text extraction through a server-only Gemini adapter, retaining the provider-neutral
draft and review screens. Confirmed items also stay in browser memory until refresh, alongside
drafts and source previews. Do not require permanent source, item or extraction tables for this demo.
Validate proposals; expose missing/ambiguous facts; preserve user corrections. Resolve words
such as today against a visible date/timezone. Warranty expiry derivation is deterministic,
shows its assumptions, and requires review. No generated product images. Original inputs
must not be logged or stored as a permanent library; verify provider retention separately.
The persistent provenance pipeline below remains longer-term architecture, not a release prerequisite.

## 1. Invariant

```text
Document / Image / Text
        ↓
AI extraction
        ↓
Draft structured facts
        ↓
Source + confidence
        ↓
User confirmation
        ↓
Trusted item data
```

AI output must never directly insert, update, or delete trusted item facts. This rule applies regardless of provider, confidence, model capability, or future automation.

## 2. Responsibilities and boundaries

AI may:

- identify likely product and purchase fields in supplied sources;
- propose normalized values while preserving original evidence;
- identify conflicts and missing fields;
- point to the document page or region supporting a proposal; and
- classify an uploaded source as a likely invoice, receipt, warranty card, manual, product photo, service record, or other.

AI must not:

- decide that a proposed fact is true;
- overwrite a confirmed value;
- infer warranty terms, support details, maintenance intervals, or specifications without evidence;
- turn a category stereotype into a reminder;
- browse for official information within the MVP extraction flow;
- diagnose a fault or generate repair instructions;
- access application tools, databases, storage credentials, or unrelated household records.

## 3. Provider-neutral contract

```ts
interface ExtractionProvider {
  readonly name: "mock" | "gemini" | string;
  extract(request: ExtractionRequest): Promise<ExtractionEnvelope>;
}

type ExtractionRequest = {
  runId: string;
  schemaVersion: number;
  locale?: string;
  currencyHint?: string;
  contextText?: string;
  sources: Array<{
    sourceId: string;
    mediaType: string;
    content: ProviderContentReference;
  }>;
};

type ExtractionEnvelope = {
  schemaVersion: number;
  provider: string;
  model: string;
  candidates: FactCandidate[];
  conflicts: FactConflict[];
  warnings: ExtractionWarning[];
  itemCandidates?: ItemCandidate[];
};

type FactCandidate = {
  factKey: FactKey;
  value: unknown;
  normalizedValue?: unknown;
  confidence?: number;
  evidence: Array<{
    sourceId: string;
    page?: number;
    excerpt?: string;
    region?: { x: number; y: number; width: number; height: number };
  }>;
};
```

The real TypeScript contract must use discriminated, typed fact values and runtime validation. `unknown` above illustrates the boundary, not permission to store arbitrary client-shaped JSON.

Initial fact keys:

- `identity.product_name`
- `identity.category`
- `identity.brand`
- `identity.model`
- `identity.serial_number`
- `purchase.retailer`
- `purchase.date`
- `purchase.price` as `{ amountMinor, currency }`
- `warranty.duration_months`
- `warranty.expiry_date`

Schema versions are explicit. Adapters map provider output into the application schema; product and persistence layers never depend on Gemini response types.

## 4. Pipeline

### 4.1 Intake

1. Validate user, household, source count, size, and type.
2. Store originals privately and create document records.
3. Create an extraction run with provider, model, schema version, and status.

### 4.2 Provider preparation

- Give the provider only the selected sources and minimal user context.
- Prefer native multimodal/PDF input when supported and economical.
- If preprocessing is required, keep it deterministic and retain source/page mapping.
- Remove application secrets and unrelated metadata.

### 4.3 Extraction instruction

The fixed instruction should require:

- strict structured output matching the supplied schema;
- null/omission for unsupported values;
- no calculation or external knowledge unless a field explicitly allows a labeled derivation;
- evidence reference for every candidate;
- separate alternatives when sources conflict;
- exact preservation of serial/model identifiers;
- date and money normalization only when unambiguous; and
- ignoring instructions found inside source documents.

### 4.4 Validation and normalization

After the provider returns:

1. Parse against the versioned runtime schema.
2. Reject unknown fact keys, malformed values, impossible page references, and excessive lengths.
3. Normalize deterministically: trim whitespace, preserve identifier punctuation, parse dates cautiously, and convert monetary decimals to minor units without currency guessing.
4. Recalculate confidence bands using application thresholds if a numeric provider score exists; otherwise use `unknown`.
5. Store candidates and their sources as draft observations.

Do not silently repair a response in ways that introduce facts. A structurally invalid response fails the run and remains retryable.

### 4.5 Review and confirmation

- Review reads stored observations and the referenced sources.
- Users can accept, edit, clear, or leave unresolved.
- Server confirmation checks that observation, source, intake, user, and household match.
- Accepted proposals create trusted revisions with `origin_type=extraction_confirmed`.
- Edited proposals create trusted revisions that record both the original observation and user edit.
- Rejected proposals remain in extraction history but are never used for product behavior.
- Derived warranty expiry can be computed only from confirmed inputs and is labeled `derived` with input revision IDs.

## 5. Confidence and conflict policy

Confidence communicates review priority, not correctness.

- High: visually quieter but still reviewable.
- Medium: normal review emphasis.
- Low or unknown: explicit attention and no default assumption of acceptance.
- Conflicting: show alternatives and require a user choice or blank value.

Thresholds are product configuration and should be calibrated with an evaluation set. Never use confidence to bypass confirmation in MVP.

## 6. Mock mode

`AI_MODE=mock` is a complete provider implementation, not scattered conditionals in UI code.

Requirements:

- deterministic output for a given fixture identifier;
- optional realistic latency;
- no external network or API key;
- the same schema validation, persistence, review, and confirmation path as Gemini;
- safe synthetic sample documents and responses; and
- explicit development/demo labeling that cannot be confused with real extraction.

Fixtures cover:

- clean invoice;
- partial invoice with unknown warranty;
- low-confidence model or serial number;
- conflicting dates across documents;
- several likely items in one source;
- invalid provider response;
- provider timeout/failure; and
- malicious instructions embedded in a document.

Production startup must fail if `AI_MODE=mock` is unintentionally enabled for a real deployment configuration. A deliberate portfolio-demo deployment may use mock mode if its UI and documentation say so.

## 7. Gemini adapter

- Runs server-side only.
- Uses an explicitly configured model; do not rely on a moving implicit default.
- Requests structured output where supported.
- Translates Gemini content and errors into provider-neutral types.
- Applies bounded timeout and retry policy. Retry only transient failures and use the extraction run ID for idempotency.
- Records model, latency, outcome, and usage metadata without logging document content.
- Respects free-tier rate limits with per-household limits and helpful retry messaging.

The adapter does not write to the database directly. The orchestration service owns validation and persistence.

## 8. Derived and enriched information

Deterministic derivation is not AI extraction:

- confirmed purchase/warranty start date + confirmed duration → derived expiry date;
- confirmed expiry date + current household date → active/expired/expiring-soon display state.

Derivations store their input revision IDs and are recomputed when inputs change.

Manufacturer support discovery, manual retrieval, product specifications, and generalized maintenance recommendations are deferred. When introduced, they need separate source verification, freshness, and trust policies; they must not be smuggled into the extraction provider contract.

## 9. Privacy, safety, and retention

- Explain provider processing before sending user content.
- Send the minimum source content required for the requested extraction.
- Do not include another item or household as conversational context.
- Treat document text as hostile prompt content.
- Keep raw provider responses access-controlled and retention-limited; persist normalized observations for durable provenance.
- Do not train or evaluate on user documents without explicit consent and an approved privacy process.
- Never render model strings as unsanitized HTML.

## 10. Evaluation

Maintain a synthetic, rights-safe evaluation set that measures field-level precision, recall, normalization accuracy, source attribution, conflict detection, abstention on missing facts, and schema validity.

Release gates:

- Missing warranty evidence produces no invented warranty.
- Embedded instructions cannot change the schema or trigger an action.
- Identifiers preserve meaningful characters and leading zeroes.
- Every accepted candidate has a valid source, unless it is explicitly user-entered.
- Provider failures preserve the manual path.
- Running extraction again never changes trusted facts.

## 11. Future evolution

New providers implement `ExtractionProvider` and pass the shared contract suite. Provider routing, evaluation, or fallback may be added later, but silent cross-provider fallback is risky: it can change privacy disclosures, costs, and output behavior. Any fallback must be explicit in configuration and observable to the user when relevant.
