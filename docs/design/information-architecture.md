# Information architecture

## Current release — 16 September 2026

Apply [public demo scope](../product/demo-scope.md). Keep Home, Items, Locations, Add Item and
Item Detail; all consume the same memory collection. In-app links preserve it; refresh restores
samples. Unavailable added-item links explain the reset and offer Home / Add item. Show a
visible refresh warning at source, confirmation and creation. No permanent library, sharing,
account menu or QR pairing is required. The broader structure below is future context.

## 1. Organizing model

Ownership is organized around four concepts that must remain distinct:

- **Household:** who can access the records.
- **Item:** the durable ownership record.
- **Location:** where an item is physically kept.
- **Attention:** a time-sensitive or incomplete condition that needs a user decision.

The item is the primary object. Documents, facts, warranties, reminders, service, support, and lifecycle history belong in its context.

## 2. MVP navigation

Primary navigation:

1. **Home** — attention and recent items
2. **Items** — active library, search, category and location filters
3. **Locations** — household location hierarchy and items within each node

Global actions:

- **Add item**
- Household/account menu

Archived items are a filter within Items, not a separate top-level destination. Settings should stay inside the account menu until there is enough content to justify a dedicated section.

On mobile, use a compact bottom navigation for Home, Items, and Locations plus a prominent Add action. On desktop, use a restrained side rail or header; do not surround the product with dense admin chrome.

## 3. Route model

Suggested route structure (implementation may vary without changing the IA):

| Route | Purpose |
| --- | --- |
| `/` | Dashboard |
| `/items` | Active and archived item library |
| `/items/new` | Source selection and upload |
| `/items/new/review/:runId` | Extraction review and confirmation |
| `/items/:itemId` | Item overview |
| `/items/:itemId/problem` | Something's wrong workspace |
| `/items/:itemId/edit` | Trusted fact editing |
| `/locations` | Location tree and contained items |

Use drawers or dialogs for short actions such as adding a reminder, recording service, moving an item, changing lifecycle status, and viewing provenance. Preserve deep links for the main flows above.

## 4. Screen anatomy

### Dashboard

First viewport:

- concise greeting or household label;
- Add item action;
- **Needs attention** list with reason and action;
- recent active items.

Secondary content:

- upcoming warranty expiries;
- upcoming maintenance/reminders;
- incomplete records.

Avoid duplicating the same item in several visible modules when a single attention queue can explain all reasons.

### Items library

- Search by item name, brand, model, serial number, retailer, or location.
- Filter by active/archived, category, and location.
- Cards favor item name, image, location, warranty state, and next attention reason.
- Do not lead with database IDs, acquisition cost totals, or enterprise table density.

### Add item

Step 1: choose upload or text and supply sources.

Step 2: processing state with source list and cancel/retry affordances.

Step 3: review extracted fields, resolve conflicts, and create the item.

The current step, retained files, and exit consequences must remain clear. Manual entry is an available fallback, not the default burden.

### Item detail

Header:

- item image or category fallback;
- name, brand/model, location, lifecycle status;
- warranty summary;
- actions: Something's wrong and overflow menu.

Body priority:

1. Next attention or missing critical information
2. Core facts and purchase
3. Timeline: warranty, maintenance, service, lifecycle
4. Documents
5. Support information
6. Provenance/history details

Sections may become tabs on mobile or long records, but essential status and primary actions remain visible without tab hunting.

### Something's wrong

This is a focused task surface, not a chat-first experience.

1. Warranty state and evidence
2. “Gather these records” checklist based on what is present or missing
3. Relevant documents
4. Verified support channels
5. Source-backed guidance, if any
6. Record service action

An unknown or missing state is a first-class outcome.

### Locations

Show a simple expandable hierarchy such as Home / Kitchen. Selecting a node shows direct and nested item counts plus contained items. Location editing is household-scoped. An item has at most one current physical location in the MVP.

## 5. Content hierarchy and terminology

Preferred user-facing terms:

| Internal idea | User-facing language |
| --- | --- |
| entity record | item |
| extraction run | reading your documents |
| canonical value | confirmed detail |
| confidence score | high, medium, or low confidence |
| lifecycle transition | status change |
| tenant | household |
| soft delete | archive |

Reserve “verified” for information tied to an authoritative or user-confirmed source. “Confirmed” means a user accepted it; it does not imply that the manufacturer independently verified it.

## 6. State design

Every main screen must define:

- loading without layout jumps;
- empty with a relevant next action;
- recoverable error with retained work;
- permission denied without leaking record existence;
- partial data with honest unknown labels; and
- success feedback that does not interrupt navigation.

## 7. Later information architecture

The following should not shape MVP navigation yet:

- household invitations and role management;
- financial value and depreciation;
- integrations and imports;
- claims workflows;
- resale and replacement recommendations;
- notification channel settings.
