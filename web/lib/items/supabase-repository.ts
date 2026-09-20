import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { initialItems, normalizeItemFields, validateItemFields, fieldLabels, type ItemFields, type MockItem } from '@/lib/mock-data';

type Row = {
  id: string; owner_id: string; name: string; category: string | null; brand: string | null;
  model: string | null; serial_number: string | null; retailer: string | null;
  purchase_date: string | null; purchase_price: number | null; warranty_duration: string | null;
  warranty_expiry: string | null; location: string | null; status: string; created_at: string;
  sample_key: string | null;
};
export function parseFields(value: unknown): ItemFields {
  if (!value || typeof value !== 'object') throw new Error('Invalid item details.');
  const input = value as Record<string, unknown>;
  for (const key of Object.keys(fieldLabels)) {
    if (typeof input[key] !== 'string' || input[key].length > 2000) throw new Error('Invalid item details.');
  }
  const fields = normalizeItemFields(input as ItemFields);
  const error = validateItemFields(fields);
  if (error) throw new Error(error);
  if (fields.price && (!/^\d+(\.\d{1,2})?$/.test(fields.price) || Number(fields.price) > 9999999999.99)) throw new Error('Use a price with at most two decimal places.');
  return fields;
}
function columns(fields: ItemFields) {
  const f = parseFields(fields);
  return { name: f.name, category: f.category || null, brand: f.brand || null,
    model: f.model || null, serial_number: f.serial || null, retailer: f.retailer || null,
    purchase_date: f.purchaseDate || null, purchase_price: f.price ? Number(f.price) : null,
    warranty_duration: f.warranty || null, warranty_expiry: f.warrantyExpiry || null, location: f.location || null };
}
function item(row: Row): MockItem {
  const sample = initialItems.find(value => value.id === row.sample_key);
  return { id: row.id, name: row.name, category: row.category ?? '', brand: row.brand ?? '', model: row.model ?? '',
    serial: row.serial_number ?? '', retailer: row.retailer ?? '', purchaseDate: row.purchase_date ?? '',
    price: row.purchase_price === null ? '' : String(row.purchase_price), warranty: row.warranty_duration ?? '',
    warrantyExpiry: row.warranty_expiry ?? '', location: row.location ?? '', confirmed: true,
    image: sample?.image ?? '/items/air-fryer.png', documents: sample?.documents ?? [],
    status: row.status, createdAt: row.created_at, sampleKey: row.sample_key ?? undefined };
}
export function supabaseItemRepository(client: SupabaseClient, ownerId: string) {
  return {
    async list() {
      // Conflict-ignore preserves edits and makes repeat/parallel loads safe.
      const { error: seedError } = await client.from('items').upsert(initialItems.map(sample => ({
        ...columns(sample), owner_id: ownerId, sample_key: sample.id,
      })), { onConflict: 'owner_id,sample_key', ignoreDuplicates: true });
      if (seedError) throw new Error('Could not prepare sample records. Check the database migration and retry.');
      const { data, error } = await client.from('items').select('*').order('created_at', { ascending: false }).order('id');
      if (error) throw new Error('Could not load your records. Check the database connection and retry.');
      return (data as Row[]).map(item);
    },
    async create(id: string, fields: ItemFields) {
      const { error } = await client.from('items').upsert({ ...columns(fields), id, owner_id: ownerId }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw new Error('Could not save your item. Your draft is retained; please retry.');
      const { data, error: readError } = await client.from('items').select('*').eq('id', id).single();
      if (readError) throw new Error('Could not verify the save. Retry to recover the saved item without duplicating it.');
      const saved = item(data as Row);
      // A retry may include newly confirmed corrections after an uncertain response.
      const normalized = parseFields(fields);
      if (Object.keys(fieldLabels).some(key => saved[key as keyof ItemFields] !== normalized[key as keyof ItemFields])) {
        const { data: corrected, error: correctionError } = await client.from('items').update(columns(fields)).eq('id', id).select('*').single();
        if (correctionError) throw new Error('Could not save your latest corrections. Please retry.');
        return item(corrected as Row);
      }
      return saved;
    },
    async update(id: string, fields: ItemFields) {
      const { data, error } = await client.from('items').update(columns(fields)).eq('id', id).select('*').single();
      if (error) throw new Error('Could not save these changes. Please retry.');
      return item(data as Row);
    },
  };
}
