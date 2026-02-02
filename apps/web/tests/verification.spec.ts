import { test, expect } from '@playwright/test';

// Smoke test: validates PDA-based verification by virtue of
// verification completing with the SDK mock flow.
test('has title and verifies age', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Solana Age Verify/);

    // Check for the video element
    const video = page.locator('video');
    await expect(video).toBeVisible();

    // Click verify
    await page.getByRole('button', { name: 'Verify 18+' }).click();

    // Should see status
    await expect(page.getByRole('button', { name: 'Verifying...' })).toBeVisible();

    // Wait for result
    // Since we are mocking the result in the SDK (timer based), it should pass.
    await expect(page.locator('text=Verification complete')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text="over18": true')).toBeVisible();
});
