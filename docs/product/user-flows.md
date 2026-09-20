# User flows

## Current release — 16 September 2026

Follow [public demo scope](demo-scope.md): Image / PDF / Purchase prompt -> Analyze -> Review
-> Confirm -> Created -> Item Detail. All views share one in-memory collection through in-app
navigation. Refresh clears added items, edits, drafts and sources, and restores sample records.
An added-item deep link after refresh shows an unavailable explanation and Add item / Home
actions. AI failures retain a manual-entry path. Home now links to a three-example text-sample
picker. Selection never auto-analyzes; the visitor can edit the source and must acknowledge
processing. Review offers sample-specific tips. Try another input resets intake only, keeping
the collection and resetting consent and the creation ID. Visitors can also download synthetic
PNG/PDF files and use the upload shortcut to submit them through the normal file-input path.
Downloads do not start analysis or grant processing consent.
The persistent flows below are future scope.

## Conventions

- A **draft fact** is an AI proposal and cannot drive trusted behavior.
- A **trusted fact** was entered or confirmed by a user, or transparently derived from confirmed inputs.
- An **attention item** comes from a deterministic condition and always explains its reason.
- Recoverable failures preserve the user's completed work.

## 1. First use

1. The user enters their private household and sees an empty dashboard.
2. The page names the supported inputs and presents **Add your first item**.
3. The action opens Add item directly, without a marketing interstitial.

## 2. Add an item

1. The user drops supported images or PDFs, or chooses Text and pastes purchase information.
2. The client validates type, size, and count. Each file shows progress and remove/retry controls.
3. The user may add short context, then selects **Extract details**.
4. The system stores the sources privately, creates an extraction run, and shows progress.
5. Success opens Review extraction.

Exceptions:

- Unsupported or oversized file: reject before upload and state accepted limits.
- Interrupted upload: keep completed sources and allow retry.
- Unreadable or password-protected PDF: explain the issue and offer manual entry.
- Multiple likely products: ask which single product to register; do not silently create several.
- Extraction failure or provider limit: allow retry or manual entry. Production never substitutes mock facts.

## 3. Review and confirm

1. Proposed facts are grouped into Item, Purchase, and Warranty.
2. Each proposal shows value, confidence band, and source. Missing values remain blank.
3. The user accepts, edits, clears, or leaves each value unresolved. Conflicts show alternatives with sources.
4. The user selects **Create item**.
5. The system validates the draft and transactionally creates the item, trusted fact revisions, confirmation records, and document links.
6. The user lands on Item detail.

Product name is the only required human-readable value. Derived warranty expiry shows its inputs and remains labeled as derived. “Accept all” must never hide low-confidence or conflicting values.

## 4. Dashboard triage

1. The dashboard orders attention by overdue reminders, near-term reminders or warranty expiry, then incomplete records.
2. Each entry names the item, explains why it appears, and offers one useful action.
3. The user opens the item or completes a reminder.
4. The attention entry disappears only after its underlying condition changes.

When nothing needs attention, show a calm success state and recent active items rather than empty metrics.

## 5. View and edit an item

1. Item detail opens with identity, physical location, lifecycle status, purchase facts, and warranty state.
2. Documents, Timeline, and Support remain within the item context.
3. Selecting an important fact reveals its source and confirmation history.
4. Editing a trusted fact creates a revision and audit event; the source extraction remains unchanged.
5. The user can add a document, reminder, service event, support entry, or location.

Unknown states say what has not been recorded and offer an appropriate action. They do not claim absence of warranty or maintenance needs.

## 6. Warranty and maintenance timeline

1. The user sees purchase, warranty, reminder, service, location, and lifecycle events chronologically.
2. Upcoming events are separated from history.
3. The user creates a one-time or recurring reminder.
4. An interval extracted from a manual can become a reminder only after explicit confirmation.
5. Completing, snoozing, editing, or deleting a reminder preserves relevant history.

## 7. Something's wrong

1. The user selects **Something's wrong** from an item.
2. The view shows warranty as active, expired, unknown, or not applicable and explains its evidence.
3. It assembles relevant invoices, warranty cards, manuals, and service records.
4. It flags record gaps such as a missing invoice or serial number without claiming those are universal claim requirements.
5. It shows only stored, source-labeled support information and safe guidance.
6. The user can open a document, copy verified support details, add missing information, or record service.

When reliable guidance is absent, say so and direct the user to official documentation or a qualified professional. Do not synthesize repair steps from general model knowledge.

## 8. Record service

1. The user enters date, provider, summary, optional cost and currency, outcome, and attachments.
2. Saving adds the event to the timeline and exposes its documents on the item.
3. A follow-up reminder is a separate explicit choice.

## 9. Move an item

1. The user chooses an existing household location or creates a named child location.
2. The current physical location changes and a move event is recorded.
3. Household access and ownership status remain unchanged.

## 10. Replace an item

1. The user selects **Replace item** and chooses an existing replacement or starts Add item.
2. The UI may suggest carrying category and location only; unique facts and evidence are never copied.
3. The user confirms the replacement relationship and date.
4. The old item becomes `replaced`; both records link to one another and keep their own history.

Canceling replacement creation leaves the original item unchanged.

## 11. Archive by lifecycle outcome

1. The user selects **Change status** and chooses sold, gifted, lost, or disposed.
2. The user may add an effective date and note.
3. Confirmation explains that the record will be retained and hidden from active views.
4. The system appends a lifecycle event and updates current status.
5. The item remains available through an archived-items filter.

## 12. Household access (later phase)

The model supports membership from the start, but invitation UI is outside MVP. Later, an owner invites a person, the invitee accepts, and access follows household membership and role. A location never grants access.
