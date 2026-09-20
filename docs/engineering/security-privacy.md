# Security and privacy

## Current release — 16 September 2026

The [approved demo scope](../product/demo-scope.md) requires browser-memory-only items, drafts,
edits and source previews. Refresh resets the collection to synthetic samples. No localStorage,
sessionStorage or IndexedDB for item data, and no item API persistence. The retired endpoint
returns 410 even for stale clients. Legacy database rows/policies were not purged or changed;
do not describe that old data as erased. Supabase anonymous identity remains only for analysis
quotas, with separate cookie/account metadata retention. Google still receives consented
sources: browser reset is not a provider-erasure or GDPR-compliance guarantee. Public quotas,
input resource limits and metadata/provider privacy review remain gates. Persistent household
and Storage rules below apply only if those deferred systems return.

Update — 20 September: approved [shared usage limits](analysis-usage-limits.md) now enforce
5 attempts per identity and 50 total per UTC day. The counters retain pseudonymous IDs, dates
and counts only, with no direct client table access or service-role key. Older metadata remains
until the next day's first reservation clears it. Signup abuse, resource/privacy checks and
legacy permission review still gate public extraction; daily quotas alone do not clear these gates.

## 1. Data sensitivity

Ownership handles invoices, names, addresses, purchase history, serial numbers, product photos, warranty records, support conversations, and physical location labels. Together these can reveal identity, wealth, routines, and the contents of a home. Treat all household data and uploads as private by default.

## 2. Security boundaries

- **User session:** proves an authenticated user identity.
- **Household membership:** grants access to household-scoped records.
- **Server boundary:** holds provider and privileged database credentials.
- **Private storage:** holds original and derived document binaries.
- **External AI provider:** receives only the content required for the requested extraction.

An item's physical location and lifecycle status never grant authorization.

## 3. Authorization

- Every household-scoped table includes `household_id` directly or has a constrained parent that does.
- Enable Row Level Security on all user-data tables before real accounts are used.
- Policies permit reads and writes only when `auth.uid()` has active household membership and the role permits the operation.
- Prefer database-enforced policies even when server code checks membership.
- Service-role credentials stay server-only and should be avoided for normal user operations because they bypass RLS.
- Storage access policies mirror household membership. Signed URLs are short-lived and scoped to one object.
- Return the same not-found response for nonexistent and unauthorized records to avoid identifier probing.

Test cross-household denial for direct IDs, nested resources, storage objects, and server actions.

## 4. Upload security

- Allowlist required file types and define conservative file count and size limits.
- Verify declared MIME type against file signatures where practical.
- Generate storage keys from household and document IDs, never raw filenames.
- Escape user filenames on display and never execute uploaded content.
- Serve uploads as attachments or through safe previews with restrictive content types and headers.
- Treat PDFs and images as untrusted input. If processing libraries are introduced, keep them patched and resource-limited.
- Add malware scanning before broad public release; for a limited private demo, document the limitation and do not imply files are scanned.
- Strip unnecessary image metadata from derived previews while preserving originals only as required for evidence.

## 5. AI and prompt-injection controls

Document text is untrusted data, even when it contains instructions addressed to the model.

- Use a fixed system instruction that limits the provider to structured extraction.
- Delimit document content and state that instructions inside it must be ignored.
- Do not give the extraction model tools, database write access, web access, or secrets.
- Validate output against a strict schema and reject unknown fields or oversized values.
- Treat URLs and phone numbers as strings requiring evidence and later verification, not executable actions.
- Never render provider text as raw HTML or Markdown without sanitization.
- Provider output writes only to draft extraction tables.
- Confirmation revalidates observation ownership and all submitted values on the server.

## 6. Secret management

- Keep Gemini keys and any Supabase service-role key in server-only environment variables.
- Only the Supabase anon key is permitted in the client.
- Never commit `.env` files, include secrets in fixtures, or send them to error tracking.
- Rotate a key immediately if it appears in logs, source control, or client bundles.
- Use separate development and production projects and credentials.

## 7. Privacy practices

### Minimization

- Collect only fields that support ownership tasks.
- Do not extract unrelated personal data from invoices into trusted facts.
- Send only the necessary document or pages to the AI provider.
- Avoid third-party analytics in the early demo; if added, exclude identifiers, filenames, document content, serial numbers, and fact values.

### Transparency and consent

Before AI processing, explain that selected content is sent to the configured provider for extraction. Link to a concise privacy notice describing stored data, processors, retention, and deletion. Do not use user documents for model training unless the user has explicitly opted in under clear terms.

### Retention and deletion

- Define retention for abandoned intake sessions and raw provider responses before launch.
- Let a user delete an upload, item, or account subject to clear consequences and legal needs.
- Lifecycle archive is a product action, not a privacy deletion.
- A document deletion should remove the binary and derived previews; retain only minimal provenance tombstones when necessary to explain a trusted fact, and tell the user.
- Account/household deletion requires a background-capable, auditable purge plan before public launch.

### Export

Portable account export is not required for the demo but should be planned before broad release. Prefer structured item data plus original documents and a provenance manifest.

## 8. Logging and observability

- Use opaque IDs and outcome codes in structured logs.
- Do not log prompts, OCR text, extracted values, filenames, signed URLs, or document bytes.
- Redact authorization headers, cookies, and query parameters that may contain tokens.
- Restrict operational log access and define a retention period.
- Audit membership changes, confirmation, trusted fact edits, document deletion, support information changes, lifecycle changes, and replacement links.

## 9. Web application controls

- Use secure, HTTP-only, same-site session cookies through Supabase's supported server flow.
- Protect state-changing routes against CSRF according to the chosen action/route mechanism.
- Set Content Security Policy, frame restrictions, MIME sniffing protection, referrer policy, and sensible permissions policy.
- Sanitize rich or external content; prefer plain text for notes in MVP.
- Validate redirect targets and never trust client-provided household IDs.
- Rate-limit upload, extraction, sign-in, and invitation endpoints.
- Keep dependencies reviewed and updated; enable automated vulnerability alerts.

## 10. Safety and data quality

- No generated repair, electrical, medical, or other safety-sensitive instructions in MVP.
- Warranty and support information must show source and verification state.
- Phone, email, and URL actions require an explicit user click and display the destination.
- Derived warranty status uses only confirmed inputs and the household timezone.
- Unknown data remains unknown; AI confidence never changes authorization or safety treatment.

## 11. Threat checklist before public testing

- RLS and storage-policy tests prove household isolation.
- No privileged secret appears in client assets.
- Signed URLs expire and cannot be used to enumerate adjacent files.
- Upload limits and content handling resist resource exhaustion and active content.
- Prompt injection samples cannot change the extraction schema or trigger actions.
- Confirmation cannot reference another user's extraction run or source.
- Logs and analytics contain no sensitive fields or document text.
- Deletion behavior and AI-provider disclosure match the privacy notice.
- Backups, restore expectations, and breach-response ownership are documented.

## 12. Known MVP limitations

A portfolio demo may initially omit malware scanning, user export, automated account purge, and formal incident operations. These limitations must be recorded, access should remain tightly controlled, and the product must not be presented as ready for broad public storage of sensitive documents until they are addressed.
