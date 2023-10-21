import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { CosmosClient, PermissionMode } from "@azure/cosmos";
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { jest } from "@jest/globals";
import "expect-playwright";
import { generateUniqueName } from "../utils/shared";

import { isAccountRestrictedForConnectionStringLogin } from "../../src/Platform/Hosted/Helpers/AccountRestrictionsHelper";

jest.setTimeout(120000);
const mockAccountRestricted = jest.fn();

beforeAll(() => {
  jest.mock("../../src/Platform/Hosted/Helpers/AccountRestrictionsHelper", () => {
    return {
      isAccountRestrictedForConnectionStringLogin: mockAccountRestricted,
    };
  });
});

const clientId = "fd8753b0-0707-4e32-84e9-2532af865fb4";
const secret = process.env["NOTEBOOKS_TEST_RUNNER_CLIENT_SECRET"];
const tenantId = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const subscriptionId = "69e02f2d-f059-4409-9eac-97e8a276ae2c";
const resourceGroupName = "runners";

test("Resource token", async () => {
  const credentials = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantId);
  const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
  const account = await armClient.databaseAccounts.get(resourceGroupName, "portal-sql-runner-west-us");
  const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, "portal-sql-runner-west-us");
  const dbId = generateUniqueName("db");
  const collectionId = generateUniqueName("col");
  const client = new CosmosClient({
    endpoint: account.documentEndpoint,
    key: keys.primaryMasterKey,
  });
  const { database } = await client.databases.createIfNotExists({ id: dbId });
  const { container } = await database.containers.createIfNotExists({ id: collectionId });
  const { user } = await database.users.upsert({ id: "testUser" });
  const { resource: containerPermission } = await user.permissions.upsert({
    id: "partitionLevelPermission",
    permissionMode: PermissionMode.All,
    resource: container.url,
  });
  const resourceTokenConnectionString = `AccountEndpoint=${account.documentEndpoint};DatabaseId=${database.id};CollectionId=${container.id};${containerPermission._token}`;

  (isAccountRestrictedForConnectionStringLogin as jest.Mock).mockReturnValue(Promise.resolve(false));

  await page.goto("https://localhost:1234/hostedExplorer.html");
  await page.waitForSelector("div > p.switchConnectTypeText");
  await page.click("div > p.switchConnectTypeText");
  await page.type("input[class='inputToken']", resourceTokenConnectionString);
  await page.click("input[value='Connect']");
  await page.waitForSelector("iframe");
  const explorer = await page.frame({
    name: "explorer",
  });
  await explorer.textContent(`css=.dataResourceTree >> "${collectionId}"`);
});
