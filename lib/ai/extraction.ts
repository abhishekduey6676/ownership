import type { DraftItem, ExtractionService } from './contracts';

// No key or provider SDK is imported into this browser adapter.
export const extractionService: ExtractionService = {
  async extract(source, { signal } = {}) {
    const form = new FormData();
    form.set('consent', 'yes');
    form.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (source.kind === 'file') form.set('file', source.file);
    else form.set('text', source.kind === 'text' ? source.text : source.document.text || '');
    const response = await fetch('/api/extract', { method: 'POST', body: form, signal, credentials: 'same-origin' });
    const result = await response.json() as DraftItem & { error?: string };
    if (!response.ok) throw new Error(result.error || 'Analysis failed. Please try again.');
    return result;
  },
};
