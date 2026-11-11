import assert from 'node:assert/strict';
const base = process.env.BASE_URL ?? 'http://localhost:8080';
const response = await fetch(`${base}/api/items`);
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 'no-store');
const { items } = await response.json();
assert.ok(items.length > 0);
const detail = await fetch(`${base}/api/items/${items[0].id}`);
assert.deepEqual((await detail.json()).item, items[0]);
assert.equal((await fetch(`${base}/api/items/not-found`)).status, 404);
for (let i = 0; i < 5; i++) {
  const response = await fetch(`${base}/api/items/random`);
  assert.equal(response.status, 200);
  assert.ok(items.some((item: { id: string }) => item.id === undefined) === false);
  const { item } = await response.json();
  assert.ok(items.some((candidate: { id: string }) => candidate.id === item.id));
}
const html = await (await fetch(base)).text();
assert.ok(html.includes('今天吃什麼'));
const assets = [...html.matchAll(/(?:src|href)="([^\"]*\/_next\/static\/[^\"]+)"/g)].map(match => match[1]);
assert.ok(assets.length > 0);
for (const asset of assets) assert.equal((await fetch(new URL(asset.replaceAll('&amp;', '&'), base))).status, 200);
console.log(`Smoke passed: ${base}, ${items.length} items, ${assets.length} static assets`);
