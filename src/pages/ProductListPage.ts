import { Page, Locator } from '@playwright/test';

/**
 * ProductListPage Object
 *
 * Responsibility:
 * - Product listing and discovery
 * - Adding products to basket
 * - Navigating product view
 *
 * Locator notes:
 * - Products: `app-product` (Angular component tag, stable)
 * - Product name: `.name` class (Angular CSS, stable)
 * - Add button: aria-label="Add to Basket" (explicit, stable)
 *
 * Brittle choices:
 * - Product `.name` relies on exact class name (minor risk)
 * - Add button fallback to `.btn-basket` class (class-based, fragile to CSS refactors)
 * - Page navigation assumes home URL; may not work on paginated/filtered views
 */
export class ProductListPage {
  readonly page: Page;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // Angular component for each product card
    this.productCards = page.locator('app-product');
  }

  /**
   * Navigate to home / product listing page.
   */
  async goto(base = '/'): Promise<void> {
    await this.page.goto(base);
  }

  /**
   * Get array of visible product names.
   * BRITTLE: relies on exact `.name` class selector; assumes single .name per card.
   */
  async getVisibleProductNames(): Promise<string[]> {
    const names: string[] = [];
    const cards = await this.productCards.all();
    for (const card of cards) {
      if (!(await card.isVisible().catch(() => false))) continue;
      const nameEl = card.locator('.name');
      const name = await nameEl.innerText().catch(() => null);
      if (name) names.push(name.trim());
    }
    return names;
  }

  /**
   * Get the first visible product card element.
   * Returns null if no visible products found.
   */
  async getFirstVisibleProduct(): Promise<Locator | null> {
    const cards = await this.productCards.all();
    for (const card of cards) {
      if (await card.isVisible().catch(() => false)) {
        return card;
      }
    }
    return null;
  }

  /**
   * Add a product to basket by exact product name match.
   * BRITTLE: depends on exact product name text; fragile to product renames.
   */
  async addProductToBasketByName(productName: string): Promise<void> {
    const cards = await this.productCards.all();
    for (const card of cards) {
      if (!(await card.isVisible().catch(() => false))) continue;
      const nameEl = card.locator('.name');
      const name = await nameEl.innerText().catch(() => null);
      if (name && name.trim() === productName) {
        // Found the product; click its add button
        const addBtn = card
          .locator('button[aria-label="Add to Basket"]')
          .or(card.locator('button.btn-basket'));
        await addBtn.click();
        // Wait for cart update (typically brief)
        await this.page.waitForTimeout(500);
        return;
      }
    }
    throw new Error(`Product not found: ${productName}`);
  }

  /**
   * Add the first visible product to basket.
   */
  async addFirstVisibleProductToBasket(): Promise<string | null> {
    const firstProduct = await this.getFirstVisibleProduct();
    if (!firstProduct) {
      throw new Error('No visible products found');
    }

    // Get product name for return
    const nameEl = firstProduct.locator('.name');
    const productName = await nameEl.innerText().catch(() => null);

    // Click add button
    const addBtn = firstProduct
      .locator('button[aria-label="Add to Basket"]')
      .or(firstProduct.locator('button.btn-basket'));
    await addBtn.click();
    await this.page.waitForTimeout(500);

    return productName ? productName.trim() : null;
  }

  /**
   * Check if a specific product is visible by name.
   */
  async isProductVisible(productName: string): Promise<boolean> {
    const visibleNames = await this.getVisibleProductNames();
    return visibleNames.includes(productName);
  }

  /**
   * Wait for products to load (check for at least one visible product card).
   */
  async waitForProductsToLoad(): Promise<void> {
    await this.productCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }
}

export default ProductListPage;
