import { Page, Locator } from '@playwright/test';

/**
 * BasketPage (Cart) Object
 *
 * Responsibility:
 * - View basket/cart contents
 * - Modify quantities and remove items
 * - Assertions on basket state (total, items)
 *
 * Locator notes:
 * - Page: navigates to `/#/basket`
 * - Basket items: table rows in `table.cart` or `app-basket-item` components (Angular)
 * - Item name: `.name` class or `td.name` in table row (CSS-based)
 * - Quantity: `input[type="number"]` or quantity display (assumes input control)
 * - Total: looks for text "Total Price:" (fragile text match)
 *
 * Brittle choices:
 * - Item selector `.name` within table rows (class name dependent)
 * - Total price parsing relies on exact text "Total Price:" (will break if copy changes)
 * - Assumes table layout for items (fragile if UI switches to cards or list)
 * - Remove button identified by icon class or aria-label (icon class is fragile)
 * - No unique data-testid on items (relies on DOM structure)
 */
export class BasketPage {
  readonly page: Page;
  readonly basketContainer: Locator;
  readonly itemRows: Locator;

  constructor(page: Page) {
    this.page = page;

    // Basket container: could be a mat-card or specific div with class basket
    this.basketContainer = page.locator('[role="main"]');

    // Item rows: table rows or app-basket-item components
    // BRITTLE: relies on specific selector; assumes table structure
    this.itemRows = page.locator('table.cart tbody tr, app-basket-item, .basket-item');
  }

  /**
   * Navigate to basket page.
   */
  async goto(): Promise<void> {
    await this.page.goto('/#/basket');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all items in the basket as {name, qty, price} objects.
   * BRITTLE: assumes specific table cell positions and DOM structure.
   */
  async getItems(): Promise<
    Array<{ name: string; qty: number | null; price: string | null }>
  > {
    const items: Array<{ name: string; qty: number | null; price: string | null }> =
      [];

    const rows = await this.itemRows.all();
    for (const row of rows) {
      if (!(await row.isVisible().catch(() => false))) continue;

      // Extract product name (BRITTLE: depends on .name class)
      const nameEl = row.locator('.name, .product-name, td:nth-child(2)');
      const name = await nameEl
        .first()
        .innerText()
        .catch(() => null);

      // Extract quantity (BRITTLE: assumes input[type="number"])
      let qty: number | null = null;
      const qtyInput = row.locator('input[type="number"]');
      if (await qtyInput.count().then((c) => c > 0)) {
        const qtyStr = await qtyInput.first().inputValue().catch(() => null);
        qty = qtyStr ? parseInt(qtyStr, 10) : null;
      }

      // Extract price (BRITTLE: assumes specific cell position or class)
      const priceEl = row.locator('.price, td:last-child');
      const price = await priceEl
        .first()
        .innerText()
        .catch(() => null);

      if (name) {
        items.push({ name: name.trim(), qty, price });
      }
    }

    return items;
  }

  /**
   * Get the total price from the page.
   * BRITTLE: depends on exact text "Total Price:" in the DOM.
   * Will break if text is "Cart Total", "Subtotal", etc.
   */
  async getTotalPrice(): Promise<string | null> {
    try {
      const totalText = await this.basketContainer
        .locator('text=/Total Price:/i')
        .first()
        .innerText()
        .catch(() => null);

      if (totalText) {
        // Extract price from text like "Total Price: 1.99¤"
        const match = totalText.match(/[\d.,]+[¤$€]/);
        return match ? match[0] : null;
      }
    } catch (e) {
      // No total found
    }
    return null;
  }

  /**
   * Change the quantity of a product by name.
   * Uses the +/- buttons or direct input modification.
   * BRITTLE: assumes +/- button structure and locators for quantity cells.
   */
  async changeQuantity(productName: string, newQty: number): Promise<void> {
    const rows = await this.itemRows.all();
    for (const row of rows) {
      if (!(await row.isVisible().catch(() => false))) continue;

      const nameEl = row.locator('.name, .product-name, td:nth-child(2)');
      const name = await nameEl
        .first()
        .innerText()
        .catch(() => null);

      if (name && name.trim() === productName) {
        // Found the item; change its quantity
        const qtyInput = row.locator('input[type="number"]').first();
        await qtyInput.fill(String(newQty));
        await this.page.waitForTimeout(300);
        return;
      }
    }

    throw new Error(`Product not found in basket: ${productName}`);
  }

  /**
   * Remove a product from basket by name.
   * Looks for trash/delete button in the product row.
   * BRITTLE: assumes trash icon button exists and is identifiable by aria-label or icon class.
   */
  async removeProduct(productName: string): Promise<void> {
    const rows = await this.itemRows.all();
    for (const row of rows) {
      if (!(await row.isVisible().catch(() => false))) continue;

      const nameEl = row.locator('.name, .product-name, td:nth-child(2)');
      const name = await nameEl
        .first()
        .innerText()
        .catch(() => null);

      if (name && name.trim() === productName) {
        // Found the item; click remove button
        const removeBtn = row
          .locator('button[aria-label*="Remove"], button[aria-label*="Delete"], [class*="trash"]')
          .or(row.locator('button').last()); // Fallback: last button in row

        if (await removeBtn.isVisible().catch(() => false)) {
          await removeBtn.click();
          await this.page.waitForTimeout(500);
          return;
        }

        throw new Error(`Remove button not found for product: ${productName}`);
      }
    }

    throw new Error(`Product not found in basket: ${productName}`);
  }

  /**
   * Check if basket is empty (no visible items).
   */
  async isEmpty(): Promise<boolean> {
    const items = await this.getItems();
    return items.length === 0;
  }

  /**
   * Click the checkout button.
   * BRITTLE: assumes button with "Checkout" text exists.
   */
  async clickCheckout(): Promise<void> {
    const checkoutBtn = this.basketContainer.getByRole('button', { name: /checkout/i });
    await checkoutBtn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for basket page to load (wait for items table/component to be visible).
   */
  async waitForBasketToLoad(): Promise<void> {
    await this.basketContainer.waitFor({ state: 'visible', timeout: 10000 });
  }
}

export default BasketPage;
