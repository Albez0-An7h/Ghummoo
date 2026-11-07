// Shared helpers for Ghumo end-to-end tests.
const DEMO_PASSWORD = 'GhumoDemo#2026'; // seeded demo password (server/src/seedData.js)

const accounts = {
  traveller: 'traveller@ghumo.demo',
  operator: 'operator@ghumo.demo', // Wandering Pahadi Co.
  admin: 'admin@ghumo.demo',
};

// Signs in through the API; cookies are shared with the page's browser context.
async function apiLogin(request, email, password = DEMO_PASSWORD) {
  const res = await request.post('/api/auth/login', { data: { email, password } });
  if (!res.ok()) throw new Error(`login failed for ${email}: ${res.status()}`);
  return (await res.json()).data;
}

async function uiLogin(page, email, password = DEMO_PASSWORD) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.locator('main form button[type=submit]').click();
}

// Page has no horizontal overflow (allows 1px rounding).
async function horizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

module.exports = { DEMO_PASSWORD, accounts, apiLogin, uiLogin, horizontalOverflow };
