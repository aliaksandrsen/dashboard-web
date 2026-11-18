import { expect, test } from '@playwright/test';

test.describe('TestsTore Dashboard E2E', () => {
  test('navigates across all primary dashboard sections', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'All orders' })).toBeVisible();
    await expect(page.getByText('In the last 30 days,')).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Main navigation' });

    await nav.getByRole('link', { name: 'Actions' }).click();
    await expect(page).toHaveURL(/\/actions$/);
    await expect(page.getByRole('heading', { name: 'Changes you can make' })).toBeVisible();

    await nav.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'Products Catalog' })).toBeVisible();

    await nav.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('heading', { name: 'Users Directory' })).toBeVisible();

    await nav.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'Account & System Settings' })).toBeVisible();

    await nav.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'All orders' })).toBeVisible();
  });

  test('creates, inspects, updates, and deletes a product end-to-end', async ({ page }) => {
    const suffix = Date.now();
    const productName = `E2E Gadget ${suffix}`;

    await page.goto('/products');
    await expect(page.getByRole('heading', { name: 'Products Catalog' })).toBeVisible();

    await page.getByLabel('Product Name').fill(productName);
    await page.getByLabel('Price (USD)').fill('79.5');
    await page.getByLabel(/Stripe Product ID/).fill(`prod_e2e_${suffix}`);
    await page.getByRole('button', { name: 'Create Product' }).click();

    await expect(page.getByText(`Product "${productName}" created successfully.`)).toBeVisible();

    await page.getByRole('link', { name: productName }).click();
    await expect(page).toHaveURL(/\/products\/.+/);
    await expect(page.getByRole('heading', { name: productName })).toBeVisible();
    await expect(page.getByText('$79.50')).toBeVisible();

    await page.getByLabel('Price (USD)').fill('89.5');
    await page.getByRole('button', { name: 'Save Product Changes' }).click();
    await expect(page.getByText(`Product "${productName}" updated.`)).toBeVisible();
    await expect(page.getByText('$89.50')).toBeVisible();

    await page.getByRole('button', { name: 'Delete Product' }).click();
    await page.getByRole('button', { name: 'Confirm Delete' }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('link', { name: productName })).toHaveCount(0);
  });

  test('creates a user and order, updates order details, and cleans up end-to-end', async ({
    page,
  }) => {
    const suffix = Date.now();
    const userName = `E2E Buyer ${suffix}`;
    const userEmail = `e2e_buyer_${suffix}@example.com`;

    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Users Directory' })).toBeVisible();

    await page.getByLabel('Full Name').fill(userName);
    await page.getByLabel('Email Address').fill(userEmail);
    await page.getByLabel('Shipping Address').fill('742 Evergreen Terrace');
    await page.getByRole('button', { name: 'Create User' }).click();

    await expect(page.getByText(new RegExp(`User "${userName}" created`))).toBeVisible();

    await page.goto('/actions');
    await expect(page.getByRole('heading', { name: 'Changes you can make' })).toBeVisible();

    const customerSelect = page.getByLabel('Customer');
    await expect(customerSelect).toContainText(userName);
    const matchingOption = await customerSelect
      .locator('option', { hasText: userName })
      .getAttribute('value');
    expect(matchingOption).toBeTruthy();
    await customerSelect.selectOption(matchingOption!);

    await page.getByLabel(/Total Amount/).fill('125.5');
    await page.getByRole('button', { name: 'Create Order' }).click();

    await expect(page.getByText(/Order #\d+ created successfully\./)).toBeVisible();
    await page.getByRole('link', { name: 'View order details' }).click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.getByRole('heading', { name: /Order Details #\d+/ })).toBeVisible();
    await expect(page.getByText('$125.50')).toBeVisible();
    await expect(page.getByLabel('Total Amount (USD)')).toHaveValue('125.5');

    await page.getByLabel('Total Amount (USD)').fill('140');
    await page.getByRole('button', { name: 'Save Order Changes' }).click();
    await expect(page.getByText(/Order #\d+ updated successfully\./)).toBeVisible();
    await expect(page.getByText('$140.00')).toBeVisible();

    await page.getByRole('button', { name: 'Delete Order' }).click();
    await page.getByRole('button', { name: 'Confirm Delete' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto(`/users/${matchingOption}`);
    await expect(page.getByRole('heading', { name: userName })).toBeVisible();
    await page.getByRole('button', { name: 'Delete User' }).click();
    await page.getByRole('button', { name: 'Confirm Delete' }).click();
    await expect(page).toHaveURL(/\/users$/);
  });
});
