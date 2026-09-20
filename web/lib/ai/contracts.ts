import type { ItemDocument, ItemFields } from '../mock-data';

export type ExtractionSource =
  | { kind: 'file'; file: File; document: ItemDocument }
  | { kind: 'text'; text: string; document: ItemDocument }
  | { kind: 'sample'; document: ItemDocument };

export type DraftItem = {
  fields: ItemFields;
  provider?: 'gemini' | 'mock' | 'manual';
  referenceDate?: string;
  timeZone?: string;
  warnings?: string[];
  // Metadata describes proposals only, never whether a confirmed value is true.
  facts: Record<keyof ItemFields, { source: string; confidence: 'high' | 'low' | 'unknown'; evidence?: string; derived?: boolean }>;
};

/** Implement this contract for a future server-backed provider. No provider writes to item state. */
export interface ExtractionService {
  extract(source: ExtractionSource, options?: { signal?: AbortSignal }): Promise<DraftItem>;
}
