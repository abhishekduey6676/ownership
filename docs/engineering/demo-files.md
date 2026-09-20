# Downloadable sample files — 16 September 2026

The Add Item sample picker now offers two static examples in both PNG and PDF:

- Detailed invoice: all 11 supported fields, with explicitly fictional brand/serial data.
- Incomplete invoice: purchase/product facts only; no warranty, expiry, serial or location facts.

These binary examples are independent of the existing editable text samples. Both formats
of each file share the same field manifest and layout. Every file prominently says
`SYNTHETIC - NOT VALID FOR A CLAIM`. No personal, payment or contact data is included.

## User path

Download PNG/PDF -> Go to image/PDF upload -> choose the downloaded file -> acknowledge
processing -> Analyze -> review/correct -> confirm. Download links do not invoke AI and the
upload shortcut only changes the source tab. Actual files pass through the existing File /
FormData / Gemini route, not the text fixture path. Sources and confirmed items keep their
existing memory-only lifetime. Public bundled fixtures are not user-upload storage.

Downloading deliberately writes a copy to the visitor's device through the browser's normal
download mechanism. That explicit download is separate from the app's memory-only collection.

## Sources and regeneration

- `web/lib/demo/file-samples.json`: source fields, labels and review guidance. Guidance is not
  printed in the files, so missing-field test expectations are not given to the model.
- `web/scripts/generate-demo-files.py`: reportlab PDFs and directly authored Pillow PNGs using
  shared embedded/bundled Vera fonts and one layout. No new application dependency or AI service.
- `web/public/samples/`: four committed static assets, all under 90 KB each.
- `web/components/demo-sample-picker.tsx`: labeled download links and upload shortcut.

Run the Python script with the bundled runtime containing reportlab/Pillow/pypdf to regenerate.
Use `--check` for read-only verification. Asset generation is a development step, not a build
hook or request-time task, so downloads do not require Python or image generation on Vercel.

## Checks and limitations

Generation and `--check` passed: strict PDF parsing, one page, all source text, absent unsupported
fields, no interactive form/open action/annotations, PNG integrity/dimensions and size/signatures.
Text widths and page coordinates are asserted while authoring. These are structural checks,
not visual QA. PDF previews and app rendering were deliberately skipped at the user's request.

`node scripts/test-demo-files.cjs` passed: all four files use valid allowlisted signatures and
sizes; the actual browser extraction adapter submits identical binary bytes with the right MIME
types, and sends neither fixture text nor precomputed field results. Network requests are stubbed.
Existing onboarding, memory-state and extraction-contract tests passed, as did TypeScript and
scoped lint. No paid provider calls or build were run. Real OCR/extraction accuracy for these
specific files and visual/accessibility validation remain unmeasured.

Public analysis still requires shared budget/abuse controls and provider/privacy review; this
slice does not remove the existing production gate.
