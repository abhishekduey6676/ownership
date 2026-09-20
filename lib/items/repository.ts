import { initialItems, normalizeItemFields, validateItemFields, type ItemFields, type ItemDocument, type MockItem } from '../mock-data';

/** One instance per mounted app, never a server/module singleton or browser storage cache. */
export function createMemoryItemRepository() {
  let items: MockItem[] = structuredClone(initialItems);
  const listeners = new Set<() => void>();
  const publish = (next: MockItem[]) => { items = next; listeners.forEach(listener => listener()); };
  const confirmedFields = (fields: ItemFields) => {
    const normalized = normalizeItemFields(fields);
    const error = validateItemFields(normalized);
    if (error) throw new Error(error);
    return normalized;
  };
  return {
    // Stable snapshots until a write, suitable for React's useSyncExternalStore.
    list: () => items,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    create: async (id: string, fields: ItemFields, documents: ItemDocument[]) => {
      const existing = items.find(item => item.id === id);
      if (existing) return existing.id; // A retry cannot duplicate or overwrite a confirmed record.
      const item: MockItem = { ...confirmedFields(fields), id, image: '', confirmed: true,
        status: 'active', createdAt: new Date().toISOString(), documents: structuredClone(documents) };
      publish([item, ...items]);
      return item.id;
    },
    update: async (id: string, fields: ItemFields) => {
      if (!items.some(item => item.id === id)) throw new Error('This demo item is no longer available. Refresh clears added items.');
      const normalized = confirmedFields(fields);
      publish(items.map(item => item.id === id ? { ...item, ...normalized } : item));
    },
  };
}
