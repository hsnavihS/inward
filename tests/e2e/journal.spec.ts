import { test, expect } from "@playwright/test";

const PASSPHRASE = "testpassphrase";

async function unlock(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.fill('input[type="password"]', PASSPHRASE);
  await page.click('button[type="submit"]');
  await expect(page.locator("h1")).toContainText("Inward");
}

test.describe("journal core flows", () => {
  test.beforeEach(async ({ context }) => {
    // Clear IDB state before each test
    await context.clearCookies();
  });

  test("unlock with correct passphrase", async ({ page }) => {
    await unlock(page);
    await expect(page.locator(".empty-state")).toBeVisible();
  });

  test("reject wrong passphrase", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[type="password"]', "wrongpassphrase");
    await page.click('button[type="submit"]');
    await expect(page.locator(".error")).toContainText("Wrong passphrase");
  });

  test("create entry and see it listed", async ({ page }) => {
    await unlock(page);

    await page.click('a:has-text("new")');
    await page.fill('input[placeholder="title"]', "My first entry");
    await page.fill('textarea', "This is the body of my entry");
    await page.click('button:has-text("save")');

    // Should redirect to detail page
    await expect(page.locator("h1")).toContainText("My first entry");
    await expect(page.locator(".entry-body")).toContainText("This is the body of my entry");

    // Go back to home, entry should be listed
    await page.click('a:has-text("back")');
    await expect(page.locator("li")).toContainText("My first entry");
  });

  test("create entry with tags", async ({ page }) => {
    await unlock(page);

    await page.click('a:has-text("new")');
    await page.fill('input[placeholder="title"]', "Tagged entry");
    await page.fill('input[placeholder="add tag (max 5)"]', "journal");
    await page.click('button:has-text("add")');
    await page.fill('input[placeholder="add tag (max 5)"]', "personal");
    await page.click('button:has-text("add")');
    await page.click('button:has-text("save")');

    // Tags visible on detail page
    await expect(page.locator(".tag")).toHaveCount(2);
    await expect(page.locator(".tag").first()).toContainText("journal");
  });

  test("entry persists after page reload", async ({ page }) => {
    await unlock(page);

    // Create an entry
    await page.click('a:has-text("new")');
    await page.fill('input[placeholder="title"]', "Persistent entry");
    await page.fill('textarea', "Should survive reload");
    await page.click('button:has-text("save")');

    // Wait for entry detail to render (confirms save + IDB write completed)
    await expect(page.locator("h1")).toContainText("Persistent entry");
    await expect(page.locator(".entry-body")).toContainText("Should survive reload");

    // Small wait to ensure IDB write completes (async fire-and-forget)
    await page.waitForTimeout(500);

    // Navigate to home and unlock again
    await page.goto("/");
    await page.fill('input[type="password"]', PASSPHRASE);
    await page.click('button[type="submit"]');

    // Entry should still be there
    await expect(page.locator("li")).toContainText("Persistent entry", { timeout: 10000 });
  });
});
