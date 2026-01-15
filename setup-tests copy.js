#!/usr/bin/env node

/**
 * Manual setup script to run the pre-flight Azure authentication and configuration
 * This can be used independently of Playwright for setting up the testing environment
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

async function runManualSetup() {
  console.log('🚀 Starting manual Azure Cosmos DB Explorer test setup...');
  
  try {
    // Import the global setup function and run it
    const globalSetup = require('./test/global-setup.js');
    
    // Create a minimal config object that matches what Playwright would pass
    const mockConfig = {
      configFile: path.join(__dirname, 'playwright.config.ts'),
      rootDir: __dirname,
      testDir: path.join(__dirname, 'test'),
      projects: []
    };
    
    await globalSetup(mockConfig);
    
    console.log('✅ Manual setup completed successfully!');
    console.log('\nYou can now run your Playwright tests with:');
    console.log('  npm run test:e2e');
    console.log('  or');
    console.log('  npx playwright test');
    
  } catch (error) {
    console.error('❌ Manual setup failed:', error.message);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  runManualSetup();
}

module.exports = { runManualSetup };