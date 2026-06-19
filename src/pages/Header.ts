import { Page, Locator } from '@playwright/test';

/**
 * Header Page Object
 *
 * Responsibility:
 * - Global header navigation and dismissible banners
 * - Account menu access, authentication links
 * - Shopping cart visibility and count
 * - Cookie/welcome banner dismissal
 *
 * Locator notes:
 * - accountButton: uses aria-label="Show/hide account menu" (stable, explicit)
 * - cartButton: uses aria-label="Show the shopping cart" (stable, explicit)
 * - Cookie dismiss: uses aria-label="dismiss cookie message" (stable)
 * - Welcome banner: uses aria-label="Close Welcome Banner" (stable)
 *
 * Brittle choices:
 * - accountButton fallback to button:has-text("Account") — depends on visible text
 * - cartButton fallback to button:has-text("Your Basket") — text can change
 * - bannr close buttons rely on exact aria-label strings (minor risk if copy changes)
 */
export class Header {
  readonly page: Page;
  readonly accountButton: Locator;
  readonly cartButton: Locator;
  readonly cookieDismissButton: Locator;
  readonly welcomeBannerDismissButton: Locator;
  readonly welcomeDialog: Locator;
  readonly cookieDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // Primary: stable aria-label; fallback: role + class
    this.accountButton = page
      .locator('button[aria-label="Show/hide account menu"]')
      .or(page.locator('button.nav-account-button'));

    // Primary: stable aria-label; fallback: button with visible text
    this.cartButton = page
      .locator('button[aria-label="Show the shopping cart"]')
      .or(page.locator('button:has-text("Your Basket")'));

    this.welcomeDialog = page.locator('mat-dialog-container');
    this.welcomeBannerDismissButton = this.welcomeDialog.getByRole('button', { name: 'Close Welcome Banner' });

    this.cookieDialog = page.locator('[role="dialog"][aria-label="cookieconsent"]');
    this.cookieDismissButton = this.cookieDialog.getByRole('button', { name: 'dismiss cookie message' });
  }

  /**
   * Dismiss cookie consent banner if visible.
   * BRITTLE: depends on banner presence; may not exist on some page loads.
   */
  async dismissCookieConsent(): Promise<void> {
    // try {
    //   if (await this.cookieDismissButton.isVisible({ timeout: 1000 })) {
        await this.cookieDismissButton.click();
    //   }
    // } catch (e) {
    //   // Banner may not be present; silently continue
    // }
  }

  /**
   * Dismiss welcome/info banner if visible.
   * BRITTLE: depends on banner presence; may not exist on some page loads.
   */
  async dismissWelcomeBanner(): Promise<void> {
    // try {
    //   if (await this.welcomeBannerDismissButton.isVisible({ timeout: 1000 })) {
        await this.welcomeBannerDismissButton.click();
   //   }
    // } catch (e) {
    //   // Banner may not be present; silently continue
    // }
  }

  /**
   * Open the account menu dropdown.
   */
  async openAccountMenu(): Promise<void> {
    await this.accountButton.waitFor({ state: 'visible' });
    await this.accountButton.click();
    // Wait for menu panel to appear (short delay for Angular animations)
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if account menu is open.
   * BRITTLE: checks button's expanded state; may not be reliable if state attribute not set.
   */
  async isAccountMenuOpen(): Promise<boolean> {
    const expanded = await this.accountButton.getAttribute('aria-expanded');
    return expanded === 'true';
  }

  /**
   * Get the current cart count from the badge.
   * BRITTLE: assumes a specific badge element structure (generic with text).
   */
  async getCartCount(): Promise<number> {
    try {
      // Badge is a generic element inside the cart button showing the count
      const badge = this.cartButton.locator('generic, [class*="badge"], [class*="counter"]');
      const text = await badge.first().innerText().catch(() => '0');
      return parseInt(text, 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Open the shopping cart (basket page).
   */
  async openCart(): Promise<void> {
    await this.cartButton.waitFor({ state: 'visible' });
    await this.cartButton.click();
    // Wait for navigation to basket page
    await this.page.waitForURL('**/*basket*', { timeout: 5000 }).catch(() => {});
  }

  /**
   * Close account menu by clicking outside or pressing Escape.
   */
  async closeAccountMenu(): Promise<void> {
    try {
      // Try pressing Escape to close menu
      await this.page.keyboard.press('Escape');
    } catch (e) {
      // Fallback: click somewhere else on page
      await this.page.click('main');
    }
  }
}

export default Header;