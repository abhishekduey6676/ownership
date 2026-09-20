# Product principles

## Current release — 16 September 2026

The [approved demo scope](demo-scope.md) takes precedence. Showcase AI-assisted structured
entry and human confirmation, not durable safekeeping. Items and source previews stay only
in browser memory until refresh. Explicit refresh reset replaces the withdrawn 24-hour storage
plan; do not add database cleanup machinery for new demo items. No recoverable account is
implied. Category icons remain deterministic. The broader principles below are future context.

## 1. Evidence earns trust

Important facts should answer “Where did this come from?” A fact may come from a document, a user, or a transparent calculation. AI confidence is not evidence. If a source is absent or ambiguous, say that the value is unknown.

## 2. AI proposes; people confirm

Automation reduces typing but does not acquire authority. AI output enters a draft layer. The user accepts, edits, or rejects each meaningful value before it becomes trusted data. A later AI run cannot overwrite confirmed data.

## 3. Unknown is a valid state

Never convert absence into a negative conclusion. No warranty date means unknown, not expired. No service schedule means none recorded, not no service required. Calm honesty is more useful than artificial completeness.

## 4. One record, useful over time

An item record should become more valuable as events accumulate. Preserve documents, corrections, service events, location changes, and lifecycle transitions. Status changes do not erase history.

## 5. Show the next useful action

The product prioritizes actionable needs over analytics. A dashboard alert explains the condition and offers a relevant action. Avoid scores, streaks, fear-based urgency, and decorative metrics.

## 6. Ask for less; confirm clearly

Let uploads and extraction do the first pass. Request manual input only for missing, conflicting, or essential information. Review screens should be fast to scan without encouraging blind acceptance.

## 7. Products are not interchangeable

Warranty, maintenance, and support behavior must follow actual evidence and product context. Category can shape interface language, but it cannot create unsupported service requirements or specifications.

## 8. Ownership, access, and location are different

A household controls access. An item has lifecycle ownership context. A location answers where the item is physically kept. Never use one concept as a shortcut for another.

## 9. Consumer calm over operational density

Use plain language, generous hierarchy, recognizable item imagery, and progressive disclosure. The interface should feel like a personal library, not a procurement database. Technical metadata belongs behind details, while warnings remain visible when consequential.

## 10. Privacy is part of the product

Invoices, serial numbers, addresses, and service records are sensitive. Default to private access, collect only what improves the ownership job, avoid third-party sharing, and make deletion and retention understandable.

## 11. Safe guidance has boundaries

“Something's wrong” organizes verified evidence and safe next steps. It is not a diagnosis engine. Never fabricate support contacts, claim requirements, maintenance intervals, specifications, or repair advice. Clearly identify external or user-provided guidance and its source.

## 12. Simple architecture supports product learning

Prefer one deployable application, managed data and storage, deterministic mock AI, and replaceable provider adapters. Add operational machinery only when a measured need justifies it.

## Decision checklist

Before adding a feature or field, ask:

1. Does it help the user register, understand, maintain, resolve, or retire an owned item?
2. What is its source, and can the product represent uncertainty honestly?
3. Does it reduce effort or add administration?
4. Is it necessary for the MVP journey?
5. Does it introduce a new privacy, safety, or permission burden?
6. Can it work correctly for different product types without inventing behavior?
