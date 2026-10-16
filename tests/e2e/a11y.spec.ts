import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('SmartQEye Coastal — Accessibility (a11y) Verification', () => {
  const keyPages = [
    { name: 'Login Page', path: '/login', requiresLogin: false },
    { name: 'Command Center', path: '/', requiresLogin: true },
    { name: 'Alerts Queue', path: '/alerts', requiresLogin: true },
    { name: 'Persistent Contacts', path: '/contacts', requiresLogin: true },
    { name: 'Incident Records', path: '/incidents', requiresLogin: true },
    { name: 'System Health', path: '/health', requiresLogin: true },
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate as Sys Admin
    await page.goto('/login');
    const sysAdminButton = page.getByRole('button', { name: 'Sys Admin' });
    if (await sysAdminButton.isVisible()) {
      await sysAdminButton.click();
      await page.waitForURL('**/', { timeout: 10000 });
    }
  });

  for (const pageInfo of keyPages) {
    test(`checks accessibility violations on ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('domcontentloaded');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast']) // Color contrast evaluated in high-contrast mode separately
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
