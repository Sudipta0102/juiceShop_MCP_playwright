import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/OWASP Juice Shop/i);

  //await page.pause();
  const dismissButton = page.getByRole('button', {
    name: 'Close Welcome Banner'
  });

  await dismissButton.click();

//   if (await dismissButton.isVisible()) {
//     dismissButton.click();
//   }
  
  //await page.pause();

  const products = page.locator('app-product');
  const firstProductName = products.first().locator(".name"); // page.locator(".name").first() also works
  await expect(firstProductName).toContainText('Apple Juice'); 
});