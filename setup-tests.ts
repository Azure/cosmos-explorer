#!/usr/bin/env node

/**
 * Manual setup script to run the pre-flight Azure authentication and configuration
 * This can be used independently of Playwright for setting up the testing environment
 */


async function runManualSetup(): Promise<void> {
  console.log('🚀 Starting manual Azure Cosmos DB Explorer test setup...');

  try {
    // Dynamically import the Playwright global setup
    const globalSetupModule = await import('./test/global-setup');
    const globalSetup = globalSetupModule.default;

    if (typeof globalSetup !== 'function') {
      throw new Error('global-setup.ts does not export a default function');
    }

    // Minimal mock config similar to what Playwright provides
    /* const mockConfig: FullConfig = {
          configFile: path.join(__dirname, 'playwright.config.ts'),
          rootDir: __dirname,
          testDir: path.join(__dirname, 'test'),
          projects: []
        }; */

    await globalSetup();

    console.log('✅ Manual setup completed successfully!');
    console.log('\nYou can now run your Playwright tests with:');
    console.log('  npm run test:e2e');
    console.log('  or');
    console.log('  npx playwright test');
  } catch (error: any) {
    console.error('❌ Manual setup failed:', error.message);
    process.exit(1);
  }
}

// Only run if executed directly (not imported)
if (require.main === module) {
  void runManualSetup();
}

export { runManualSetup };

