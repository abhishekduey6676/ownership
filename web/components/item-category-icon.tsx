import { Box, Headphones, Laptop, Plug, Smartphone, Watch } from 'lucide-react';

const categories = [
  { pattern: /\b(wearables?|smartwatch(es)?|watch(es)?|fitness trackers?)\b/, icon: Watch, label: 'Wearable' },
  { pattern: /\b(audio|headphones?|earphones?|earbuds?|speakers?)\b/, icon: Headphones, label: 'Audio' },
  { pattern: /\b(phones?|smartphones?|mobiles?)\b/, icon: Smartphone, label: 'Phone' },
  { pattern: /\b(computers?|laptops?|desktops?|tablets?)\b/, icon: Laptop, label: 'Computer' },
  { pattern: /\b(appliances?|kitchen|refrigerators?|washers?|washing machines?|air fryers?|vacuum cleaners?)\b/, icon: Plug, label: 'Appliance' },
];

/** Presentation only: never infers or changes the item's recorded category. */
export function ItemCategoryIcon({ category }: { category: string }) {
  const normalized = category.trim().toLowerCase().replace(/[-_]/g, ' ');
  const match = categories.find(entry => entry.pattern.test(normalized));
  const Icon = match?.icon ?? Box;
  return <div className="item-category-art" role="img" aria-label={`${match?.label ?? 'Generic item'} category icon`}>
    <Icon aria-hidden="true" strokeWidth={1.5} />
  </div>;
}
