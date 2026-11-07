// C. Security and permissions against the running production build, plus a scan of the built
// client bundle for secrets. (Detailed API permission tests live in server/test/*.test.js.)
const fs = require('fs');
const path = require('path');
const { test, expect, request: pwRequest } = require('@playwright/test');
const { accounts, apiLogin } = require('./helpers');

const DIST = path.join(__dirname, '..', 'client', 'dist');

test('No credentials or secrets in the frontend bundle', () => {
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name))));
  walk(DIST);
  const text = files.filter((f) => /\.(js|html|css|json|map)$/.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const patterns = [
    [/sk-[A-Za-z0-9_-]{20,}/, 'OpenAI-style key'], [/sk-ant-[A-Za-z0-9_-]{10,}/, 'Anthropic key'], [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
    [/\bAQ\.[A-Za-z0-9_-]{20,}/, 'Gemini key'], [/ghp_[A-Za-z0-9]{20,}/, 'GitHub token'], [/mongodb(\+srv)?:\/\/[^"'\s]+@/, 'MongoDB credentials'],
    [/JWT_SECRET\s*[=:]\s*['"]?[A-Za-z0-9]/, 'JWT secret value'], [/GhumoDemo#2026/, 'demo password'],
  ];
  for (const [rx, label] of patterns) expect(text.match(rx), label).toBeNull();
  expect(files.some((f) => f.endsWith('.map')), 'no source maps shipped').toBe(false);
});

test('Security headers and no framework fingerprint', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['x-powered-by']).toBeUndefined();
  expect(h['content-security-policy']).toContain("default-src 'self'");
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['strict-transport-security']).toBeTruthy();
});

test('Role and ownership rules hold on the running server', async ({ baseURL }) => {
  const anon = await pwRequest.newContext({ baseURL });
  expect((await anon.get('/api/bookings/mine')).status()).toBe(401);
  expect((await anon.get('/api/operator/stats')).status()).toBe(401);
  expect((await anon.get('/api/groups/mine')).status()).toBe(401);

  const traveller = await pwRequest.newContext({ baseURL });
  await apiLogin(traveller, accounts.traveller);
  for (const u of ['/api/operator/stats', '/api/operator/bookings', '/api/admin/stats', '/api/ai/status', '/api/operator/insights']) {
    expect((await traveller.get(u)).status(), u).toBe(403);
  }

  // Another organiser's package cannot be edited.
  const altitude = await pwRequest.newContext({ baseURL });
  await apiLogin(altitude, 'altitude@ghumo.demo');
  const pahadi = await pwRequest.newContext({ baseURL });
  await apiLogin(pahadi, accounts.operator);
  const theirs = (await (await pahadi.get('/api/operator/packages')).json()).data[0];
  expect((await altitude.put(`/api/operator/packages/${theirs._id}`, { data: { title: 'Hijacked title' } })).status()).toBe(404);

  // Inventory and price are decided on the server: a forged status/price is ignored, and asking
  // for more seats than remain is refused.
  const other = await pwRequest.newContext({ baseURL });
  await other.post('/api/auth/register', { data: { name: 'Curious Kiran', email: `kiran-${Date.now()}@ghumo.test`, password: 'kiran-pass-2026' } });
  const trip = await (await anon.get('/api/trips/meghalaya-explorer')).json();
  const dep = trip.data.departures.find((d) => d.availability === 'available');
  const forged = await other.post('/api/bookings', { data: { departureId: dep._id, seats: 1, pricePerSeat: 1, totalAmount: 1, status: 'confirmed', contact: { name: 'Kiran', email: 'k@example.com', phone: '+91 90000 33333' }, travelers: [{ fullName: 'Kiran K', age: 30 }] } });
  expect(forged.status()).toBe(201);
  const booking = (await forged.json()).data;
  expect(booking.status).toBe('requested');
  expect(booking.pricePerSeat).toBe(dep.price);
  const tooMany = await other.post('/api/bookings', { data: { departureId: dep._id, seats: dep.seatsAvailable + 1, contact: { name: 'K', email: 'k@example.com', phone: '+91 90000 33333' }, travelers: Array.from({ length: dep.seatsAvailable + 1 }, (_, i) => ({ fullName: `Kiran ${i}`, age: 30 })) } });
  expect([400, 409]).toContain(tooMany.status());

  // That booking is visible to its traveller only, not to another traveller or another organiser.
  expect((await other.get(`/api/bookings/${booking._id}`)).status()).toBe(200);
  expect((await traveller.get(`/api/bookings/${booking._id}`)).status()).toBe(404);
  expect((await altitude.get(`/api/bookings/${booking._id}`)).status()).toBe(404);
  const owner = await pwRequest.newContext({ baseURL });
  await apiLogin(owner, 'northeast@ghumo.demo');
  expect((await owner.get(`/api/bookings/${booking._id}`)).status()).toBe(200);
  await owner.dispose();
  // A trip group stays closed to a traveller whose booking isn't confirmed, and to outsiders.
  expect((await other.get(`/api/groups/${dep._id}`)).status()).toBe(403);
  expect((await traveller.get(`/api/groups/${dep._id}`)).status()).toBe(403);
  for (const c of [anon, traveller, altitude, pahadi, other]) await c.dispose();
});

test('AI endpoints validate input and rate-limit (runs last: uses up the AI quota)', async ({ baseURL }) => {
  const c = await pwRequest.newContext({ baseURL });
  expect((await c.post('/api/discover/interpret', { data: { text: 'x' } })).status()).toBe(400);
  expect((await c.post('/api/discover/interpret', { data: { text: 'y'.repeat(501) } })).status()).toBe(400);
  expect((await c.post('/api/discover/trips/rishikesh-adventure-weekend/ask', { data: { question: 'z'.repeat(301) } })).status()).toBe(400);
  let limited = null;
  for (let i = 0; i < 25 && !limited; i += 1) {
    const r = await c.post('/api/discover/trips/rishikesh-adventure-weekend/ask', { data: { question: 'What is the cancellation policy?' } });
    if (r.status() === 429) limited = r;
  }
  expect(limited, 'AI endpoints are rate limited').not.toBeNull();
  expect(Number(limited.headers()['retry-after'])).toBeGreaterThan(0);
  await c.dispose();
});
