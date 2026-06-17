import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../src/pages/RegistrationPage';
import {  Header } from '../src/pages/Header';

test('happy-path registration completes and navigates to login', { tag: ['@auth'] }, async ({ page }) => {

  await page.goto("/");

  await page.waitForLoadState('networkidle');

  // Dismiss any entry banners that may block registration interactions.
  const header = new Header(page);
  await header.dismissCookieConsent();
  await header.dismissWelcomeBanner();

  // Arrange
  await page.goto('/#/register');
  const registrationPage = new RegistrationPage(page);

  await expect(await registrationPage.isRegistrationFormVisible()).toBe(true);
  //await registrationPage.waitForRegisterButtonEnabled();

  const email = `test.user${Date.now()}@example.com`;
  const password = 'ValidPass123!';
  const securityQuestion = 'Your eldest siblings middle name?';
  const securityAnswer = 'Blue';

  // Act
  await registrationPage.registerAndWaitForLogin(email, password, password, securityQuestion, securityAnswer);

  // Assert
  await expect(page).toHaveURL(/#\/login/);
});
