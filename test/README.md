# End-to-End Test Suite

This directory contains end-to-end tests for Cosmos Data Explorer.
These tests **require** that you either deploy, or have access to, several Cosmos test Accounts.
The tests run in [Playwright](https://playwright.dev/), using the official Playwright test framework.

## Required Resources

To run all the tests, you need:

- A CosmosDB Account using the Cassandra API
- A CosmosDB Account using the Gremlin API
- A CosmosDB Account using the MongoDB API, API version 6.0
- A CosmosDB Account using the MongoDB API, API version 3.2
- A CosmosDB Account using the NoSQL API
- A CosmosDB Account using the Tables API

Each Account must have at least 1000 RU/s of throughput available for new databases/collections/etc.
The tests create new databases/keyspaces/etc. for each test, and delete them when the test is done.
So it should be safe to use these accounts for other testing purposes, as long as you make sure to have enough throughput available when running the tests.

You can specify the resource to use using the Environment Variables configuration below.
Or, you can deploy resources specifically for testing using the `deploy` script.

### Using the deploy script

> [!NOTE]
> This script currently only works on Windows.

The `resources` directory contains a `deploy.ps1` script that will deploy the required resources for testing.
They use a Bicep template to deploy the resources.
All you need to provide is a resource group to deploy in to.

To use this script, there are a few prerequisites that must be done at least once:

1. This script requires Powershell 7+. Install it [here](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows).
2. [Install Azure PowerShell](https://learn.microsoft.com/en-us/powershell/azure/install-azps-windows?view=azps-12.0.0&tabs=powershell&pivots=windows-psgallery) if you don't already have it.
3. [Install Bicep CLI](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/install#install-manually) if it is not already installed.
4. Connect to your Azure account using `Connect-AzAccount`.
5. Ensure you have a Resource Group _ready_ to deploy into, the deploy script requires an existing resource group. This resource group should be named `[username]-e2e-testing`, where `[username]` is your Windows username, (**Microsoft employees:** This should be your alias). The easiest way to do this is by running the `create-resource-group.ps1` script, specifying the Subscription (Name or ID) and Location in which you want to create the Resource Group. For example:

```powershell
.\test\resources\create-resource-group.ps1 -SubscriptionId "My Subscription Id" -Location "West US 3"
```

Then, whenever you want to create/update the resources, you can run the `deploy.ps1` script in the `resources` directory. As long as you're using the default naming convention (`[username]-e2e-testing`), you just need to specify the Subscription. For example:

```powershell
.\test\resources\deploy.ps1 -Subscription "My Subscription"
```

You'll get a confirmation prompt before anything is deployed:

```
Found a resource group with the default name (ashleyst-e2e-testing). Using that resource group. If you want to use a different resource group, specify it as a parameter.
Deploying test resource sets: tables cassandra gremlin mongo mongo32 sql
  in West US 3
  to resource group ashleyst-e2e-testing
  in subscription ... (...)
Do you want to continue? (y/n):
```

This prompt shows:

- The resources that will be deployed, in this case, all of them. You can filter to deploy only a subset by specifying the `-ResourceTypes` parameter. For example `-ResourceTypes @("cassandra", "sql")`.
- The location the resources will be deployed to, `West US 3` in this case.
- The resource group that will be used, `ashleyst-e2e-testing` in this case.
- The subscription that will be used.

Once you confirm, the resources will be deployed using Azure PowerShell and the Bicep templates in the `resources` directory. The script will wait for all the deployments to complete before exiting.

You can re-run this script at any time to update the resources, if the Bicep templates have changed.

## Preparing the test environment

Before running the tests, you need to configure your environment to specify the accounts to use for testing.
The following environment variables are used:

- `DE_TEST_RESOURCE_GROUP` - The resource group to use for testing. This should be the same resource group that the resources were deployed to.
- `DE_TEST_SUBSCRIPTION_ID` - The subscription ID to use for testing. This should be the same subscription that the resources were deployed to.
- `DE_TEST_ACCOUNT_PREFIX` - If you used the default naming scheme provided by the `deploy.ps1` script, this should be your Windows username (or whatever value you passed in for the `-ResourcePrefix` argument when deploying). This is used to find the accounts that were deployed.

In the event you didn't use the `deploy.ps1` script, you can specify the accounts directly using the following environment variables:

- `DE_TEST_ACCOUNT_NAME_CASSANDRA` - The name of the CosmosDB Account using the Cassandra API.
- `DE_TEST_ACCOUNT_NAME_GREMLIN` - The name of the CosmosDB Account using the Gremlin API.
- `DE_TEST_ACCOUNT_NAME_MONGO` - The name of the CosmosDB Account using the MongoDB API, API version 6.0.
- `DE_TEST_ACCOUNT_NAME_MONGO32` - The name of the CosmosDB Account using the MongoDB API, API version 3.2.
- `DE_TEST_ACCOUNT_NAME_SQL` - The name of the CosmosDB Account using the NoSQL API.
- `DE_TEST_ACCOUNT_NAME_TABLES` - The name of the CosmosDB Account using the Tables API.

If you used all the standard deployment scripts and naming scheme, you can set these environment variables using the following command:

```powershell
.\test\scripts\set-test-accounts.ps1
```

If Azure Powershell's current subscription is not the one you want to use for testing, you can set the subscription using the following command:

```powershell
.\test\scripts\set-test-accounts.ps1 -Subscription "My Subscription"
```

That script will confirm the resource group exists and then set the necessary environment variables:

```
The currently-selected subscription is ... (...)
Do you want to use this subscription? (y/n): y

Found a resource with the default resource prefix (ashleyst-e2e-). Configuring that prefix for E2E testing.
Configuring for E2E Testing
  Subscription: ... (...)
  Resource Group: ashleyst-e2e-testing
  Resource Prefix: ashleyst-e2e-
    Found CosmosDB Account: ashleyst-e2e-cassandra
    Found CosmosDB Account: ashleyst-e2e-gremlin
    Found CosmosDB Account: ashleyst-e2e-mongo
    Found CosmosDB Account: ashleyst-e2e-mongo32
    Found CosmosDB Account: ashleyst-e2e-sql
    Found CosmosDB Account: ashleyst-e2e-tables
```

## Running the tests

If Azure CLI is not installed, please [install it](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).

Log into Az CLI with the following command:

```powershell
az login --scope https://management.core.windows.net//.default
```

To run all tests in a headless browser, run the following command from the root of the repo:

```powershell
npx playwright test
```

> [!NOTE]
> You may be prompted to install the Playwright browsers the first time you run the tests.

The tests will use your existing server if you have one running, or start a new server if you don't.

When running individual tests, you may find it most useful to use the Playwright UI to run the tests.
You can do this by running the following command:

```powershell
npx playwright test --ui
```

The UI allows you to select a specific test to run and to see the results of the test in the browser.

See the [Playwright docs](https://playwright.dev/docs/running-tests) for more information on running tests.

### Testing with Data Plane RBAC Authentication

By default, the tests will use key based authentication to access the database accounts. For APIs that support data plane RBAC, the
test can be configured to use that instead, by acquiring access tokens and setting them to environment variables:

```powershell
# NoSQL API
$ENV:NOSQL_TESTACCOUNT_TOKEN=az account get-access-token --scope "https://<account name>.documents.azure.com/.default" -o tsv --query accessToken

# NoSQL API (Readonly)
$ENV:NOSQL_READONLY_TESTACCOUNT_TOKEN=az account get-access-token --scope "https://<account name>.documents.azure.com/.default" -o tsv --query accessToken

# NoSQL API (Container Copy)
$ENV:NOSQL_CONTAINERCOPY_TESTACCOUNT_TOKEN=az account get-access-token --scope "https://<account name>.documents.azure.com/.default" -o tsv --query accessToken

# Tables API
$ENV:TABLE_TESTACCOUNT_TOKEN=az account get-access-token --scope "https://<account name>.documents.azure.com/.default" -o tsv --query accessToken

# Gremlin API
$ENV:GREMLIN_TESTACCOUNT_TOKEN=az account get-access-token --scope "https://<account name>.documents.azure.com/.default" -o tsv --query accessToken
```

When setting up test accounts to use dataplane RBAC, you will need to create custom role definitions with the following roles:

```txt
# NoSQL API roles
Microsoft.DocumentDB/databaseAccounts/readMetadata
Microsoft.DocumentDB/databaseAccounts/sqlDatabases/*
Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/*
Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/*
Microsoft.DocumentDB/databaseAccounts/throughputSettings/*

# Tables API roles
Microsoft.DocumentDB/databaseAccounts/readMetadata
Microsoft.DocumentDB/databaseAccounts/tables/*
Microsoft.DocumentDB/databaseAccounts/throughputSettings/*

# Gremlin API roles
Microsoft.DocumentDB/databaseAccounts/readMetadata
Microsoft.DocumentDB/databaseAccounts/gremlin/*
Microsoft.DocumentDB/databaseAccounts/throughputSettings/
```

## Clean-up

Tests should clean-up after themselves if they succeed (and sometimes even when they fail).
However, this is not guaranteed, and you may find that you have resources left over from failed tests.
Any resource (database, container, etc.) prefixed with `t_` is a test resource and can be safely deleted if you aren't currently running tests.
The `test/scripts/clean-test-accounts.ps1` script will attempt to clean all the test resources.

```powershell
.\test\scripts\clean-test-accounts.ps1 -Subscription "My Subscription"
```

That script will confirm the resource group exists and then prompt you to confirm the deletion of the resources:

```
Found a resource with the default resource prefix (ashleyst-e2e-). Configuring that prefix for E2E testing.
Cleaning E2E Testing Resources
  Subscription: cosmosdb-portalteam-generaltest-msft (b9c77f10-b438-4c32-9819-eef8a654e478)
  Resource Group: ashleyst-e2e-testing
  Resource Prefix: ashleyst-e2e-

All databases with the prefix 't_' will be deleted.
Are you sure you want to delete these resources? (y/n): y
    Cleaning Mongo Account: ashleyst-e2e-mongo
    Cleaning Gremlin Account: ashleyst-e2e-gremlin
    Cleaning Table Account: ashleyst-e2e-tables
    Cleaning Cassandra Account: ashleyst-e2e-cassandra
      Cleaning Keyspace: t_db90_1722888413729
      Cleaning Keyspace: t_db76_1722882571248
      Cleaning Keyspace: t_db3a_1722882413947
      Cleaning Keyspace: t_db4d_1722882342943
      Cleaning Keyspace: t_db64_1722888944788
      Cleaning Keyspace: t_db90_1722882507916
      Cleaning Keyspace: t_dbf5_1722888997915
      Cleaning Keyspace: t_db7e_1722882689913
    Cleaning SQL Account: ashleyst-e2e-sql
      Cleaning Database: t_db32_1722890547089
    Cleaning Mongo Account: ashleyst-e2e-mongo32
```
