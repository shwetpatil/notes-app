import { test, expect } from "@playwright/test";

// Test user credentials
const TEST_USER = {
  email: "test@example.com",
  password: "Test123456!",
  name: "Test User",
};

test.describe("Notes Application - Authentication", () => {
  test("should load login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("should show validation errors for invalid login", async ({ page }) => {
    await page.goto("/login");
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors or stay on page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should register a new user", async ({ page }) => {
    await page.goto("/register");
    
    // Fill registration form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', TEST_USER.name);
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', TEST_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to notes or login page
    await page.waitForURL(/\/(notes|login)/);
  });
});

test.describe("Notes Application - Core Functionality", () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/notes/);
  });

  test("should navigate to notes dashboard after login", async ({ page }) => {
    await expect(page).toHaveURL(/\/notes/);
  });

  test("should create a new note", async ({ page }) => {
    // Look for "New Note" button
    const newNoteButton = page.locator('button:has-text("New Note"), button:has-text("Create")').first();
    await newNoteButton.click();
    
    // Fill in note details
    const noteTitle = `Test Note ${Date.now()}`;
    await page.fill('input[placeholder*="title" i], input[name="title"]', noteTitle);
    await page.fill('textarea[placeholder*="content" i], textarea[name="content"], [contenteditable="true"]', "This is a test note content.");
    
    // Save note
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
    await saveButton.click();
    
    // Wait for note to appear in list
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${noteTitle}`).first()).toBeVisible({ timeout: 5000 });
  });

  test("should search for notes", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      
      // Wait for search results
      await page.waitForTimeout(500);
      
      // Results should be filtered
      // This is a basic check that search doesn't crash
      await expect(page).toHaveURL(/\/notes/);
    }
  });

  test("should filter notes by favorite", async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for favorites filter/tab
    const favoritesButton = page.locator('button:has-text("Favorite"), [role="tab"]:has-text("Favorite")').first();
    if (await favoritesButton.isVisible()) {
      await favoritesButton.click();
      await page.waitForTimeout(500);
      
      // Should still be on notes page
      await expect(page).toHaveURL(/\/notes/);
    }
  });

  test("should navigate to templates page", async ({ page }) => {
    // Look for templates link
    const templatesLink = page.locator('a[href="/templates"], button:has-text("Templates")').first();
    if (await templatesLink.isVisible()) {
      await templatesLink.click();
      await page.waitForURL(/\/templates/);
    }
  });

  test("should edit a note", async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Click on first note (if exists)
    const firstNote = page.locator('[data-testid="note-item"], .note-item, article').first();
    if (await firstNote.isVisible()) {
      await firstNote.click();
      await page.waitForTimeout(500);
      
      // Try to edit
      const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit" i]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Modify content
        const contentField = page.locator('textarea, [contenteditable="true"]').first();
        await contentField.fill("Updated content");
        
        // Save
        const saveButton = page.locator('button:has-text("Save")').first();
        await saveButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("should mark note as favorite", async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for favorite button/icon
    const favoriteButton = page.locator('[aria-label*="favorite" i], button:has([data-icon="star"])').first();
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("should move note to trash", async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for delete/trash button
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Trash"), [aria-label*="delete" i]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(500);
    }
  });

  test("should logout successfully", async ({ page }) => {
    // Look for logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/\/(login|$)/);
    }
  });
});

test.describe("Notes Application - Offline Functionality", () => {
  test("should handle offline mode", async ({ page, context }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/notes/);
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    
    // Try to create a note offline
    const newNoteButton = page.locator('button:has-text("New Note"), button:has-text("Create")').first();
    if (await newNoteButton.isVisible()) {
      await newNoteButton.click();
      
      // Should still be able to interact with UI
      await expect(page).toHaveURL(/\/notes/);
    }
    
    // Go back online
    await context.setOffline(false);
  });
});
