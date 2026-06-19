import { test, expect } from '@playwright/test';
import { RegistrationPage } from '@pages/RegistrationPage';
import {  Header } from '@pages/Header';
import { DatabaseManager } from '@util/databaseManager';
import { getUserByEmail } from '../../src/repositories/userRepository';
import { randomUUID } from 'crypto';

test('happy-path registration completes, navigates to login and Users table is updated in the database', 
  { tag: ['@auth', '@db'] }, 
  async ({ page }) => {

  const workerIdx = test.info().workerIndex;  
  const userData = {
    email : `test.user.${randomUUID()}@example.com`,
    password : 'ValidPass123!',
    //securityQuestion : 'Your eldest siblings middle name?',
    securityAnswer : 'Blue'
  }  

  let db = DatabaseManager.getFreshDatabase(workerIdx);
  try { 
    const existingUser = getUserByEmail( db, userData.email ); 
    expect(existingUser).toBeUndefined(); 
  } finally 
  { 
    db.close(); 
  }

  await page.goto("/");

  await page.waitForLoadState('networkidle');

  // Dismiss any entry banners that may block registration interactions.
  const header = new Header(page);
  await header.dismissWelcomeBanner();
  await header.dismissCookieConsent();
  
  // Arrange
  await page.goto('/#/register');
  const registrationPage = new RegistrationPage(page);

  expect(await registrationPage.isRegistrationFormVisible()).toBe(true);
  //await registrationPage.waitForRegisterButtonEnabled();

  // Act
  await registrationPage.registerAndWaitForLogin(
    userData.email, 
    userData.password, 
    userData.password, 
    userData.securityAnswer
  );

  await expect(page).toHaveURL(/#\/login/);

  db = DatabaseManager.getFreshDatabase(workerIdx);
  try { 
    const registeredUser = getUserByEmail( db, userData.email ); 
    expect(registeredUser).toBeDefined(); 
    expect( registeredUser?.email ).toBe(userData.email); 
  } finally { 
    db.close(); 
  }
    
});
