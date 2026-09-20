"use client";
import { createContext, useContext, useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { type MockItem, type ItemFields, type ItemDocument } from '@/lib/mock-data';
import { createMemoryItemRepository } from '@/lib/items/repository';
type Store = { items: MockItem[]; loading: boolean; loadError: string; reload: () => Promise<void>;
  createItem: (fields: ItemFields, documents: ItemDocument[], id: string) => Promise<string>;
  updateItem: (id: string, fields: ItemFields) => Promise<void>; keepUrl: (url: string) => void };
const Context = createContext<Store | null>(null);
// Kept under the existing export name to avoid changing every consumer.
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [repository] = useState(createMemoryItemRepository);
  const items = useSyncExternalStore(repository.subscribe, repository.list, repository.list);
  const urls = useRef<string[]>([]);
  useEffect(() => {
    const ownedUrls = urls.current;
    return () => ownedUrls.forEach(url => URL.revokeObjectURL(url));
  }, []);
  return <Context.Provider value={{ items, loading: false, loadError: '', reload: async () => {}, keepUrl: url => urls.current.push(url),
    createItem: (fields, documents, id) => repository.create(id, fields, documents),
    updateItem: repository.update,
  }}>{children}</Context.Provider>;
}
export function useMock() {
  const value = useContext(Context);
  if (!value) throw new Error('MockProvider is required');
  return value;
}
