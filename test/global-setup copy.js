const { chromium } = require('@playwright/test');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function globalSetup(config) {
  console.log('🚀 Starting global setup for Azure Cosmos DB Explorer tests...');

  try {
    // Step 1: Check if user is already logged in to Azure CLI
    console.log('📋 Checking Azure CLI login status...');
    try {
      const { stdout: accountInfo } = await execAsync('az account show --output json');
      const account = JSON.parse(accountInfo);
      console.log(`✅ Already logged in as: ${account.user?.name} in subscription: ${account.name}`);
    } catch (error) {
      console.log('🔐 Not logged in to Azure CLI, initiating login...');
      
      // Step 2: Login to Azure with specific scope
      console.log('🔑 Logging in to Azure CLI...');
      console.log('Please complete the authentication in your browser...');
      
      await execAsync('az login --scope https://management.core.windows.net//.default');
      console.log('✅ Azure CLI login completed');
    }

    // Step 3: Set the subscription
    const targetSubscription = '074d02eb-4d74-486a-b299-b262264d1536';
    console.log(`🔄 Setting subscription to: ${targetSubscription}`);
    
    await execAsync(`az account set --subscription "${targetSubscription}"`);
    console.log('✅ Subscription set successfully');

    // Step 4: Run the PowerShell test account setup script
    console.log('⚙️ Running test account setup script...');
    const scriptPath = path.join(__dirname, 'scripts', 'set-test-accounts.ps1');
    const resourceGroup = 'bchoudhury-e2e-testing';
    const resourcePrefix = 'bchoudhury-e2e-';
    
    // Try PowerShell 7 first, fallback to Windows PowerShell if not available
    let psCommand = `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -ResourceGroup "${resourceGroup}" -Subscription "${targetSubscription}" -ResourcePrefix "${resourcePrefix}"`;
    
    try {
      const { stdout, stderr } = await execAsync(psCommand);
      if (stdout) console.log('PowerShell Output:', stdout);
      if (stderr) console.log('PowerShell Warnings:', stderr);
      console.log('✅ Test account setup completed');
    } catch (psError) {
      console.log('🔄 PowerShell 7 not available, trying Windows PowerShell...');
      
      // Fallback to Windows PowerShell with NoProfile to avoid module loading issues
      const fallbackCommand = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -ResourceGroup "${resourceGroup}" -Subscription "${targetSubscription}" -ResourcePrefix "${resourcePrefix}"`;
      
      try {
        const { stdout: fbStdout, stderr: fbStderr } = await execAsync(fallbackCommand);
        if (fbStdout) console.log('PowerShell Output:', fbStdout);
        if (fbStderr) console.log('PowerShell Warnings:', fbStderr);
        console.log('✅ Test account setup completed');
      } catch (fallbackError) {
        console.error('❌ PowerShell script execution failed:', fallbackError.message);
        console.warn('⚠️ The PowerShell script failed. This might be due to:');
        console.warn('   1. PowerShell version compatibility (script requires PowerShell 7+ for ?? operator)');
        console.warn('   2. Missing Azure PowerShell modules');
        console.warn('   3. Insufficient permissions or missing resources');
        // Don't throw here as the script might have partial success
      }
    }

    // Step 5: Set the NoSQL container copy test account token
    console.log('🎟️ Setting up NoSQL container copy test account token...');
    try {
      const { stdout: tokenOutput } = await execAsync(
        'az account get-access-token --scope "https://bchoudhury-e2e-sqlcontainercopyonly.documents.azure.com/.default" -o tsv --query accessToken'
      );
      
      const token = tokenOutput.trim();
      if (token) {
        process.env.NOSQL_CONTAINERCOPY_TESTACCOUNT_TOKEN = token;
        console.log('✅ NoSQL container copy token set successfully');
      } else {
        console.warn('⚠️ Failed to retrieve NoSQL container copy token');
      }
    } catch (tokenError) {
      console.error('❌ Failed to set NoSQL token:', tokenError.message);
      // Continue without throwing as this might not be critical for all tests
    }

    // Step 6: Create browser context and save storage state for authentication
    console.log('🌐 Setting up browser authentication state...');
    
    const browser = await chromium.launch();
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });
    
    const page = await context.newPage();
    
    // Navigate to a login page or perform any authentication steps if needed
    // For now, we'll just create an empty storage state that can be populated later
    
    // Save the storage state
    const storageStatePath = path.join(__dirname, '../playwright/.auth/user.json');
    await fs.mkdir(path.dirname(storageStatePath), { recursive: true });
    await context.storageState({ path: storageStatePath });
    
    await browser.close();
    
    console.log(`✅ Browser storage state saved to: ${storageStatePath}`);

    // Step 7: Set environment variables that tests might need
    console.log('📝 Setting up environment variables for tests...');
    
    // Verify required environment variables are set
    const requiredEnvVars = [
      'DE_TEST_RESOURCE_GROUP',
      'DE_TEST_SUBSCRIPTION_ID', 
      'DE_TEST_ACCOUNT_PREFIX'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
      console.warn('These should be set by the PowerShell script. Tests may fail.');
    } else {
      console.log('✅ All required environment variables are set');
    }

    console.log('🎉 Global setup completed successfully!');
    console.log('\n📊 Setup Summary:');
    console.log(`   - Subscription: ${targetSubscription}`);
    console.log(`   - Resource Group: ${resourceGroup}`);
    console.log(`   - Resource Prefix: ${resourcePrefix}`);
    console.log(`   - Storage State: ${storageStatePath}`);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

module.exports = globalSetup;