export type ItemFields = {
  name: string; category: string; brand: string; model: string; serial: string;
  retailer: string; purchaseDate: string; price: string; warranty: string; warrantyExpiry: string; location: string;
};
export type ItemDocument = { name: string; text?: string; url?: string; mime?: string; origin?: 'sample' | 'user' | 'manual' };
export type MockItem = ItemFields & { id: string; image: string; documents: ItemDocument[]; confirmed: boolean; status?: string; createdAt?: string; sampleKey?: string };
export const demoDate = '2026-09-12';
export const fieldLabels: Record<keyof ItemFields, string> = {
  name: 'Product name', category: 'Category', brand: 'Brand', model: 'Model', serial: 'Serial number',
  retailer: 'Retailer', purchaseDate: 'Purchase date', price: 'Purchase price (INR)', warranty: 'Warranty period', warrantyExpiry: 'Warranty expiry', location: 'Physical location',
};
export const airFryer: MockItem = {
  id: 'air-fryer', name: 'Air fryer', category: 'Kitchen appliance', brand: 'Demo Kitchen', model: 'AF-400', serial: 'DEMO-AF-0042',
  retailer: 'Blinkit', purchaseDate: '2026-08-20', price: '4999', warranty: '1 year', warrantyExpiry: '2027-08-20', location: 'Home / Kitchen',
  image: '/items/air-fryer.png', confirmed: true,
  documents: [
    { name: 'Sample invoice', origin: 'sample', text: 'SYNTHETIC DEMO INVOICE — NOT VALID FOR A CLAIM\n\nAir fryer · Demo Kitchen AF-400\nRetailer: Blinkit\nPurchase date: 20 August 2026\nPrice: INR 4,999\nSerial: DEMO-AF-0042' },
    { name: 'Sample warranty card', origin: 'sample', text: 'SYNTHETIC DEMO WARRANTY — NOT ACTUAL COVERAGE\n\nDemo Kitchen AF-400\nSample expiry: 20 August 2027\nThis document illustrates the warranty interface only. It makes no claim about a real product.' },
  ],
};
export const initialItems: MockItem[] = [airFryer, {
  id: 'earphones', name: 'Wireless earphones', category: 'Audio', brand: 'Demo Audio', model: 'Buds One', serial: '',
  retailer: 'Flipkart Minutes', purchaseDate: '', price: '2499', warranty: '', warrantyExpiry: '', location: 'Home / Bedroom',
  image: '/items/wireless-earbuds.png', confirmed: true,
  documents: [{ name: 'Sample earphones invoice', origin: 'sample', text: 'SYNTHETIC DEMO INVOICE\n\nWireless earphones · Demo Audio\nPrice: INR 2,499\nRetailer: Flipkart Minutes\nPurchase date: unreadable in this fixture.' }],
}];
export function warrantyStatus(item: Pick<ItemFields, 'warrantyExpiry'>) {
  if (!item.warrantyExpiry) return 'Unknown';
  return item.warrantyExpiry >= demoDate ? 'Active' : 'Expired';
}
export function dateLabel(value: string) {
  return value ? new Date(value + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not recorded';
}
export function fileError(file: { size: number; type: string }) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) return 'Choose a JPG, PNG, WebP image, or PDF.';
  if (!file.size) return 'This file is empty. Choose another file.';
  if (file.size > 10 * 1024 * 1024) return 'The file is too large. Maximum size is 10 MB.';
  return '';
}

/** Only editable fields cross the confirmation boundary; IDs and documents cannot leak from drafts. */
export function normalizeItemFields(fields: ItemFields): ItemFields {
  return Object.fromEntries(Object.keys(fieldLabels).map(key => [key, fields[key as keyof ItemFields].trim()])) as ItemFields;
}
export function validateItemFields(fields: ItemFields): string {
  if (!fields.name.trim()) return 'Enter a product name.';
  if (fields.price && (!Number.isFinite(Number(fields.price)) || Number(fields.price) < 0)) return 'Enter a valid non-negative price.';
  for (const value of [fields.purchaseDate, fields.warrantyExpiry]) {
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value)) return 'Enter a valid date.';
  }
  if (fields.purchaseDate && fields.warrantyExpiry && fields.warrantyExpiry < fields.purchaseDate) return 'Warranty expiry cannot precede the purchase date.';
  return '';
}
