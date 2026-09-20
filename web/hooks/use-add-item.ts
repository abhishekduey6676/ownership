"use client";
import { useEffect, useRef, useState } from 'react';
import { useMock } from '@/components/mock-provider';
import { extractionService } from '@/lib/ai/extraction';
import { demoSamples, findDemoSample, purchaseTextSource, type DemoSampleId } from '@/lib/demo/samples';
import type { DraftItem, ExtractionSource } from '@/lib/ai/contracts';
import { fieldLabels, fileError, validateItemFields, type ItemFields } from '@/lib/mock-data';
import { deriveWarrantyExpiry, extractionFileLimit } from '@/lib/ai/validation';

const blankFields = Object.fromEntries(Object.keys(fieldLabels).map(key => [key, ''])) as ItemFields;
type Step = 'source' | 'analyzing' | 'review' | 'created';

/** Orchestrates intake only. Confirmed records live exclusively in MockProvider. */
export function useAddItem() {
  const { createItem, keepUrl } = useMock();
  const [step, setStep] = useState<Step>('source');
  const [uploadSource, setUploadSource] = useState<ExtractionSource | null>(null);
  const [analyzedSource, setAnalyzedSource] = useState<ExtractionSource | null>(null);
  const [text, setText] = useState('');
  const [tab, setTab] = useState('upload');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [draft, setDraft] = useState<DraftItem | null>(null);
  const [fields, setFields] = useState<ItemFields>({ ...blankFields });
  const [createdId, setCreatedId] = useState('');
  const [saving, setSaving] = useState(false);
  const saveId = useRef<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  const submitted = useRef(false);
  useEffect(() => () => pending.current?.abort(), []);

  function selectFile(file?: File) {
    if (!file) return;
    const message = fileError(file);
    if (message) { setError(message); return; }
    if (file.size > extractionFileLimit) { setError('Maximum size for AI analysis is 3 MB.'); return; }
    const url = URL.createObjectURL(file);
    keepUrl(url);
    setUploadSource({ kind: 'file', file, document: { name: file.name, url, mime: file.type, origin: 'user' } });
    setConsent(false);
    setError('');
  }

  async function analyze() {
    if (pending.current || submitted.current) return;
    if (!consent) { setError('Confirm the processing notice before analyzing.'); return; }
    const input: ExtractionSource | null = tab === 'text'
      ? purchaseTextSource(text)
      : uploadSource;
    if (!input || (input.kind === 'text' && !input.text.trim())) {
      setError(tab === 'text' ? 'Add some text first.' : 'Choose a file or use the sample invoice.');
      return;
    }
    setError('');
    setConfirmed(false);
    // Revisiting an unchanged source retains manual corrections, rather than silently replacing them.
    const sameSource = input === analyzedSource || (input.kind === 'text' && analyzedSource?.kind === 'text' && input.text === analyzedSource.text);
    if (sameSource && draft) { setStep('review'); return; }
    const controller = new AbortController();
    pending.current = controller;
    setAnalyzedSource(input);
    setStep('analyzing');
    try {
      const result = await extractionService.extract(input, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setDraft(result);
      setFields({ ...result.fields });
      setStep('review');
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Analysis failed. Please try again.');
        setAnalyzedSource(null);
        setStep('source');
      }
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }

  function backToSource() {
    if (submitted.current) return;
    if (pending.current) {
      pending.current.abort();
      pending.current = null;
      // A cancelled run has no usable result for its new source.
      setAnalyzedSource(null);
    }
    setConfirmed(false);
    setStep('source');
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (submitted.current) return;
    if (!confirmed || !draft || !analyzedSource) { setError('Review and confirm the details first.'); return; }
    const message = validateItemFields(fields);
    if (message) { setError(message); return; }
    submitted.current = true;
    setSaving(true);
    saveId.current ??= crypto.randomUUID();
    try {
      const id = await createItem(fields, [analyzedSource.document], saveId.current);
      setCreatedId(id);
      setStep('created');
      setError('');
    } catch (cause) {
      submitted.current = false;
      setError(cause instanceof Error ? cause.message : 'Could not create the item. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function fieldHint(key: keyof ItemFields) {
    if (!fields[key].trim() && draft?.fields[key].trim()) return 'Cleared by you. This detail will not be recorded.';
    if (!fields[key].trim()) return key === 'serial' ? 'Serial number not found. Add it if you have it.' : `${fieldLabels[key]} not recorded.`;
    if (key === 'warrantyExpiry' && draft?.facts.warrantyExpiry.derived && fields.warrantyExpiry === deriveWarrantyExpiry(fields.purchaseDate, fields.warranty)) return `Calculated from ${fields.purchaseDate} + ${fields.warranty}, anniversary minus one day. Assumes coverage starts on purchase date; review the terms.`;
    if (fields[key] !== draft?.fields[key]) return 'Edited by you';
    return `${draft?.facts[key].source ?? 'Draft'}${draft?.facts[key].evidence ? ' · “' + draft.facts[key].evidence + '”' : ''}`;
  }

  function editField(key: keyof ItemFields, value: string) {
    setFields(current => {
      const next = { ...current, [key]: value };
      if (draft?.facts.warrantyExpiry.derived && ['purchaseDate', 'warranty'].includes(key) && current.warrantyExpiry && current.warrantyExpiry === deriveWarrantyExpiry(current.purchaseDate, current.warranty)) {
        next.warrantyExpiry = deriveWarrantyExpiry(next.purchaseDate, next.warranty);
      }
      return next;
    });
    setConfirmed(false);
  }

  function enterManually() {
    const input: ExtractionSource = { kind: 'text', text: '', document: { name: 'Manual entry', text: '', origin: 'manual' } };
    setAnalyzedSource(input);
    setFields({ ...blankFields });
    setDraft({ fields: { ...blankFields }, facts: Object.fromEntries(Object.keys(fieldLabels).map(key => [key, { source: 'Entered by you', confidence: 'unknown' }])) as DraftItem['facts'], provider: 'manual' });
    setError(''); setConfirmed(false); setStep('review');
  }

  function useSample(id: DemoSampleId = 'invoice') {
    const sample = demoSamples.find(sample => sample.id === id);
    if (!sample || pending.current || submitted.current) return;
    setText(sample.text); setTab('text'); setError(''); setConsent(false); setConfirmed(false);
  }

  function startAnother() {
    if (step !== 'created' || saving) return;
    // Keep the shared collection and its document URLs, reset intake only.
    submitted.current = false; saveId.current = null;
    setUploadSource(null); setAnalyzedSource(null); setText(''); setTab('upload');
    setDraft(null); setFields({ ...blankFields }); setCreatedId('');
    setError(''); setConfirmed(false); setConsent(false); setStep('source');
  }

  const activeSource = step === 'source' ? (tab === 'text' ? purchaseTextSource(text) : uploadSource) : analyzedSource;
  return {
    step, source: activeSource?.document,
    selectedSample: activeSource?.kind === 'text' ? findDemoSample(activeSource.text) : undefined,
    text, setText: (value: string) => { setText(value); setConsent(false); }, tab, setTab, error, setError, confirmed, setConfirmed, consent, setConsent, draft, editField, enterManually,
    fields, setFields, saving, createdId, selectFile, analyze, save, backToSource, fieldHint,
    removeSource: () => setUploadSource(null),
    useSample, startAnother,
  };
}
