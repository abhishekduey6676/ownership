import type { ItemDocument } from './mock-data';

export function documentCopy(document: ItemDocument) {
  if (document.origin === 'sample') return {
    label: 'Synthetic demo source',
    description: 'Fictional sample content, not a real invoice or proof of warranty. Any analysis still needs your review.',
  };
  if (document.origin === 'manual') return {
    label: 'Manually entered details',
    description: 'You entered this record manually. No supporting source was attached or sent for analysis.',
  };
  return {
    label: document.url ? 'Selected file · this visit only' : 'Source text · this visit only',
    description: 'This preview stays in this tab until refresh. Choosing Analyze sends the selected source to Google; keeping a local preview does not mean it was never transmitted.',
  };
}
