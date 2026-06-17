import { Page, Locator } from '@playwright/test';
import BasePage from './BasePage';

/**
 * RegistrationPage - Page Object for user registration
 *
 * Responsibility:
 * - Encapsulate registration form interaction
 * - Handle email, password, and confirm password fields
 * - Submit registration form
 * - Detect and report registration-specific errors
 *
 * Route: /register
 * Form structure: email input + password input + confirm password input + "Register"/"Sign Up" button
 *
 * Locator notes:
 * - Form: `form` selector (safe at /register route; only one form on page)
 * - Email input: `input[type="email"]` or `input[name*="email"]` (stable attributes)
 * - Password input: `input[type="password"]` or `input[name*="password"]` (stable attributes)
 * - Confirm password input: second password field or name containing "confirm" (MEDIUM BRITTLE)
 * - Submit button: button with role=button and name matching "Register"/"Sign up" (case-insensitive)
 *
 * Brittle choices:
 * - Form selector is generic `form` (acceptable at /register; no other forms should exist)
 * - Confirm password uses positional selector .nth(1) (BRITTLE: breaks if fields reordered)
 * - Button text matching via regex (depends on exact label, case-insensitive fallback)
 * - Error message detection uses common CSS patterns (role="alert", .error, .error-message)
 *
 * Recommendations:
 * - App should add data-testid="register-form" to form element
 * - App should add data-testid="confirm-password-input" to confirm password field
 * - App should add data-testid="register-submit" to submit button
 * - App should add aria-label to submit button ("Register" is stable)
 */
export class RegistrationPage extends BasePage {
  readonly confirmPasswordInput: Locator;
  readonly securityQuestionSelect: Locator;
  readonly answerInput: Locator;

  constructor(page: Page) {
    super(page);

    // Component scoping: Juice Shop registration is rendered inside an app-register wrapper,
    // not a native <form> element. Use the page component root for stable scoping.
    this.form = page.locator('app-register');

    // Email input: use the accessible label or known control id
    this.emailInput = this.form
      .locator('input[aria-label="Email address field"]')
      .or(this.form.locator('#emailControl'))
      .or(this.form.locator('input[placeholder*="Email"]'));

    // Password input: use the known accessible label or id
    this.passwordInput = this.form
      .locator('input[aria-label="Field for the password"]')
      .or(this.form.locator('#passwordControl'))
      .or(this.form.locator('input[type="password"]'))
      .first();

    // Confirm password input: use the known accessible label or id
    this.confirmPasswordInput = this.form
      .locator('input[aria-label="Field to confirm the password"]')
      .or(this.form.locator('#repeatPasswordControl'))
      .or(this.form.locator('input[type="password"]'))
      .nth(1);

    // Security question select: accessible role or component fallback
    this.securityQuestionSelect = this.form
      .getByRole('combobox', {
        name: /Selection list for the security question/i,
      })
      .or(this.form.locator('mat-select')
      .or(this.page.getByPlaceholder('securityQuestion')));

    // Security answer input: use accessible label, id, or placeholder
    this.answerInput = this.form
      .locator('input[aria-label="Field for the answer to your security question"]')
      .or(this.form.locator('#securityAnswerControl'))
      .or(this.form.locator('input[placeholder="Answer to your security question"]'));

    // Submit button: registration-specific label + fallback selector
    this.submitButton = this.form
      .getByRole('button', { name: /^(?:Register|Sign up|Sign Up)$/i })
      .or(this.form.locator('button:has-text("Register")'))
      .or(this.form.locator('button[type="submit"]'));
  }

  /**
   * Check if the registration page is visible.
   */
  async isRegistrationFormVisible(): Promise<boolean> {
    return await this.isFormVisible();
  }

  /**
   * Fill the confirm password field.
   */
  protected async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Select the security question from the registration dropdown.
   */
  async selectSecurityQuestion(question: string): Promise<void> {
    await this.securityQuestionSelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.securityQuestionSelect.focus();
    await this.page.keyboard.press('Enter');
    await this.page.waitForSelector('mat-option, [role="option"]', { timeout: 5000 });

    const option = this.page.getByRole('option', { name: question });
    if ((await option.count()) > 0) {
      await option.click();
      return;
    }

    await this.page.locator('mat-option', { hasText: question }).first().click();
  }

  /**
   * Fill the answer to the security question.
   */
  async fillSecurityAnswer(answer: string): Promise<void> {
    await this.answerInput.fill(answer);
  }

  /**
   * Perform a registration by filling all required fields and submitting.
   */
  async register(
    email: string,
    password: string,
    confirmPassword: string,
    securityQuestion: string,
    securityAnswer: string
  ): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);
    await this.selectSecurityQuestion(securityQuestion);
    await this.fillSecurityAnswer(securityAnswer);
    await this.submit();
  }

  /**
   * Get any registration error message displayed on the page.
   */
  async getRegistrationError(): Promise<string | null> {
    return await this.getErrorMessage();
  }

  /**
   * Whether the registration button is currently enabled.
   */
  async isRegisterButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Wait for the registration button to become enabled.
   */
  async waitForRegisterButtonEnabled(): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible', timeout: 10000 });

    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (await this.submitButton.isEnabled()) {
        return;
      }
      await this.page.waitForTimeout(100);
    }

    throw new Error('Register button did not become enabled within timeout');
  }

  /**
   * Perform registration and wait for the login route to appear.
   */
  async registerAndWaitForLogin(
    email: string,
    password: string,
    confirmPassword: string,
    securityQuestion: string,
    securityAnswer: string
  ): Promise<void> {
    await this.register(email, password, confirmPassword, securityQuestion, securityAnswer);
    await this.waitForRegistrationSuccess();
  }

  /**
   * Wait for registration success by checking navigation to the login route.
   */
  async waitForRegistrationSuccess(): Promise<void> {
    await this.page.waitForURL(/#\/login/, { timeout: 10000 });
  }
}

export default RegistrationPage;
