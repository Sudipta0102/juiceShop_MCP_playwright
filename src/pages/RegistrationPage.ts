import { Page, Locator } from '@playwright/test';
import BasePage from './BasePage';
import { expect } from '@playwright/test';

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
  //readonly securityQuestionTrigger: Locator;
  readonly securityContainer: Locator;
  readonly firstOptionByIndex: Locator;

  constructor(page: Page) {
    super(page);

    this.form = page.locator('app-register');

    this.emailInput = this.form.locator('#emailControl');

    this.passwordInput = this.form
      .locator('input[aria-label="Field for the password"]')
      .or(this.form.locator('#passwordControl'))
      .first();

    this.confirmPasswordInput = this.form
      .locator('input[aria-label="Field to confirm the password"]')
      .or(this.form.locator('#repeatPasswordControl'));

    this.securityContainer = this.form.locator('.security-container');  
    
    // this.securityQuestionSelect = this.form.getByRole('combobox', {
    //   name: /Selection list for the security question/i,
    // });
    this.securityQuestionSelect = this.securityContainer.locator('mat-label:has-text("Security Question")');


    //this.securityQuestionTrigger = this.form.locator('.mat-mdc-select-trigger');
    this.firstOptionByIndex = this.securityContainer.getByRole('option').first();

    this.answerInput = this.securityContainer.locator('#securityAnswerControl');
    // this.answerInput = this.form
    //   .locator('#securityAnswerControl')
    //   .or(
    //     this.form.locator(
    //       'input[placeholder="Answer to your security question"]'
    //     )
    //   );

    // this.submitButton = this.form.getByRole('button', {
    //   name: /^(?:Register|Sign up|Sign Up)$/i,
    // });
    this.submitButton = this.form.getByRole('button', {name: /registration/i,})
      .or(this.form.getByRole('button', {name: /register/i,}));
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
  protected async fillConfirmPassword(
    password: string
  ): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Select a security question.
   */
  async selectSecurityQuestion(): Promise<void> {

    await this.securityQuestionSelect.click();

    await this.firstOptionByIndex.click();

  }


  /**
   * Fill the answer to the security question.
   */
  async fillSecurityAnswer(
    answer: string
  ): Promise<void> {
    await this.answerInput.fill(answer);
  }

  /**
   * Complete the registration form.
   */
  async register(
    email: string,
    password: string,
    confirmPassword: string,
    securityAnswer: string
  ): Promise<void> {

    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);

    await this.selectSecurityQuestion();

    await this.fillSecurityAnswer(
      securityAnswer
    );

    //await this.submit();
    await Promise.all([
     this.page.waitForURL(/#\/login/),
     this.submit(),
    ]);
  }

  /**
   * Get any registration error shown on the page.
   */
  async getRegistrationError(): Promise<string | null> {
    return await this.getErrorMessage();
  }

  /**
   * Whether the register button is enabled.
   */
  async isRegisterButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Wait for the register button to become enabled.
   */
  async waitForRegisterButtonEnabled(): Promise<void> {
    await this.submitButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    const deadline = Date.now() + 10000;

    while (Date.now() < deadline) {
      if (await this.submitButton.isEnabled()) {
        return;
      }

      await this.page.waitForTimeout(100);
    }

    throw new Error(
      'Register button did not become enabled within timeout'
    );
  }

  /**
   * Register and wait for navigation to login.
   */
  async registerAndWaitForLogin(
    email: string,
    password: string,
    confirmPassword: string,
    securityAnswer: string
  ): Promise<void> {

    await this.register(
      email,
      password,
      confirmPassword,
      securityAnswer
    );

    await this.waitForRegistrationSuccess();
  }

  /**
   * Wait until the login page is displayed.
   */
  async waitForRegistrationSuccess(): Promise<void> {
    await this.page.waitForURL(
      /#\/login/,
      {
        timeout: 10000,
      }
    );
  }
}

export default RegistrationPage;