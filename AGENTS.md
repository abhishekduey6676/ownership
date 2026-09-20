# Ownership agent guide

Ownership is a calm, consumer-first assistant for keeping trustworthy records about physical items.

Before changing the product, read the relevant documents:

- Current release scope (takes precedence over conflicting future-roadmap details): `docs/product/demo-scope.md`

- Product scope and acceptance criteria: `docs/product/PRD.md`
- User journeys and states: `docs/product/user-flows.md`
- Product decisions and guardrails: `docs/product/product-principles.md`
- Navigation and screen structure: `docs/design/information-architecture.md`
- Visual and interaction rules: `docs/design/design-system.md`
- System boundaries and dependencies: `docs/engineering/architecture.md`
- Entities, relationships, and trust model: `docs/engineering/data-model.md`
- AI extraction contract: `docs/engineering/ai-architecture.md`
- Security and privacy requirements: `docs/engineering/security-privacy.md`
- Delivery order and milestone definitions: `docs/plans/MVP-plan.md`

Non-negotiables:

- AI output is a draft. It never overwrites trusted item data.
- Show provenance and uncertainty for important facts; never invent warranty, support, service, or specification data.
- Keep ownership, household access, and physical location as separate concepts.
- Preserve lifecycle history in the future persistent product; archive or change status instead of deleting items. The current demo intentionally resets all browser-memory items on refresh as specified in `docs/product/demo-scope.md`; do not introduce 24-hour database persistence or cleanup.
- Keep the MVP inexpensive and simple: one Next.js app, a browser-memory item repository, and an abstracted AI provider with `mock` and `gemini` modes. Supabase provides anonymous identity and approved minimal AI usage counters, not item storage.
- Every milestone must leave the application usable. Do not pull later-phase features into the MVP without updating the PRD and plan.
