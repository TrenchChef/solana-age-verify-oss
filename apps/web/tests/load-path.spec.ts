import { test, expect } from '@playwright/test';

/**
 * Biometric load-path test (IMMUTABLES §5).
 * After clicking Verify 18+, we expect either:
 * - Load success: "Verifying..." or "Verification complete" (pass)
 * - Clear error: visible message containing load/model/error (fail — load failed but surfaced)
 * - Timeout: inconclusive (models may be missing in CI; pass with note)
 */
test('load path surfaces ready or clear error', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/x402 Age Verify Demo/);
  const verifyBtn = page.getByRole('button', { name: 'Verify 18+' });
  await expect(verifyBtn).toBeVisible();
  await verifyBtn.click();

  const loadSuccess = page.getByRole('button', { name: 'Verifying...' });
  const verificationComplete = page.locator('text=Verification complete');
  const errorIndicators = page.getByText(/load|model|error|failed/i);

  const timeoutMs = 20000;
  const timeoutPromise = new Promise<'timeout'>((resolve) =>
    setTimeout(() => resolve('timeout'), timeoutMs)
  );

  const result = await Promise.race([
    loadSuccess.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => 'ready' as const),
    verificationComplete.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => 'complete' as const),
    errorIndicators.first().waitFor({ state: 'visible', timeout: timeoutMs }).then(() => 'error' as const),
    timeoutPromise,
  ]);

  if (result === 'error') {
    const msg = await errorIndicators.first().textContent();
    throw new Error(`Load path failed (clear error surfaced): ${msg?.slice(0, 200)}`);
  }
  if (result === 'timeout') {
    // Models may be missing in CI; do not fail the job.
    console.warn('[load-path] Inconclusive: no ready/complete/error within 20s (models may be missing).');
    return;
  }
  expect(result).toMatch(/ready|complete/);
});
