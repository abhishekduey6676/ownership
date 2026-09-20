// No rendering or network. Exercise the exact repository consumed by the shared provider.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing Node/TypeScript test harness pattern. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);
const { createMemoryItemRepository } = require('../lib/items/repository.ts');
const { initialItems, fieldLabels } = require('../lib/mock-data.ts');
global.fetch = () => { throw new Error('Item state must never make a network request'); };
for (const key of ['localStorage', 'sessionStorage', 'indexedDB']) {
  Object.defineProperty(global, key, { get() { throw new Error('Item state must not use persistent browser storage'); } });
}
(async () => {
  const store = createMemoryItemRepository();
  const freshTab = createMemoryItemRepository();
  assert.deepEqual(store.list(), initialItems);
  assert.notEqual(store.list()[0], initialItems[0]);
  assert.equal(store.list(), store.list()); // Stable React snapshot.
  let notifications = 0;
  const unsubscribe = store.subscribe(() => notifications++);
  const edited = Object.fromEntries(Object.keys(fieldLabels).map(key => [key, '']));
  Object.assign(edited, { name: '  My corrected watch  ', category: 'Wearable', brand: 'User brand', model: 'Edited model',
    serial: '', retailer: 'Edited retailer', purchaseDate: '2026-09-16', price: '0', warranty: '6 months',
    warrantyExpiry: '2027-03-15', location: 'Home / Study' });
  const documents = [{ name: 'Synthetic input', text: 'Original synthetic purchase prompt' }];
  const before = store.list();
  assert.equal(await store.create('new-watch', edited, documents), 'new-watch');
  assert.notEqual(store.list(), before);
  const item = store.list().find(item => item.id === 'new-watch');
  for (const key of Object.keys(fieldLabels)) assert.equal(item[key], edited[key].trim());
  assert(item.confirmed); assert(item.createdAt);
  documents[0].text = 'Changed outside repository';
  edited.name = 'Changed outside repository';
  assert.equal(item.name, 'My corrected watch');
  assert.equal(item.documents[0].text, 'Original synthetic purchase prompt');
  assert(store.list().slice(0, 4).includes(item)); // Home collection.
  assert(store.list().filter(i => i.name.toLowerCase().includes('corrected')).includes(item)); // Search.
  assert(store.list().filter(i => i.location === 'Home / Study').includes(item)); // Location.
  await store.create('new-watch', { ...edited, name: 'Retry must not overwrite' }, []);
  assert.equal(store.list().filter(i => i.id === 'new-watch').length, 1);
  assert.equal(notifications, 1);
  await store.update('new-watch', { ...item, name: 'Final edit', brand: '', location: '', warranty: '', warrantyExpiry: '' });
  assert.equal(store.list()[0].brand, ''); assert.equal(store.list()[0].warrantyExpiry, '');
  assert.equal(store.list()[0].documents[0].text, item.documents[0].text);
  assert.equal(item.name, 'My corrected watch'); // Earlier snapshot is unchanged.
  await assert.rejects(store.create('bad', { ...edited, name: '' }, []), /product name/);
  await assert.rejects(store.update('missing', edited), /no longer available/);
  await assert.rejects(store.update('new-watch', { ...edited, price: '-1' }), /price/);
  assert.equal(store.list()[0].name, 'Final edit');
  await store.update('air-fryer', { ...initialItems[0], name: 'Edited sample' });
  assert.equal(initialItems[0].name, 'Air fryer');
  assert.deepEqual(freshTab.list(), initialItems);
  // A reload remounts the provider and creates a new repository; no storage is rehydrated.
  const refreshed = createMemoryItemRepository();
  assert.deepEqual(refreshed.list(), initialItems);
  assert(!refreshed.list().some(i => i.id === 'new-watch'));
  assert(refreshed.list().find(i => i.id === 'air-fryer').documents.length);
  assert(refreshed.list().find(i => i.id === 'earphones'));
  unsubscribe(); const previousCount = notifications;
  await store.update('new-watch', { ...store.list()[0], name: 'After unsubscribe' });
  assert.equal(notifications, previousCount);
  console.log('PASS: confirmed edits/clears, shared snapshots, search/location data, duplicate protection, validation, independent tabs and refresh-to-samples. No rendering, storage or network.');
})().catch(error => { console.error(error); process.exitCode = 1; });
