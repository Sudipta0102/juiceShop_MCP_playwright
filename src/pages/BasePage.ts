import { Page, Locator } from '@playwright/test';

/**
 * BasePage - Abstract base class for form-based Page Objects
 *
 * Provides shared form interaction utilities for pages with email/password forms
 * (login, registration, password reset, etc.).
 *
 * Responsibility:
 * - Encapsulate common form locators (email, password, submit button)
 * - Provide protected methods for form interaction (fill, submit, error detection)
 * - Define shared visibility and error handling logic
 *
 * Subclasses must:
 * - Define the form locator in constructor (scoped to their specific page)
 * - Initialize email/password inputs based on form location
 * - Implement flow-specific public methods (e.g., login(), register())
 * - Optionally override error detection for flow-specific error messages
 *
 * Design notes:
 * - Methods are protected to prevent test code from calling low-level actions
 * - Public methods in subclasses wrap protected methods with flow-specific intent
 * - Form locator is not initialized here (subclasses define their own scoping)
 */
export abstract class BasePage {
  protected page: Page;
  protected form: Locator;
  protected emailInput: Locator;
  protected passwordInput: Locator;
  protected submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize with default locators; subclasses override these in their constructors
    // with more specific scoping (e.g., form-specific selectors)
    this.form = page.locator('form');
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  /**
   * Check if the form is visible on the page.
   * Used for wait conditions and visibility assertions.
   */
  protected async isFormVisible(): Promise<boolean> {
    return await this.form.isVisible().catch(() => false);
  }

  /**
   * Fill the email field.
   * Protected: called internally by public login/register methods.
   */
  protected async fillEmail(email: string): Promise<void> {
    const emailInput = this.emailInput.first();
    await emailInput.fill(email);
  }

  /**
   * Fill the password field.
   * Protected: called internally by public login/register methods.
   */
  protected async fillPassword(password: string): Promise<void> {
    const passwordInput = this.passwordInput.first();
    await passwordInput.fill(password);
  }

  /**
   * Submit the form by clicking the submit button.
   * Protected: called internally by public login/register methods.
   */
  protected async submit(): Promise<void> {
    const btn = this.submitButton.first();
    await btn.click();
    // Wait for submission to process
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get any error message displayed on the form.
   * Protected: subclasses expose flow-specific error methods.
   * Looks for common error indicators: [role="alert"], .error, .error-message.
   */
  protected async getErrorMessage(): Promise<string | null> {
    try {
      const errorEl = this.form
        .locator('[role="alert"], .error, .error-message')
        .first();
      if (await errorEl.isVisible().catch(() => false)) {
        return await errorEl.innerText();
      }
    } catch (e) {
      // No error found
    }
    return null;
  }

  /**
   * Wait for the form to disappear (e.g., after successful submission).
   * Protected: subclasses may expose as part of convenience methods.
   */
  protected async waitForFormToDisappear(): Promise<void> {
    await this.form.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

export default BasePage;
