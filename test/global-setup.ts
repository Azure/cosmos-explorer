import { type FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalSetup(
  _config?: FullConfig
): Promise<void> {
  console.log('🚀 Starting global setup for Azure Cosmos DB Explorer tests...');

  try {
    // ------------------------------------------------------------------
    // Step 1: Azure CLI login
    // ------------------------------------------------------------------
    console.log('📋 Checking Azure CLI login status...');
    try {
      const { stdout } = await execAsync('az account show --output json');
      const account = JSON.parse(stdout);
      console.log(
        `✅ Already logged in as: ${account.user?.name} in subscription: ${account.name}`
      );
    } catch {
      console.log('🔐 Not logged in to Azure CLI, initiating login...');
      await execAsync(
        'az login --scope https://management.core.windows.net//.default'
      );
      console.log('✅ Azure CLI login completed');
    }

    // ------------------------------------------------------------------
    // Step 2: Set subscription
    // ------------------------------------------------------------------
    const targetSubscription = '074d02eb-4d74-486a-b299-b262264d1536';
    console.log(`🔄 Setting subscription to: ${targetSubscription}`);
    await execAsync(
      `az account set --subscription "${targetSubscription}"`
    );

    // ------------------------------------------------------------------
    // Step 3: Run PowerShell test account setup (DOT-SOURCED)
    // ------------------------------------------------------------------
    console.log('⚙️ Running test account setup script...');

    const scriptPath = path.join(
      __dirname,
      'scripts',
      'set-test-accounts.ps1'
    );

    const resourceGroup = 'bchoudhury-e2e-testing';
    const resourcePrefix = 'bchoudhury-e2e-';

    // IMPORTANT:
    // - Dot-source the PS1
    // - Print env vars BEFORE PowerShell exits
    const psScript = `
. "${scriptPath}" `
  + `-ResourceGroup "${resourceGroup}" `
  + `-Subscription "${targetSubscription}" `
  + `-ResourcePrefix "${resourcePrefix}"

Get-ChildItem Env:DE_TEST_* | ForEach-Object {
  Write-Output "$($_.Name)=$($_.Value)"
}
`;

    // PowerShell requires UTF-16LE encoding for -EncodedCommand
    const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');

    const { stdout: psStdout, stderr: psStderr } = await execAsync(
      `pwsh -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCommand}`
    );

    if (psStderr) {
      console.log('PowerShell warnings:', psStderr);
    }

    // ------------------------------------------------------------------
    // Step 3a: Import env vars from PowerShell
    // ------------------------------------------------------------------
    psStdout
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.startsWith('DE_TEST_'))
      .forEach(line => {
        const [key, ...rest] = line.split('=');
        process.env[key] = rest.join('=');
        console.log(`✅ Imported env var from PS: ${key}`);
      });

    // ------------------------------------------------------------------
    // Step 4: NoSQL access token
    // ------------------------------------------------------------------
    console.log('🎟️ Setting up NoSQL container copy test account token...');
    try {
      const { stdout } = await execAsync(
        'az account get-access-token --scope "https://bchoudhury-e2e-sqlcontainercopyonly.documents.azure.com/.default" -o tsv --query accessToken'
      );
      const token = stdout.trim();
      if (token) {
        process.env.NOSQL_CONTAINERCOPY_TESTACCOUNT_TOKEN = token;
        console.log('✅ NoSQL container copy token set successfully');
      }
    } catch (err: any) {
      console.error('❌ Failed to set NoSQL token:', err.message);
    }

    // Browser authentication not needed - using API tokens directly

    // ------------------------------------------------------------------
    // Step 6: Validate env vars
    // ------------------------------------------------------------------
    console.log('📝 Validating environment variables...');
    const requiredEnvVars = [
      'DE_TEST_RESOURCE_GROUP',
      'DE_TEST_SUBSCRIPTION_ID',
      'DE_TEST_ACCOUNT_PREFIX',
    ];

    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    } else {
      console.log('✅ All required environment variables are set');
    }

    console.log('🎉 Global setup completed successfully!');
  } catch (error: any) {
    console.error('❌ Global setup failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}
