import { test, expect } from '@playwright/test';

test.describe('SmartQEye Coastal — Production Smoke Suite', () => {
  const routesToTest = [
    { path: '/', titleSnippet: 'Command Center', keySelector: '#main-content, main' },
    { path: '/live', titleSnippet: 'Live Monitor', keySelector: 'main, video, [data-testid="drone-player"]' },
    { path: '/fleet', titleSnippet: 'Fleet Wall', keySelector: 'main' },
    { path: '/alerts', titleSnippet: 'Alerts', keySelector: 'main' },
    { path: '/alerts/alr-01', titleSnippet: 'Alert Detail', keySelector: 'main' },
    { path: '/map', titleSnippet: 'Map', keySelector: 'main' },
    { path: '/missions', titleSnippet: 'Missions', keySelector: 'main' },
    { path: '/contacts', titleSnippet: 'Contacts', keySelector: 'main' },
    { path: '/contacts/C-1042', titleSnippet: 'Contact Detail', keySelector: 'main' },
    { path: '/vehicle-maritime', titleSnippet: 'Maritime', keySelector: 'main' },
    { path: '/crowd-analytics', titleSnippet: 'Crowd', keySelector: 'main' },
    { path: '/intrusion-detection', titleSnippet: 'Intrusion', keySelector: 'main' },
    { path: '/anomaly-monitor', titleSnippet: 'Anomaly', keySelector: 'main' },
    { path: '/person-reid', titleSnippet: 'Person Re-ID', keySelector: 'main' },
    { path: '/history', titleSnippet: 'History', keySelector: 'main' },
    { path: '/incidents', titleSnippet: 'Incidents', keySelector: 'main' },
    { path: '/reports', titleSnippet: 'Reports', keySelector: 'main' },
    { path: '/config/zones', titleSnippet: 'Zones', keySelector: 'main' },
    { path: '/config/alerts', titleSnippet: 'Alert Rules', keySelector: 'main' },
    { path: '/models', titleSnippet: 'Models', keySelector: 'main' },
    { path: '/deployment', titleSnippet: 'Deployment', keySelector: 'main' },
    { path: '/integrations', titleSnippet: 'Integrations', keySelector: 'main' },
    { path: '/health', titleSnippet: 'System Health', keySelector: 'main' },
    { path: '/admin', titleSnippet: 'Administration', keySelector: 'main' },
    { path: '/audit', titleSnippet: 'Audit Log', keySelector: 'main' },
    { path: '/acceptance', titleSnippet: 'Acceptance', keySelector: 'main' },
    { path: '/help', titleSnippet: 'Help', keySelector: 'main' },
    { path: '/styleguide', titleSnippet: 'Design System', keySelector: 'main' },
  ];

  test('logs in as Sys Admin and visits all operational routes without errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // 1. Visit /login
    await page.goto('/login');
    await expect(page).toHaveTitle(/SmartQEye Coastal/i);

    // 2. Click "Sys Admin" demo quick login button to gain full administrative permissions
    const sysAdminButton = page.getByRole('button', { name: 'Sys Admin' });
    await expect(sysAdminButton).toBeVisible();
    await sysAdminButton.click();

    // 3. Wait for redirect to Command Center
    await page.waitForURL('**/', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();

    // 4. Visit each route
    for (const route of routesToTest) {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');
      const container = page.locator(route.keySelector).first();
      await expect(container).toBeVisible({ timeout: 10000 });
    }

    // Assert that no unhandled JavaScript runtime exceptions occurred across all navigation
    expect(pageErrors).toEqual([]);
  });
});
