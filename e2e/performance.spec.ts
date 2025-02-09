import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('loads dashboard within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-content')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second budget
  });

  test('handles large data sets efficiently', async ({ page }) => {
    await page.goto('/dashboard');

    // Load more data
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);
    }

    // Check memory usage
    const metrics = await page.metrics();
    expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB limit
  });

  test('maintains responsiveness during updates', async ({ page }) => {
    await page.goto('/dashboard');

    // Start performance monitoring
    await page.evaluate(() => {
      window.performanceMarks = [];
      const observer = new PerformanceObserver((list) => {
        window.performanceMarks.push(...list.getEntries());
      });
      observer.observe({ entryTypes: ['measure'] });
    });

    // Simulate rapid updates
    for (let i = 0; i < 10; i++) {
      await page.evaluate((i) => {
        performance.mark(`update-start-${i}`);
        window.postMessage({
          type: 'MOCK_BOOKING_CREATED',
          data: { id: `booking-${i}` }
        }, '*');
        performance.mark(`update-end-${i}`);
        performance.measure(`update-${i}`, `update-start-${i}`, `update-end-${i}`);
      }, i);
      await page.waitForTimeout(100);
    }

    // Check performance marks
    const marks = await page.evaluate(() => window.performanceMarks);
    marks.forEach((mark: any) => {
      expect(mark.duration).toBeLessThan(100); // 100ms budget per update
    });
  });
});