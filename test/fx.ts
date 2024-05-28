import { AzureCliCredentials } from "@azure/ms-rest-nodeauth";
import { Frame, Locator, Page } from "@playwright/test";
import crypto from "crypto";

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

export enum TestAccount {
  Tables = "Tables",
  Cassandra = "Cassandra",
  Gremlin = "Gremlin",
  Mongo = "Mongo",
  Mongo32 = "Mongo32",
  SQL = "SQL",
}

export const defaultAccounts: Record<TestAccount, string> = {
  [TestAccount.Tables]: "portal-tables-runner",
  [TestAccount.Cassandra]: "portal-cassandra-runner",
  [TestAccount.Gremlin]: "portal-gremlin-runner",
  [TestAccount.Mongo]: "portal-mongo-runner",
  [TestAccount.Mongo32]: "portal-mongo32-runner",
  [TestAccount.SQL]: "portal-sql-runner-west-us",
};

const resourceGroup = process.env.DE_TEST_RESOURCE_GROUP ?? "runners";
const subscriptionId = process.env.DE_TEST_SUBSCRIPTION_ID ?? "69e02f2d-f059-4409-9eac-97e8a276ae2c";

export async function getTestExplorerUrl(accountType: TestAccount) {
  // We can't retrieve AZ CLI credentials from the browser so we get them here.
  const token = await getAzureCLICredentialsToken();
  const accountName =
    process.env[`DE_TEST_ACCOUNT_NAME_${accountType.toLocaleUpperCase()}`] ?? defaultAccounts[accountType];
  return `https://localhost:1234/testExplorer.html?accountName=${accountName}&resourceGroup=${resourceGroup}&subscriptionId=${subscriptionId}&token=${token}`;
}

/** Helper class that provides locator methods for TreeNode elements, on top of a Locator */
class TreeNode {
  constructor(public element: Locator, public frame: Frame) {
  }

  async openContextMenu(): Promise<void> {
    await this.element.getByTestId("Tree/TreeNode/ContextMenuButton").click();
  }

  contextMenuItem(name: string): Locator {
    return this.frame.getByTestId(`Tree/TreeNode/ContextMenuItem:${name}`);
  }
}

/** Helper class that provides locator methods for DataExplorer components, on top of a Frame */
export class DataExplorer {
  constructor(public frame: Frame) {
  }

  commandBarButton(label: string): Locator {
    return this.frame.getByTestId(`CommandBar/Button:${label}`).and(this.frame.locator("css=button"));
  }

  panel(title: string): Locator {
    return this.frame.getByTestId(`Panel:${title}`);
  }

  treeNode(id: string): TreeNode {
    return new TreeNode(this.frame.getByTestId(`Tree/TreeNode:${id}`), this.frame);
  }

  async whilePanelOpen(title: string, action: (panel: Locator, okButton: Locator) => Promise<void>): Promise<void> {
    const panel = this.panel(title);
    await panel.waitFor();
    const okButton = panel.getByTestId("Panel/OkButton");
    await action(panel, okButton);
    await panel.waitFor({ state: "detached" });
  }

  static async open(page: Page, testAccount: TestAccount): Promise<DataExplorer> {
    page.setDefaultTimeout(50000);
    const url = await getTestExplorerUrl(testAccount);
    await page.goto(url);
    const iframeElement = await page.getByTestId("DataExplorerFrame").elementHandle();
    if (iframeElement === null) {
      throw new Error("Explorer iframe not found");
    }

    const explorerFrame = await iframeElement.contentFrame();

    if (explorerFrame === null) {
      throw new Error("Explorer frame not found");
    }

    await explorerFrame?.getByTestId("DataExplorerRoot").waitFor();

    return new DataExplorer(explorerFrame);
  }
}