# Design system

## Current demo additions

Follow [public demo scope](../product/demo-scope.md), preserving the approved lime/violet
palette and typography. Replace product illustration defaults with existing-library category
icons and a generic fallback; no per-item image generation. Make tooltip help usable on
keyboard and touch. Keep demo retention and AI-processing disclosure visible outside tooltips.
Review uses Found in source / Not found / Edited by you / Calculated labels; do not imply
confidence equals verification. These additions do not authorize a visual redesign.

## 1. Experience direction

Approved prototype direction (12 September 2026): electric lime (`#d5ff00`), violet (`#b789fa`), near-black (`#171914`), and neutral white surfaces, with heavy responsive display headings and readable 16px body text. This user-selected direction supersedes the original blue palette below. Use color for a distinctive consumer identity without weakening trust or status labels.

Ownership should feel like a calm personal library with the clarity of a well-kept folder and the warmth of familiar household objects. It should not resemble an IT inventory console.

Visual thesis: **quiet confidence, visible evidence**. Use clean surfaces and restrained color, with source and trust states expressed consistently rather than loudly.

## 2. Foundations

### Color roles

Use semantic tokens rather than hard-coded component colors.

- **Canvas:** cool, near-white neutral; deep blue-black in dark mode.
- **Surface:** white or a slightly lifted dark neutral.
- **Text:** near-black/navy with muted slate secondary text.
- **Primary:** saturated indigo-blue for selected states and primary actions.
- **Accent:** clear cyan or electric blue used sparingly for focus and evidence links.
- **Success:** teal for completed or active states, never as decoration.
- **Warning:** amber for expiring or incomplete states.
- **Danger:** red for destructive confirmation and overdue critical actions.
- **Unknown:** neutral slate; unknown is not a warning by default.

Meet WCAG AA contrast for text and meaningful controls. Do not communicate status through color alone.

### Typography

- Use a highly legible sans-serif variable font or system stack.
- Body copy starts at 1rem with a comfortable line height.
- Routine labels are at least 0.875rem; reserve smaller text for nonessential metadata.
- Item names use confident but not oversized display type.
- Use tabular numerals for dates, prices, serial numbers, and confidence metadata.

### Spacing and shape

- Base spacing unit: 4px, with common rhythm at 8, 12, 16, 24, 32, and 48px.
- Prefer moderate 12–16px corner radii. Reserve pill shapes for filters and short statuses.
- Use borders and surface contrast before shadows. Shadows should indicate layering, not decorate every card.
- Keep touch targets at least 44×44px.

### Imagery

User-supplied product photos and document thumbnails are functional content. Display them with stable aspect ratios and clear fallbacks. Category fallbacks may use a trusted icon set; do not create faux product illustrations with CSS shapes.

## 3. Core components

### Item card

Contains image/fallback, item name, brand/model when known, location, one status, and at most one next-attention reason. The entire card may be clickable, but nested actions need distinct accessible names.

### Attention card

Contains reason first, then item identity, date or missing condition, and one action. Severity follows time and consequence, not vague AI scoring.

### Fact row

Contains label, trusted value or “Not recorded,” and an optional source affordance. Edit is explicit. Draft review variants additionally show confidence and accept/edit/clear controls.

### Source badge

Examples: `Invoice · page 1`, `Entered by you`, `Derived from purchase date + 12 months`. It opens provenance detail and never implies authority solely from AI confidence.

### Confidence indicator

Use words—High, Medium, Low—alongside an icon or meter if helpful. Low-confidence fields receive stronger review emphasis. Raw probabilities belong in technical details, not the default interface.

### Warranty status

Supported states:

- Active — confirmed expiry is in the future
- Expiring soon — active and inside the configured attention window
- Expired — confirmed expiry is in the past
- Unknown — insufficient trusted information
- Not applicable — explicitly set by the user

Never calculate from draft dates.

### Timeline entry

Shows event type, date, plain-language title, source/author, and optional detail. Upcoming items and history use the same component with clear section labels.

### Document tile

Shows thumbnail or type icon, user-facing title, type, upload date, processing status, and actions. Avoid displaying opaque storage filenames as primary labels.

### Dialogs and destructive actions

Use dialogs for focused edits and alert dialogs for deleting a document or changing lifecycle status. Explain consequences precisely. “Archive” and “Delete document” must not be visually or linguistically conflated.

## 4. Interaction patterns

- Use progressive disclosure for provenance and technical metadata.
- Keep primary actions stable in placement through multi-step flows.
- Autosave only low-risk drafts and say when it happens. Confirmation and lifecycle changes require explicit submission.
- Use skeletons for predictable layouts; use progress messaging for extraction because it may take longer.
- Toasts confirm small completed actions. Persistent errors stay near the failed control.
- Avoid celebratory animation for routine recordkeeping. Motion should clarify state change and respect reduced-motion preferences.

## 5. Content design

Write in plain, direct language.

- Prefer “Warranty information not found” to “No warranty.”
- Prefer “We couldn't read this PDF” to “Extraction pipeline failed.”
- Prefer “Confirm these details” to “Validate AI output.”
- Prefer “Saved from invoice · page 1” to “AI generated.”

Do not use “smart,” “effortless,” or “100% accurate” claims. Avoid blame when information is missing. Safety and warranty caveats should be specific and close to the relevant action.

## 6. Accessibility

- All functionality must work by keyboard and with visible focus.
- Associate every input and error with a programmatic label.
- Announce upload and extraction progress without excessive live-region updates.
- Provide text alternatives for meaningful product images and mark decorative imagery accordingly.
- Do not place essential actions behind hover.
- Preserve reading order when cards reflow on mobile.
- Support 200% text enlargement without clipped controls or horizontal page scrolling.
- Dates, prices, and status language must remain understandable independent of icons and color.

## 7. Responsive behavior

- Mobile uses one primary column, edge-safe sticky actions where needed, and sheets for secondary details.
- Tablet may place attention and recent items in two columns.
- Desktop can use a navigation rail and a content column with a contextual side panel.
- Review extraction remains field-centered; do not compress it into a wide spreadsheet.
- Document previews may open full-screen on small devices.

## 8. Design review checklist

- Can a user name the next action in the first viewport?
- Are unknown, draft, confirmed, and conflicting states visually distinct?
- Is every consequential fact traceable without cluttering the default view?
- Does the page still feel personal with ten items and usable with hundreds?
- Are warnings factual and proportional?
- Does any UI imply a feature, source, or certainty the product does not have?
