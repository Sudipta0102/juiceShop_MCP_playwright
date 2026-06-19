import { test, expect } from '@playwright/test';
import { RegistrationPage } from '@pages/RegistrationPage';
import {  Header } from '@pages/Header';
import { randomUUID } from 'crypto';

test('happy-path registration completes and navigates to login', { tag: ['@auth'] }, async ({ page }) => {

  await page.goto("/");

  await page.waitForLoadState('networkidle');

  // Dismiss any entry banners that may block registration interactions.
  const header = new Header(page);
  await header.dismissWelcomeBanner();
  await header.dismissCookieConsent();
  
  // Arrange
  await page.goto('/#/register');
  const registrationPage = new RegistrationPage(page);

  //expect(await registrationPage.isRegistrationFormVisible()).toBe(true);
  //await registrationPage.waitForRegisterButtonEnabled();

  const email = `test.user.${randomUUID()}@example.com`;
  const password = 'ValidPass123!';
  //const securityQuestion = 'Your eldest siblings middle name?';
  const securityAnswer = 'Blue';

  // Act
  await registrationPage.registerAndWaitForLogin(email, password, password, securityAnswer);

  // Assert
  await expect(page).toHaveURL(/#\/login/);
});
