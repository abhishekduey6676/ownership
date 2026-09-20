import type { DraftItem, ExtractionService } from './contracts';
import { fieldLabels, fileError, type ItemFields } from '../mock-data';

// Fictional example values for UI testing. No assertion about actual Philips warranty coverage.
const sampleFields: ItemFields = {
  name: 'Philips Air Fryer', category: 'Kitchen appliance', brand: 'Philips', model: 'HD9252',
  retailer: 'Blinkit', price: '6499', purchaseDate: '2026-09-10', warranty: '2 years',
  warrantyExpiry: '2028-09-09', serial: '', location: 'Home / Kitchen',
};

export { sampleInvoice } from '../demo/samples';

export const mockExtraction: ExtractionService = {
  async extract(source, { signal } = {}) {
    if (source.kind === 'file') {
      const error = fileError(source.file);
      if (error) throw new Error(error);
    }
    if (source.kind === 'text' && !source.text.trim()) throw new Error('Add some text first.');
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) { reject(new DOMException('Analysis cancelled', 'AbortError')); return; }
      const cancel = () => { clearTimeout(timer); reject(new DOMException('Analysis cancelled', 'AbortError')); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, 1200);
      signal?.addEventListener('abort', cancel, { once: true });
    });
    return {
      fields: { ...sampleFields },
      facts: Object.fromEntries(Object.keys(fieldLabels).map(key => [key, {
        source: 'Mock fixture', confidence: key === 'serial' ? 'unknown' : 'high',
      }])) as DraftItem['facts'],
    };
  },
};
