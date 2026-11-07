// B. End-to-end organiser journey: sign-up → onboarding with verification → manual package and
// AI Studio package → preview → (admin approval) → publish → departure → booking request →
// confirm → traveller details → offline payment → announcement → trip group.
const { test, expect } = require('@playwright/test');
const { accounts, apiLogin } = require('./helpers');

test.describe.configure({ mode: 'serial' });

const ORG = { name: 'Meera Joshi', email: `e2e-organiser-${Date.now()}@ghumo.test`, password: 'E2E-trails-2026' };
let manualId;
let studioId;
let studioSlug;
let departureId;
let bookingRef;

async function signIn(page) {
  await apiLogin(page.request, ORG.email, ORG.password);
}

test('B1–B4: account, business profile, verification and its status', async ({ page }) => {
  await page.goto('/partners');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your trips deserve more than a DM.');
  await page.getByRole('link', { name: 'List your trips' }).first().click();
  await expect(page).toHaveURL(/\/register\?role=operator/);
  await page.getByLabel('Your name').fill(ORG.name);
  await page.getByLabel('Email').fill(ORG.email);
  await page.getByLabel('Phone').fill('+91 98111 22334');
  await page.getByLabel('Password').fill(ORG.password);
  await page.locator('main form button[type=submit]').click();

  await expect(page.getByText('Step 2 of 7: Business')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click(); // validation
  await expect(page.getByText('Enter the name travellers know you by')).toBeVisible();
  await page.getByLabel(/Business or brand name/).fill('Himalayan Hikers Club');
  await page.getByText('Community or club', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Step 3 of 7: Contact')).toBeVisible();
  await expect(page.getByLabel('Contact email')).toHaveValue(ORG.email); // prefilled from the account
  await page.getByLabel('Where do you operate from?').fill('Dehradun, Uttarakhand');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('About your trips').fill('A volunteer-run hiking club organising small-group Garhwal treks since 2019, led by certified trek leaders.');
  await page.getByLabel('Instagram').fill('@himalayanhikers');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Step 5 of 7: Verification')).toBeVisible();
  await page.getByLabel('Registration type').selectOption('msme');
  await page.getByLabel('Registration number').fill('UDYAM-UK-05-0012345');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('MSME / Udyam: UDYAM-UK-05-0012345')).toBeVisible();
  await page.getByRole('button', { name: 'Submit profile' }).click();

  await expect(page.getByText('Profile submitted')).toBeVisible();
  await expect(page.getByText(/details submitted, waiting for review/)).toBeVisible();
  await page.getByRole('button', { name: /I'll do this later/ }).click();

  await page.goto('/operator/profile');
  await expect(page.getByText('Pending review').first()).toBeVisible();
  await expect(page.getByText('Verified organiser', { exact: true })).toHaveCount(0); // no badge before approval
});

test('B5: create a package manually', async ({ page }) => {
  await signIn(page);
  await page.goto('/operator/packages/new');
  await page.getByLabel('Package title').fill('Kedarkantha Winter Trek');
  await page.getByLabel('Destination').fill('Kedarkantha');
  await page.getByLabel('Starting city').fill('Dehradun');
  await page.getByLabel('Days').fill('6');
  await page.getByLabel('Nights').fill('5');
  await page.getByLabel('Price per person (₹)').fill('11999');
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page).toHaveURL(/\/operator\/packages\/[a-f0-9]{24}$/);
  manualId = page.url().split('/').pop();
  await expect(page.getByText('Add these before publishing')).toBeVisible();
});

test('B6–B7: AI Package Studio drafts a package and lists missing details', async ({ page }) => {
  await signIn(page);
  await page.goto('/operator/studio');
  await page.locator('#studio-text').fill('Chopta Tungnath weekend trek 🏔️ 3D/2N from Delhi, 6499 per person. Tempo traveller, camps in Chopta, breakfast + dinner, trek leader. Tungnath temple and Chandrashila summit!');
  await page.getByRole('button', { name: 'Generate package' }).click();
  await expect(page.getByText(/Missing information/)).toBeVisible();
  for (const m of ['Seat capacity', 'Cancellation policy', 'Day-wise itinerary']) await expect(page.getByText(m, { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Save as draft' }).click();
  await expect(page).toHaveURL(/\/operator\/packages\/[a-f0-9]{24}$/);
  studioId = page.url().split('/').pop();
  await expect(page.getByText('From AI Studio')).toBeVisible();
  await expect(page.getByText('Add these before publishing')).toBeVisible();
});

test('B8–B9: fill the gaps, preview, get approved, publish and add a departure', async ({ page, browser }) => {
  await signIn(page);
  await page.goto(`/operator/packages/${studioId}`);

  await page.getByRole('tab', { name: /Itinerary/ }).click();
  await page.getByRole('button', { name: /Add day 1/ }).click();
  await page.getByLabel('Title').first().fill('Delhi to Chopta');
  await page.getByRole('tab', { name: /Details/ }).click();
  await page.getByLabel('Cancellation & refund policy').fill('Full refund up to 10 days before departure, 50% up to 3 days, none after.');
  await page.getByRole('tab', { name: /Photos/ }).click();
  await page.getByLabel('Or add by URL').fill('https://images.unsplash.com/photo-1626621341517-bbf3d9990a23');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).last().click();
  await expect(page.getByText('Changes saved')).toBeVisible();

  await page.getByRole('tab', { name: /Departures/ }).click();
  await page.getByRole('button', { name: /Add (first )?departure/ }).first().click();
  const start = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Departure date').fill(start);
  await dialog.getByLabel('Total seats').fill('14');
  await dialog.getByRole('button', { name: 'Add departure' }).click();
  await expect(dialog).toHaveCount(0);

  // Preview works before publishing.
  const detail = await (await page.request.get(`/api/operator/packages/${studioId}`)).json();
  studioSlug = detail.data.package.slug;
  departureId = detail.data.departures[0]._id;
  expect(detail.data.publishBlockers).toEqual([]);
  await page.goto(`/trips/${studioSlug}`);
  await expect(page.getByText(/Preview: this trip is draft/)).toBeVisible();

  // Publishing waits for approval.
  await page.goto(`/operator/packages/${studioId}`);
  await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();

  const adminCtx = await browser.newContext();
  const admin = adminCtx.request;
  await apiLogin(admin, accounts.admin);
  const ops = await (await admin.get('/api/admin/operators?status=pending')).json();
  const mine = ops.data.find((o) => o.businessName === 'Himalayan Hikers Club');
  expect((await admin.post(`/api/admin/operators/${mine._id}/approve`, { data: {} })).ok()).toBeTruthy();
  await adminCtx.close();

  await page.reload();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible();
  const pub = await page.request.get(`/api/trips/${studioSlug}`, { headers: { cookie: '' } });
  expect(pub.ok()).toBeTruthy();
});

test('B10–B13: booking request, confirm, traveller details and offline payment', async ({ page, browser }) => {
  const tCtx = await browser.newContext();
  await apiLogin(tCtx.request, accounts.traveller);
  const res = await tCtx.request.post('/api/bookings', { data: { departureId, seats: 2, contact: { name: 'Priya Sharma', email: 'traveller@ghumo.demo', phone: '+91 90000 00000' }, travelers: [{ fullName: 'Priya Sharma', age: 28 }, { fullName: 'Arjun Mehta', age: 31 }] } });
  expect(res.status()).toBe(201);
  bookingRef = (await res.json()).data.reference;
  await tCtx.close();

  await signIn(page);
  await page.goto('/operator');
  await expect(page.getByText(`New booking request ${bookingRef} for 2 seats`)).toBeVisible();

  await page.goto('/operator/bookings');
  await page.getByText(bookingRef).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Confirm booking' }).click();
  await dialog.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(dialog).toContainText('Confirmed');
  await expect(dialog).toContainText('Arjun Mehta');
  await dialog.getByLabel('Amount received').fill('5000');
  await dialog.getByLabel('Transaction reference').fill('UPI-E2E-001');
  await dialog.getByRole('button', { name: 'Save payment record' }).click();
  await expect(dialog).toContainText('UPI-E2E-001');

  await page.goto(`/operator/departures/${departureId}`);
  await expect(page.getByText('Arjun Mehta').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Export CSV/ }).first()).toHaveAttribute('href', /export\.csv/);
});

test('B14–B15: trip announcement and trip group conversation', async ({ page, browser }) => {
  await signIn(page);
  await page.goto(`/operator/departures/${departureId}`);
  await page.getByLabel('Title').fill('Pickup confirmed');
  await page.getByLabel(/Message|Details|Body/).last().fill('Kashmere Gate ISBT, platform 3, 9 PM on day 1.');
  await page.getByRole('button', { name: /Post/ }).click();
  await expect(page.getByText('Pickup confirmed').first()).toBeVisible();

  await page.getByRole('link', { name: 'Trip group' }).click();
  await expect(page).toHaveURL(new RegExp(`/operator/groups/${departureId}$`));
  await page.getByText('Post as announcement').click();
  await page.locator('#group-msg').fill('Welcome everyone! Please carry warm layers.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('log')).toContainText('Welcome everyone! Please carry warm layers.');

  // The confirmed traveller sees the announcement; the organiser sees the reply.
  const tCtx = await browser.newContext();
  const t = await tCtx.newPage();
  await apiLogin(t.request, accounts.traveller);
  await t.goto(`/groups/${departureId}`);
  await expect(t.getByRole('log')).toContainText('Welcome everyone! Please carry warm layers.');
  await t.locator('#group-msg').fill('Thanks Meera, see you there!');
  await t.getByRole('button', { name: 'Send' }).click();
  await expect(t.getByRole('log')).toContainText('Thanks Meera');
  await tCtx.close();
  await expect(page.getByRole('log')).toContainText('Thanks Meera', { timeout: 15000 }); // arrives by polling
});
