# Ownership

Turn receipts and purchase notes into organized item records. AI suggests the details; you decide what gets saved.

Ownership is a consumer-focused AI product demo built with Next.js, TypeScript and Tailwind CSS. It demonstrates document-to-form extraction, uncertainty handling and human confirmation—not a permanent records vault.

## Current status

- Image, PDF and plain-text purchase inputs use real Gemini extraction in local development.
- Synthetic text examples and downloadable sample documents support a self-guided walkthrough.
- Users can edit, clear or add fields before explicitly confirming an item.
- Home, Items/search, Locations and Item Detail share one browser-memory collection.
- Manual entry remains available when AI is unavailable.
- Category icons are deterministic; no product-image generation is used.
- **Public/production AI analysis is disabled** until the remaining release safeguards are complete.

The [approved demo scope](docs/product/demo-scope.md) takes precedence over older documents describing a persistent household product.

## Try the journey

1. Open Home and choose **Add item** or **Try a sample invoice**.
2. Select an image/PDF, choose a synthetic sample, or describe a purchase.
3. Acknowledge external AI processing and request analysis.
4. Review the draft: missing facts stay missing, and calculated values require review.
5. Edit the fields and confirm. The created item appears throughout the collection.
6. Open its detail page, then refresh to see the demo reset.

Sample analysis uses the real extraction endpoint; it is not a free offline mock. Browsing and manual entry do not require AI credentials. The mock adapter remains available for explicit tests, not as a silent fallback.

The existing **Something’s wrong** path surfaces warranty/document information and honest missing-information states, rather than invented support contacts or repair advice.

## Run locally

Requirements: Node.js 22.13 or newer and pnpm 11.19.0, as declared in [web/package.json](web/package.json).

```sh
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:5173](http://localhost:5173).

For real AI analysis, copy [web/.env.example](web/.env.example) to `web/.env.local` and configure:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL; safe to expose |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client key; authorization still depends on database permissions |
| `GEMINI_API_KEY` | Server-only AI credential; never prefix with `NEXT_PUBLIC_` |
| `GEMINI_MODEL` | Provider model configured in the example environment file |

Enable anonymous sign-ins in your Supabase project and provision the usage-counter SQL described in [shared usage limits](docs/engineering/analysis-usage-limits.md). A fresh clone does not provision the database automatically. No service-role secret is required, and legacy item-storage migrations are not needed for this demo.

Never commit `.env.local` or real credentials. Without working AI configuration and usage counters, analysis fails with an error; manual entry remains available.

The normal scripts use native Next.js. Retained Sites/Vinext tooling is historical and is not the runtime used by `pnpm dev` or `pnpm build`. A production build does not enable AI analysis.

## Data, privacy and cost boundaries

- Items, edits, drafts and selected source previews live in this tab's memory. In-app navigation preserves them; refresh restores synthetic samples. A new tab has an independent collection.
- Confirmed items are not stored in PostgreSQL, localStorage, sessionStorage or IndexedDB. There is no 24-hour item retention or cross-device recovery.
- When analysis is requested, source content goes through the server to Google. The extraction layer does not persist original files, raw prompts or provider responses.
- Supabase provides anonymous analysis identity and minimal daily usage counters—not new item storage. Identity/cookies, counter metadata and provider processing have separate retention concerns.
- AI allowance: **5 reserved attempts per browser identity and 50 total per UTC day**, resetting at 00:00 UTC. Failed/cancelled attempts may count. Manual entry does not consume this allowance.
- Older counter metadata is removed on the first reservation after UTC rollover, not by an exact 24-hour deletion timer.
- Legacy database rows and permissions from the earlier persistence prototype have not been purged.

Use synthetic or redacted non-sensitive inputs. Browser-memory handling is not a promise of zero provider retention or GDPR compliance.

## Architecture and code guide

The journey is: source → extraction service → editable draft → explicit confirmation → shared memory repository → collection/detail views.

Start with [use-add-item.ts](web/hooks/use-add-item.ts), then inspect:

- [Item repository](web/lib/items/repository.ts): confirmed records, validation and shared snapshots.
- [Root provider](web/components/mock-provider.tsx): subscribes app views to the same collection.
- [Extraction adapter](web/lib/ai/extraction.ts): browser-to-server boundary.
- [Extraction route](web/app/api/extract/route.ts): input checks, verified identity, quotas and production gate.
- [Gemini provider](web/lib/ai/gemini.ts): provider prompt and structured extraction.
- [Validation](web/lib/ai/validation.ts): draft contract and reviewable date/warranty derivation.
- [Shared usage adapter](web/lib/ai/shared-limits.ts): reserves allowance before a provider call.

AI output is always a draft. It cannot silently overwrite confirmed item facts. The retired item API returns HTTP 410.

## Checks without rendering or paid AI calls

Run from `web/`:

```sh
pnpm exec tsc --noEmit
node scripts/test-memory-items.cjs
node scripts/test-extraction.cjs
node scripts/test-session-demo-api.cjs
node scripts/test-demo-onboarding.cjs
node scripts/test-demo-files.cjs
```

These deterministic checks do not establish real-world OCR accuracy or replace end-to-end testing. Live provider tests are separate and may incur costs; see [extraction notes](docs/engineering/gemini-extraction.md).

## Before public release

Remaining work includes signup abuse protection, distributed resource protection, PDF/image resource limits, provider/identity privacy review, legacy database-permission review and deployment/end-to-end validation. Do not remove the production gate merely to publish the demo.

Broader extraction evaluation and observation with recruited users are still needed. Current constraints include one item per submission, INR-only prices and a labeled fixed sample date for the existing Item Detail warranty display.

Permanent storage, recoverable accounts, household sharing, QR phone pairing, bulk import and automated repair/support discovery are deferred.

## Documentation

- [Approved demo scope](docs/product/demo-scope.md)
- [Session-only architecture](docs/engineering/session-only-demo.md)
- [Gemini extraction](docs/engineering/gemini-extraction.md)
- [Shared usage limits and security notes](docs/engineering/analysis-usage-limits.md)
- [Self-guided onboarding](docs/engineering/demo-onboarding.md)
- [Synthetic sample documents](docs/engineering/demo-files.md)
- [Product principles](docs/product/product-principles.md)
- [Design system](docs/design/design-system.md)
- [Delivery plan](docs/plans/MVP-plan.md)

Read [AGENTS.md](AGENTS.md) and the relevant product documents before making changes. Preserve the existing UI, keep uncertainty visible, and distinguish current demo behavior from future roadmap ambitions.
