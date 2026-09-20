import { NextRequest, NextResponse } from 'next/server';
import { sessionClient } from '@/lib/supabase/server';
import { extractWithGemini } from '@/lib/ai/gemini';
import { extractionFileLimit, referenceDateFor, validFileSignature } from '@/lib/ai/validation';
import { reserveExtraction } from '@/lib/ai/local-limits';
import { reserveSharedAnalysis } from '@/lib/ai/shared-limits';
import { AnalysisLimitError } from '@/lib/ai/usage-errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const reply = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  // Shared daily counters alone do not complete signup abuse, resource and privacy safeguards.
  if (process.env.NODE_ENV === 'production') return reply('Public AI analysis is not enabled yet. Abuse, input-resource and privacy safeguards must be completed first.', 503);
  if (request.headers.get('origin') !== request.nextUrl.origin || request.headers.get('sec-fetch-site') === 'cross-site') return reply('Request origin not allowed.', 403);
  if (!process.env.GEMINI_API_KEY) return reply('Gemini is not configured on the server.', 503);
  let release: (() => void) | undefined;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data;')) return reply('Use a file or purchase description.', 400);
    const reader = request.body?.getReader();
    if (!reader) return reply('No source provided.', 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > extractionFileLimit + 16384) { await reader.cancel(); return reply('Source too large. Maximum file size is 3 MB.', 413); }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': contentType } }).formData();
    if (form.get('consent') !== 'yes') return reply('Confirm that this non-sensitive input may be sent to Google for analysis.', 400);
    for (const key of form.keys()) if (!['file','text','timeZone','consent'].includes(key) || form.getAll(key).length !== 1) return reply('Invalid source request.', 400);
    const zone = form.get('timeZone');
    if (typeof zone !== 'string' || zone.length > 100) return reply('Choose a valid timezone.', 400);
    let referenceDate: string;
    try { referenceDate = referenceDateFor(zone); } catch { return reply('Invalid timezone.', 400); }
    const file = form.get('file'); const text = form.get('text');
    if ((file !== null) === (text !== null)) return reply('Provide exactly one source.', 400);
    let input;
    if (file instanceof File) {
      if (!file.size || file.size > extractionFileLimit) return reply('Choose a nonempty file up to 3 MB.', 400);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!validFileSignature(bytes, file.type)) return reply('File contents must match a JPG, PNG, WebP or PDF.', 400);
      input = { bytes, mime: file.type, referenceDate, timeZone: zone };
    } else if (typeof text === 'string' && text.trim() && text.length <= 5000) {
      input = { text: text.trim(), referenceDate, timeZone: zone };
    } else return reply('Provide a supported file or 1–5,000 characters of text.', 400);
    // Identity is only for AI quotas; no item or source is sent to Supabase.
    // Intake no longer depends on GET /api/items bootstrapping a session.
    const { client } = await sessionClient(true);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return reply('Could not verify your analysis session. Please retry.', 401);
    release = reserveExtraction(data.user.id);
    await reserveSharedAnalysis(client, request.signal);
    if (request.signal.aborted) return reply('Analysis was cancelled. You can retry or enter details manually.', 400);
    return NextResponse.json(await extractWithGemini(input, request.signal), { headers: { 'Cache-Control': 'no-store' } });
  } catch (cause) {
    if (cause instanceof AnalysisLimitError) return NextResponse.json({ error: cause.message }, {
      status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(cause.retryAfterSeconds) },
    });
    // Never return raw upstream responses, validation payloads, document text or credentials.
    const safe = cause instanceof Error && /^(Gemini|Analysis|Could not reach Gemini|Local demo|Could not restore)/.test(cause.message);
    return reply(safe ? (cause as Error).message : 'Could not analyze this source. Retry or enter details manually.', 503);
  } finally { release?.(); }
}
