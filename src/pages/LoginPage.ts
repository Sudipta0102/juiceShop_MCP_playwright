import { Page, Locator } from '@playwright/test';
import BasePage from './BasePage';

/**
 * LoginPage - Page Object for user login
 *
 * Responsibility:
 * - Encapsulate login form interaction
 * - Handle email and password field input
 * - Submit login form
 * - Detect and report login-specific errors
 *
 * Route: /login
 * Form structure: email input + password input + "Log In" button
 *
 * Locator notes:
 * - Form: `form` selector (safe at /login route; only one form on page)
 * - Email input: `input[type="email"]` or `input[name*="email"]` (stable attributes)
 * - Password input: `input[type="password"]` or `input[name*="password"]` (stable attributes)
 * - Submit button: button with role=button and name matching "Log in"/"Login" (case-insensitive)
 *
 * Brittle choices:
 * - Form selector is still generic `form` (acceptable at /login; no other forms should exist)
 * - Button text matching via regex (depends on exact label, case-insensitive fallback)
 * - Error message detection uses common CSS patterns (role="alert", .error, .error-message)
 *
 * Recommendations:
 * - App should add data-testid="login-form" to form element
 * - App should add data-testid="login-submit" to submit button
 * - App should add aria-label to submit button ("Log In" is stable)
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);

    // Form scoping: at /login, there should be only one form (the login form)
    // Still generic, but safer than AuthPage's .first() on multiple pages
    this.form = page.locator('form');

    // Email input: prefer type="email", fallback to name attribute
    this.emailInput = this.form
      .locator('input[type="email"]')
      .or(this.form.locator('input[name*="email"]'));

    // Password input: prefer type="password", fallback to name attribute
    this.passwordInput = this.form
      .locator('input[type="password"]')
      .or(this.form.locator('input[name*="password"]'));

    // Submit button: role-based match on login-specific label
    // BRITTLE: text matching depends on exact button label ("Log In" vs "Login")
    // Fallback to button[type="submit"]
    this.submitButton = this.form
      .getByRole('button', { name: /^(?:Log in|Login|Sign in)$/i })
      .or(this.form.locator('button[type="submit"]'));
  }

  /**
   * Check if the login form is visible.
   * Useful for wait conditions before interaction.
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.isFormVisible();
  }

  /**
   * Perform a login by filling email, password, and submitting the form.
   * This is the primary test interface for login operations.
   *
   * @param email - Email address to use for login
   * @param password - Password to use for login
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Get any error message displayed after a failed login attempt.
   * Returns null if no error is present.
   *
   * Common errors:
   * - "Invalid email or password"
   * - "Account not found"
   * - "Account locked"
   */
  async getLoginError(): Promise<string | null> {
    return await this.getErrorMessage();
  }

  /**
   * Convenience method: perform login and wait for form to disappear.
   * Useful for successful login scenarios where form should be hidden after redirect.
   */
  async loginAndWaitForFormDisappear(
    email: string,
    password: string
  ): Promise<void> {
    await this.login(email, password);
    await this.waitForFormToDisappear();
  }

  /**
   * Wait for the login form to disappear (e.g., after successful authentication).
   * Used by advanced test scenarios that need fine-grained control.
   */
  async waitForLoginSuccess(): Promise<void> {
    await this.waitForFormToDisappear();
  }
}

export default LoginPage;
