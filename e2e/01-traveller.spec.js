// A. End-to-end traveller journey: discovery → AI preferences → compare → details → ask →
// booking request → organiser confirms → traveller gets the right departure's trip group.
const { test, expect } = require('@playwright/test');
const { accounts, apiLogin, uiLogin } = require('./helpers');

test.describe.configure({ mode: 'serial' });

let tripSlug;
let bookingUrl;
let departureId;
let reference;

test('A1–A4: home → Explore India → city page → related packages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('India is better');
  await expect(page.locator('article').first()).toBeVisible(); // real trip cards from the API

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Explore India' }).click();
  await expect(page).toHaveURL(/\/india$/);
  await expect(page.getByRole('heading', { name: 'Himalayas' })).toBeVisible();
  await expect(page.locator('#city-delhi')).toBeVisible();

  await page.locator('#city-index a[href="/places/delhi"]').click();
  await expect(page).toHaveURL(/\/places\/delhi$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Delhi' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Landmarks' })).toBeVisible();
  const from = page.locator('section[aria-labelledby="from"] article');
  await expect(from.first()).toBeVisible();
  expect(await from.count()).toBeGreaterThan(0);
});

test('A5–A8: guided AI preferences return real matches and can be modified', async ({ page }) => {
  await page.goto('/decide');
  await page.getByRole('tab', { name: 'Choose step by step' }).click();
  await page.getByText('Mountains', { exact: true }).click();
  await page.getByRole('button', { name: /Next|Skip/ }).click();
  await page.getByText('₹5,000–₹10,000', { exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByText('Weekend', { exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Delhi', exact: true }).click();
  await page.getByRole('button', { name: 'Show trips' }).click();

  await expect(page.locator('#understood-h')).toBeVisible();
  await expect(page.getByText(/Looking for mountain trips for a weekend, from Delhi, under ₹10,000 per person/)).toBeVisible();
  const cards = page.locator('#results-h ~ div article');
  await expect(cards.first()).toBeVisible();
  const n = await cards.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i += 1) {
    const text = await cards.nth(i).innerText();
    expect(text).toMatch(/from Delhi/);
    const price = Number((text.match(/₹([\d,]+)\s*per person/) || [])[1]?.replace(/,/g, ''));
    expect(price).toBeLessThanOrEqual(10000);
    expect(text).toMatch(/Why it matches/);
    expect(text).not.toMatch(/\d+%/); // no fake match percentages
  }

  // A8: modify preferences by removing the Weekend filter.
  await page.getByLabel('Filters in use').getByRole('button', { name: /^Weekend/ }).click();
  await expect(page.getByText(/Looking for mountain trips from Delhi, under ₹10,000 per person/)).toBeVisible();
});

test('A5b: natural-language request is interpreted into editable filters', async ({ page }) => {
  await page.goto('/decide');
  await page.getByLabel('Describe the trip you want').fill('A beach weekend from Mumbai under 8k');
  await page.getByRole('button', { name: /^Find trips/ }).click();
  await expect(page.getByText(/Looking for .*from Mumbai, under ₹8,000 per person/)).toBeVisible();
  const chips = page.getByLabel('Filters in use');
  await expect(chips.getByRole('button', { name: /^From Mumbai/ })).toBeVisible();
  await expect(chips.getByRole('button', { name: /^Under ₹8,000/ })).toBeVisible();
  // Results come only from listed trips; any trip shown must fit the hard filters.
  const cards = page.locator('#results-h ~ div article');
  if (await cards.count()) await expect(cards.first()).toContainText('from Mumbai');
});

test('A9–A11: compare two packages, open details, ask a question', async ({ page }) => {
  await page.goto('/trips?from=delhi');
  const cards = page.locator('main article');
  await expect(cards.nth(1)).toBeVisible();
  await cards.nth(0).getByRole('button', { name: /Compare/ }).click();
  await cards.nth(1).getByRole('button', { name: /Compare/ }).click();
  await page.getByRole('region', { name: 'Trips selected for comparison' }).getByRole('link', { name: 'Compare 2' }).click();
  await expect(page).toHaveURL(/\/compare\?trips=/);
  const table = page.getByRole('table');
  await expect(table.getByRole('columnheader')).toHaveCount(2);
  for (const row of ['Price from', 'Upcoming dates', 'Duration', 'Included', 'Stay', 'Transport', 'Cancellation', 'Organiser']) {
    await expect(table.getByRole('rowheader', { name: row, exact: true })).toBeVisible();
  }
  await expect(table).not.toContainText(/score|rating|best/i);

  const first = table.getByRole('columnheader').first().getByRole('link');
  tripSlug = (await first.getAttribute('href')).split('/').pop();
  await first.click();
  await expect(page).toHaveURL(new RegExp(`/trips/${tripSlug}$`));
  await expect(page.getByRole('heading', { name: 'Day-wise itinerary' })).toBeVisible();

  await page.getByRole('button', { name: 'What is the cancellation policy?' }).click();
  const answer = page.locator('#ask .rounded-2xl.bg-white').first();
  await expect(answer).toContainText(/refund/i);
  await expect(answer.getByRole('link', { name: 'Cancellation policy' })).toBeVisible();
  await page.locator('#ask textarea').fill('Is it safe for solo travellers?');
  await page.locator('#ask').getByRole('button', { name: /^Ask/ }).click();
  await expect(page.locator('#ask .rounded-2xl.bg-white').first()).toContainText("This detail hasn't been confirmed by the organiser.");
});

test('A12–A13: booking request goes through login and shows its status', async ({ page }) => {
  await page.goto(`/trips/${tripSlug}`);
  await page.getByRole('button', { name: 'Request to book' }).first().click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await uiLogin(page, accounts.traveller);
  await expect(page).toHaveURL(new RegExp(`/trips/${tripSlug}/book`));

  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Full name').first().fill('Priya Sharma');
  await page.getByLabel('Age').first().fill('28');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('main input[type=checkbox]').check();
  await page.getByRole('button', { name: 'Submit booking request' }).click();

  await expect(page.getByRole('heading', { name: 'Booking request sent' })).toBeVisible();
  await expect(page.getByText('Waiting for the organiser to confirm. Your seats are held and nothing has been charged.')).toBeVisible();
  bookingUrl = new URL(page.url()).pathname;
  const booking = await (await page.request.get(`/api${bookingUrl}`)).json();
  departureId = booking.data.departure._id;
  reference = booking.data.reference;
  expect(booking.data.status).toBe('requested');

  // The group is not open yet.
  const early = await page.request.get(`/api/groups/${departureId}`);
  expect(early.status()).toBe(403);
});

test('A14–A16: organiser sees and confirms; traveller gets the right group only', async ({ page, browser }) => {
  await apiLogin(page.request, accounts.traveller);
  // Organiser, in a separate browser context.
  const orgCtx = await browser.newContext();
  const org = await orgCtx.newPage();
  await org.goto('/login');
  await uiLogin(org, accounts.operator);
  await org.goto('/operator/bookings');
  await org.getByRole('button', { name: new RegExp(reference) }).or(org.getByText(reference)).first().click();
  const dialog = org.getByRole('dialog');
  await expect(dialog).toContainText(reference);
  await dialog.getByRole('button', { name: 'Confirm booking' }).click();
  await dialog.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(dialog).toContainText('Confirmed');
  await orgCtx.close();

  // Traveller now sees the confirmation and the trip group for exactly this departure.
  await page.goto(bookingUrl);
  await expect(page.getByText('Confirmed. The organiser shares payment details directly')).toBeVisible();
  await page.getByRole('link', { name: /Open trip group|new message/ }).click();
  await expect(page).toHaveURL(new RegExp(`/groups/${departureId}$`));
  await expect(page.getByRole('log', { name: 'Messages' })).toBeVisible();
  await page.locator('#group-msg').fill('Hello group, see you soon!');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('log')).toContainText('Hello group, see you soon!');

  // Another departure of the same trip is not accessible.
  const trip = await (await page.request.get(`/api/trips/${tripSlug}`)).json();
  const other = trip.data.departures.find((d) => d._id !== departureId);
  if (other) expect((await page.request.get(`/api/groups/${other._id}/messages`)).status()).toBe(403);
});
