import { z } from 'zod';
import { fieldLabels, validateItemFields, type ItemFields } from '../mock-data';
import type { DraftItem } from './contracts';

export const extractionFileLimit = 3 * 1024 * 1024;
export const factKeys = Object.keys(fieldLabels) as (keyof ItemFields)[];
const observation = z.object({ value: z.string().max(500), evidence: z.string().max(300), confidence: z.enum(['high', 'low', 'unknown']) }).strict();
const observations = z.object(Object.fromEntries(factKeys.map(key => [key, observation])) as Record<keyof ItemFields, typeof observation>).strict();
export const responseSchema = z.object({ fields: observations, currency: z.string().max(3), relativePurchaseDate: z.enum(['none', 'today', 'yesterday']), warnings: z.array(z.string().max(300)).max(8) }).strict();

const factSchema = { type: 'object', properties: { value: { type: 'string' }, evidence: { type: 'string' }, confidence: { type: 'string', enum: ['high', 'low', 'unknown'] } }, required: ['value', 'evidence', 'confidence'], additionalProperties: false };
export const responseJsonSchema = { type: 'object', properties: {
  fields: { type: 'object', properties: Object.fromEntries(factKeys.map(key => [key, factSchema])), required: factKeys, additionalProperties: false },
  currency: { type: 'string' }, relativePurchaseDate: { type: 'string', enum: ['none', 'today', 'yesterday'] },
  warnings: { type: 'array', items: { type: 'string' } },
}, required: ['fields', 'currency', 'relativePurchaseDate', 'warnings'], additionalProperties: false };

export function referenceDateFor(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Calendar-month anniversary, clamped at month-end, minus one day (inclusive coverage).
 * This is a reviewable assumption, never a statement of actual warranty eligibility. */
export function deriveWarrantyExpiry(purchaseDate: string, warranty: string) {
  const duration = /^(\d+)\s*(months?|years?)$/i.exec(warranty.trim());
  if (!duration || !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) return '';
  const start = new Date(purchaseDate + 'T00:00:00Z');
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0,10) !== purchaseDate) return '';
  const months = Number(duration[1]) * (/year/i.test(duration[2]) ? 12 : 1);
  if (months < 1 || months > 120) return '';
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay) - 1);
  return target.toISOString().slice(0,10);
}

export function validateDraft(raw: unknown, referenceDate: string, timeZone: string): DraftItem {
  const result = responseSchema.parse(raw);
  const fields = {} as ItemFields;
  const facts = {} as DraftItem['facts'];
  const warnings = [...result.warnings];
  for (const key of factKeys) {
    const candidate = result.fields[key];
    const evidence = candidate.evidence.trim();
    fields[key] = evidence ? candidate.value.trim() : '';
    facts[key] = { source: fields[key] ? 'AI proposal from source' : 'Not found', confidence: fields[key] ? candidate.confidence : 'unknown', evidence };
  }
  if (result.fields.purchaseDate.evidence.trim() && result.relativePurchaseDate !== 'none') {
    const date = new Date(referenceDate + 'T00:00:00Z');
    if (result.relativePurchaseDate === 'yesterday') date.setUTCDate(date.getUTCDate() - 1);
    fields.purchaseDate = date.toISOString().slice(0,10);
    facts.purchaseDate.source = `Resolved ${result.relativePurchaseDate} using ${referenceDate} (${timeZone})`;
  }
  if (fields.price && result.currency.toUpperCase() !== 'INR') {
    fields.price = '';
    warnings.push('Price left blank: this form currently supports INR only, and INR was not established.');
    facts.price = { source: 'Currency unresolved or unsupported', confidence: 'unknown' };
  }
  if (fields.price && !/^\d+(\.\d{1,2})?$/.test(fields.price)) throw new Error('Invalid extracted price.');
  const invalid = validateItemFields({ ...fields, name: fields.name || 'Draft' });
  if (invalid) throw new Error('The extracted values were invalid.');
  if (!fields.warrantyExpiry) {
    const expiry = deriveWarrantyExpiry(fields.purchaseDate, fields.warranty);
    if (expiry) {
      fields.warrantyExpiry = expiry;
      facts.warrantyExpiry = { source: 'Calculated: assumes warranty starts on purchase date; anniversary minus one day. Review the terms.', confidence: 'unknown', derived: true };
    }
  }
  if (!fields.name) warnings.push('Product name not found. Add it before confirming.');
  return { fields, facts, warnings, referenceDate, timeZone, provider: 'gemini' };
}

export function validFileSignature(bytes: Uint8Array, mime: string) {
  const starts = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (mime === 'image/png') return starts([137,80,78,71,13,10,26,10]);
  if (mime === 'image/jpeg') return starts([255,216,255]);
  if (mime === 'application/pdf') return starts([37,80,68,70,45]);
  if (mime === 'image/webp') return starts([82,73,70,70]) && [87,69,66,80].every((value,index) => bytes[index+8] === value);
  return false;
}
