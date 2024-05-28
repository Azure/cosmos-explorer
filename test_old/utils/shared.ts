import { AzureCliCredentials } from "@azure/ms-rest-nodeauth";
import crypto from "crypto";
import { Frame } from "playwright";

export enum AccountType {
  Tables = "Tables",
  Cassandra = "Cassandra",
  Gremlin = "Gremlin",
  Mongo = "Mongo",
  Mongo32 = "Mongo32",
  SQL = "SQL",
}

export const defaultAccounts: Record<AccountType, string> = {
  [AccountType.Tables]: "portal-tables-runner",
  [AccountType.Cassandra]: "portal-cassandra-runner",
  [AccountType.Gremlin]: "portal-gremlin-runner",
  [AccountType.Mongo]: "portal-mongo-runner",
  [AccountType.Mongo32]: "portal-mongo32-runner",
  [AccountType.SQL]: "portal-sql-runner-west-us",
};

const resourceGroup = process.env.DE_TEST_RESOURCE_GROUP ?? "runners";
const subscriptionId = process.env.DE_TEST_SUBSCRIPTION_ID ?? "69e02f2d-f059-4409-9eac-97e8a276ae2c";

export async function getTestExplorerUrl(accountType: AccountType) {
  // We can't retrieve AZ CLI credentials from the browser so we get them here.
  const token = await getAzureCLICredentialsToken();
  const accountName =
    process.env[`DE_TEST_ACCOUNT_NAME_${accountType.toLocaleUpperCase()}`] ?? defaultAccounts[accountType];
  return `https://localhost:1234/testExplorer.html?accountName=${accountName}&resourceGroup=${resourceGroup}&subscriptionId=${subscriptionId}&token=${token}`;
}

export function generateUniqueName(baseName = "", length = 4): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}`;
}

export function generateDatabaseNameWithTimestamp(baseName = "db", length = 1): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}-${Date.now()}`;
}

export async function getAzureCLICredentials(): Promise<AzureCliCredentials> {
  return await AzureCliCredentials.create();
}

export async function getAzureCLICredentialsToken(): Promise<string> {
  const credentials = await getAzureCLICredentials();
  const token = (await credentials.getToken()).accessToken;
  return token;
}

export function getPanelSelector(title: string) {
  return `[data-test="Panel:${title}"]`;
}

export function getTreeNodeSelector(id: string) {
  return `[data-test="TreeNode:${id}"]`;
}

export function getTreeMenuItemSelector(nodeId: string, itemLabel: string) {
  return `[data-test="TreeNode/ContextMenu:${nodeId}"] [data-test="TreeNode/ContextMenuItem:${itemLabel}"]`;
}

export async function openContextMenu(explorer: Frame, nodeIdentifier: string) {
  const nodeSelector = getTreeNodeSelector(nodeIdentifier);
  await explorer.hover(nodeSelector);
  await explorer.click(`${nodeSelector} [data-test="TreeNode/ContextMenuTrigger"]`);
  await explorer.waitForSelector(`[data-test="TreeNode/ContextMenu:${nodeIdentifier}"]`);
}
