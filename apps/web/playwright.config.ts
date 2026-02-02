import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        trace: 'on-first-retry',
        video: 'on-first-retry',
        launchOptions: {
            args: [
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                // In a real setup, verify usage of a specific y4m file if needed for specific challenge tests
                // '--use-file-for-fake-video-capture=./tests/assets/face.y4m' 
            ]
        }
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        port: 5173,
        reuseExistingServer: !process.env.CI,
    },
});
