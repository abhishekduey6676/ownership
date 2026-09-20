# Ownership

Ownership is a personal ownership assistant for everything a person buys and keeps. A user uploads a receipt, invoice screenshot, PDF, product photo, warranty card, manual, or plain text. The app extracts likely facts, asks the user to confirm them, and creates a trustworthy record that remains useful through warranty, maintenance, service, replacement, and eventual disposal.

The application lives in `web/`. The current implementation is an interactive Next.js, TypeScript, and Tailwind prototype with hardcoded fixtures and temporary React state. No Supabase, Gemini, or authentication is connected.

## Run the prototype

For a guided explanation of the Add Item feature, see [`docs/engineering/mock-add-item.md`](docs/engineering/mock-add-item.md). Start reading the implementation at `web/hooks/use-add-item.ts`.

From `web/`, run `pnpm dev`, then open `http://localhost:5173`. Run `pnpm build` for a production build and TypeScript validation. The application now uses the native Next.js runtime; the original Sites/Vinext tooling is retained but is not used by these commands.

Working paths:

- Dashboard → Add item → select a local image/PDF or sample invoice → simulated analysis → edit draft fields → explicitly confirm → item created → item detail.
- Dashboard → Air fryer → item detail → Something’s wrong → warranty, document previews, customer-care state, and troubleshooting note.

Items, edits, and local file references remain available while navigating in the same tab. A full refresh resets the demo. The fixed sample date is 12 September 2026. Extraction always returns the fictional air fryer fixture; selected files are not read by an AI service or sent to a server. Customer-care contacts and repair steps are intentionally absent when no verified source exists.

## Product promise

Register an item once. When something needs attention, find the facts, documents, history, and next useful action in one place.

The first demo focuses on this connected journey:

`Dashboard → Add item → Review extraction → Item detail → Warranty or maintenance timeline → Something's wrong → Replace or archive`

## Documentation map

| Area | Document | Purpose |
| --- | --- | --- |
| Product | [`docs/product/PRD.md`](docs/product/PRD.md) | MVP scope, requirements, success criteria, and exclusions |
| Product | [`docs/product/user-flows.md`](docs/product/user-flows.md) | End-to-end journeys and exception states |
| Product | [`docs/product/product-principles.md`](docs/product/product-principles.md) | Decision rules and trust guardrails |
| Design | [`docs/design/information-architecture.md`](docs/design/information-architecture.md) | Navigation, screens, and content hierarchy |
| Design | [`docs/design/design-system.md`](docs/design/design-system.md) | Visual language, components, accessibility, and content style |
| Engineering | [`docs/engineering/architecture.md`](docs/engineering/architecture.md) | System design and technical boundaries |
| Engineering | [`docs/engineering/data-model.md`](docs/engineering/data-model.md) | PostgreSQL model, ownership, provenance, and lifecycle |
| Engineering | [`docs/engineering/ai-architecture.md`](docs/engineering/ai-architecture.md) | Provider abstraction and extraction pipeline |
| Engineering | [`docs/engineering/security-privacy.md`](docs/engineering/security-privacy.md) | Threats, controls, privacy, and retention |
| Delivery | [`docs/plans/MVP-plan.md`](docs/plans/MVP-plan.md) | Working milestones and release gates |

## Intended technology direction

- Next.js, TypeScript, Tailwind CSS, and shadcn/ui
- Supabase PostgreSQL and Storage
- Supabase Auth when authentication enters the build
- Gemini free tier behind a provider-neutral interface
- `AI_MODE=mock` for deterministic development and demos
- Vercel hosting

Architecture decisions remain subordinate to the product principles: evidence before automation, low manual effort, no fabricated guidance, and no unnecessary infrastructure.

## Current decisions

- A household is the primary data boundary even for an individual user; a personal account begins with one private household.
- Documents are retained as evidence and can support multiple extracted facts.
- Confirmed facts are separate from AI extraction output. Confirmation promotes selected values through an explicit user action.
- Item status changes are append-only lifecycle events backed by a current-status projection.
- The MVP supports one active household context. Household invitations and advanced roles are deferred.
- Official manuals and support details are user-provided or explicitly verified; automated web discovery is not an MVP dependency.

## Contribution rule

Read `AGENTS.md` and the document relevant to the area being changed. When a change affects product behavior, update the product, flow, data, and delivery documents together so they do not drift.
