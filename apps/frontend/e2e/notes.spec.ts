import { test, expect } from "@playwright/test";

test.describe("Notes Application", () => {
  test("should load login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome to notes/i })).toBeVisible();
  });

  test("should login and navigate to notes", async ({ page }) => {
    await page.goto("/login");
    
    // Fill in login form
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to notes page
    await expect(page).toHaveURL(/\/notes/);
  });

  test("should create a new note", async ({ page }) => {
    // TODO: Implement full e2e test for note creation
    // This is a stub for demonstration
    expect(true).toBe(true);
  });
});
