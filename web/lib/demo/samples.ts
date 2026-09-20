import type { ExtractionSource } from '../ai/contracts';
import type { ItemDocument } from '../mock-data';

/** These are source examples, not extraction results. Analysis still calls the real provider. */
export const demoSamples = [
  {
    id: 'invoice', label: 'Try a sample invoice', name: 'Detailed sample invoice',
    summary: 'Purchase and warranty details. A missing serial number.',
    reviewTip: 'Compare the suggested price and dates with the source. The serial number is missing: leave it blank or enter a clearly fictional value to try editing.',
    text: 'SYNTHETIC DEMO INVOICE — NOT VALID FOR A CLAIM\n\nPhilips Air Fryer HD9252\nRetailer: Blinkit\nPrice: INR 6,499\nPurchase date: 10 September 2026\nSample warranty: 2 years\nSample expiry: 9 September 2028\nSerial number: not found\n\nThese are fictional demonstration values, not verified product or warranty information.',
  },
  {
    id: 'missing', label: 'Try missing details', name: 'Incomplete sample invoice',
    summary: 'An invoice with no warranty or serial number.',
    reviewTip: 'Warranty duration, expiry and serial number should stay blank. Missing evidence does not mean there is no warranty. Clear any unsupported suggestion before confirming.',
    text: 'SYNTHETIC DEMO INVOICE — NOT VALID FOR A CLAIM\n\nProduct: Wireless headphones\nBrand: Demo Audio\nModel: Sound One\nRetailer: Example Shop\nPrice: INR 1,200\nPurchase date: 10 September 2026\n\nFictional demonstration document only.',
  },
  {
    id: 'prompt', label: 'Try a purchase prompt', name: 'Sample smartwatch prompt',
    summary: '“I bought a smartwatch today…” No receipt needed.',
    reviewTip: 'Check the displayed date and timezone used for “today.” Any calculated expiry assumes coverage starts on purchase day; review that assumption. Brand, price and serial number were not supplied.',
    text: 'Synthetic demo purchase note: I bought a smartwatch today and it has a six-month warranty.',
  },
] as const;

export type DemoSampleId = typeof demoSamples[number]['id'];
export const findDemoSample = (text: string) => demoSamples.find(sample => sample.text === text.trim());
export const sampleInvoice: ItemDocument = { name: demoSamples[0].name, text: demoSamples[0].text, origin: 'sample' };

/** Only an unchanged known example gets a synthetic-source label. Edited text belongs to the user. */
export function purchaseTextSource(text: string): ExtractionSource {
  const sample = findDemoSample(text);
  return { kind: 'text', text, document: {
    name: sample?.name ?? 'Your purchase description', text, origin: sample ? 'sample' : 'user',
  } };
}
