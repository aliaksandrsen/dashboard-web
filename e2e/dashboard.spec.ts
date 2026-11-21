import { expect, test } from '@playwright/test';

test.describe('TestsTore Dashboard E2E', () => {
  test('navigates across all primary dashboard sections and handles 404', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Main navigation' });

    await nav.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { name: 'Orders', level: 1 })).toBeVisible();

    await nav.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();

    await nav.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();

    await nav.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    await page.goto('/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page Not Found', level: 1 })).toBeVisible();
  });

  test('creates, searches, inspects, edits, and deletes a product across dedicated pages', async ({
    page,
  }) => {
    const suffix = Date.now();
    const productName = `E2E Gadget ${suffix}`;

    await page.goto('/products');
    await page.getByRole('link', { name: 'Create Product' }).click();
    await expect(page).toHaveURL(/\/products\/new$/);

    await page.getByLabel(/Product Name/).fill(productName);
    await page.getByLabel(/Price \(USD\)/).fill('79.5');
    await page.getByLabel(/Existing Stripe Product ID/).fill(`prod_e2e_${suffix}`);
    await page.getByLabel(/Existing Stripe Price ID/).fill(`price_e2e_${suffix}`);
    await page.getByRole('button', { name: 'Create Product' }).click();

    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByText(`Product "${productName}" created successfully.`)).toBeVisible();

    await page.getByLabel('Search products').fill(productName);
    await expect(page.getByRole('link', { name: productName, exact: true })).toBeVisible();

    await page.getByRole('link', { name: productName, exact: true }).click();
    await expect(page).toHaveURL(/\/products\/.+/);
    await expect(page.getByRole('heading', { name: productName, level: 1 })).toBeVisible();
    await expect(page.getByText('$79.50', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pay $79.50 with Stripe' })).toBeVisible();
    await expect(page.getByLabel(/Stripe Price ID/)).toHaveValue(`price_e2e_${suffix}`);

    await page.getByRole('link', { name: 'Edit Product' }).click();
    await expect(page).toHaveURL(/\/products\/.+\/edit$/);

    await page.getByLabel(/Price \(USD\)/).fill('89.5');
    await page.getByRole('button', { name: 'Save Product Changes' }).click();
    await expect(page).toHaveURL(/\/products\/[^/]+$/);
    await expect(page.getByText(`Product "${productName}" updated successfully.`)).toBeVisible();
    await expect(page.getByText('$89.50', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Delete Product' }).click();
    const dialogConfirm = page.locator('dialog').getByRole('button', { name: 'Delete Product' });
    await dialogConfirm.click();

    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('link', { name: productName, exact: true })).toHaveCount(0);
  });

  test('creates user, creates order, unassigns customer in edit page, and cleans up', async ({
    page,
  }) => {
    const suffix = Date.now();
    const userName = `E2E Buyer ${suffix}`;
    const userEmail = `e2e_buyer_${suffix}@example.com`;

    await page.goto('/users');
    await page.getByRole('link', { name: 'Create User' }).click();
    await expect(page).toHaveURL(/\/users\/new$/);

    await page.getByLabel(/Full Name/).fill(userName);
    await page.getByLabel(/Email Address/).fill(userEmail);
    await page.getByLabel(/Shipping Address/).fill('742 Evergreen Terrace');
    await page.getByRole('button', { name: 'Create User' }).click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByText(`User "${userName}" created successfully.`)).toBeVisible();

    await page.getByRole('link', { name: userName, exact: true }).click();
    await expect(page).toHaveURL(/\/users\/\d+$/);
    const userUrl = page.url();

    await page.getByRole('link', { name: 'Create Order' }).click();
    await expect(page).toHaveURL(/\/orders\/new\?userId=\d+$/);

    await page.getByLabel(/Total Amount/).fill('125.5');
    await page.getByRole('button', { name: 'Create Order' }).click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByText(/Order #\d+ created successfully\./)).toBeVisible();

    await page.getByLabel('Search orders').fill(userName);
    const viewOrderLink = page.getByRole('link', { name: /View order #\d+/ }).first();
    await viewOrderLink.click();
    await expect(page).toHaveURL(/\/orders\/\d+$/);
    await expect(page.getByText('$125.50')).toBeVisible();

    await page.getByRole('link', { name: 'Edit Order' }).click();
    await expect(page).toHaveURL(/\/orders\/\d+\/edit$/);

    await page.getByLabel('Customer').selectOption('');
    await page.getByLabel(/Total Amount/).fill('140');
    await page.getByRole('button', { name: 'Save Order Changes' }).click();

    await expect(page).toHaveURL(/\/orders\/\d+$/);
    await expect(page.getByText(/Order #\d+ updated successfully\./)).toBeVisible();
    await expect(page.getByText('$140.00')).toBeVisible();
    await expect(page.getByText('Unassigned')).toBeVisible();

    await page.getByRole('button', { name: 'Delete Order' }).click();
    await page.locator('dialog').getByRole('button', { name: 'Delete Order' }).click();
    await expect(page).toHaveURL(/\/orders$/);

    await page.goto(userUrl);
    await page.getByRole('button', { name: 'Delete User' }).click();
    await page.locator('dialog').getByRole('button', { name: 'Delete User' }).click();
    await expect(page).toHaveURL(/\/users$/);
  });
});
