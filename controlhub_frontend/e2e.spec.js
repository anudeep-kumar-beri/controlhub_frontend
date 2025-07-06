// Playwright E2E tests for ControlHub
// To run: npx playwright test e2e.spec.js
const { test, expect } = require('@playwright/test');

const BASE = '/';

test.describe('ControlHub Main Flows', () => {
  test('Home page loads and navigation works', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('text=ControlHub')).toBeVisible();
    await page.click('role=heading[name="Skill Tracker"]');
    await expect(page.locator('role=heading[name="Skill Tracker"]')).toBeVisible();
    await page.goBack();
    await page.click('role=heading[name="Job Tracker"]');
    await expect(page.locator('role=heading[name="Job Tracker"]')).toBeVisible();
    await page.goBack();
    await page.click('role=heading[name="Bookmarks"]');
    await expect(page.locator('role=heading[name="Bookmarks"]')).toBeVisible();
    await page.goBack();
    await page.click('role=heading[name="Quick Journal"]');
    await expect(page.locator('role=heading[name="Quick Journal"]')).toBeVisible();
    await page.goBack();
    await page.click('role=heading[name="Weekly Logs"]');
    await expect(page.locator('role=heading[name="Weekly Logs"]')).toBeVisible();
    await page.goBack();
    await page.click('role=heading[name="FileShare Board"]');
    await expect(page.locator('role=heading[name="FileShare Board"]')).toBeVisible();
  });

  test('Skill Tracker: add, update, and delete skill', async ({ page }) => {
    await page.goto(BASE + 'skill-tracker');
    await page.fill('input[placeholder="Skill Name"]', 'PlaywrightTestSkill');
    await page.fill('input[placeholder="%"]', '42');
    await page.click('button:has-text("＋")');
    await expect(page.locator('text=PlaywrightTestSkill')).toBeVisible();
    // Update progress
    await page.locator('input[type="range"]').last().fill('55');
    // Delete
    await page.locator('button:has-text("✕")').last().click();
    await expect(page.locator('text=PlaywrightTestSkill')).not.toBeVisible();
  });

  test('Job Tracker: add and delete job', async ({ page }) => {
    await page.goto(BASE + 'job-tracker');
    await page.fill('input[placeholder="Role"]', 'QA Engineer');
    await page.fill('input[placeholder="Status"]', 'Testing');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=QA Engineer')).toBeVisible();
    await page.locator('button:has-text("Delete")').last().click();
    await expect(page.locator('text=QA Engineer')).not.toBeVisible();
  });

  test('Bookmarks: add and delete bookmark', async ({ page }) => {
    await page.goto(BASE + 'bookmarks');
    await page.fill('input[placeholder="Title"]', 'PlaywrightTestBM');
    await page.fill('input[placeholder="URL"]', 'https://playwright.dev');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=PlaywrightTestBM')).toBeVisible();
    await page.locator('button:has-text("Delete")').last().click();
    await expect(page.locator('text=PlaywrightTestBM')).not.toBeVisible();
  });

  test('Quick Journal: edit and save', async ({ page }) => {
    await page.goto(BASE + 'quick-journal');
    await page.fill('textarea', 'Automated journal entry');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Last updated')).toBeVisible();
  });

  test('Weekly Logs: add and delete log', async ({ page }) => {
    await page.goto(BASE + 'weekly-logs');
    await page.fill('input[placeholder="New log entry"]', 'PlaywrightTestLog');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=PlaywrightTestLog')).toBeVisible();
    await page.locator('button:has-text("Delete")').last().click();
    await expect(page.locator('text=PlaywrightTestLog')).not.toBeVisible();
  });

  test('FileShare Board loads', async ({ page }) => {
    await page.goto(BASE + 'file-share-board');
    await expect(page.locator('role=heading[name="FileShare Board"]')).toBeVisible();
  });
});
