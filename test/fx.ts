import { AzureCliCredentials } from "@azure/ms-rest-nodeauth";
import { expect, Frame, Locator, Page } from "@playwright/test";
import crypto from "crypto";

export function generateUniqueName(baseName = "", length = 4): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}`;
}

export function generateDatabaseNameWithTimestamp(baseName = "db", length = 1): string {
  // We use '_' as the separator because it's supported across all the API types.
  return `${baseName}${crypto.randomBytes(length).toString("hex")}_${Date.now()}`;
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

export const resourceGroupName = process.env.DE_TEST_RESOURCE_GROUP ?? "runners";
export const subscriptionId = process.env.DE_TEST_SUBSCRIPTION_ID ?? "69e02f2d-f059-4409-9eac-97e8a276ae2c";

function tryGetStandardName(accountType: TestAccount) {
  if (process.env.DE_TEST_ACCOUNT_PREFIX) {
    const actualPrefix = process.env.DE_TEST_ACCOUNT_PREFIX.endsWith("-")
      ? process.env.DE_TEST_ACCOUNT_PREFIX
      : `${process.env.DE_TEST_ACCOUNT_PREFIX}-`;
    return `${actualPrefix}${accountType.toLocaleLowerCase()}`;
  }
}

export function getAccountName(accountType: TestAccount) {
  return (
    process.env[`DE_TEST_ACCOUNT_NAME_${accountType.toLocaleUpperCase()}`] ??
    tryGetStandardName(accountType) ??
    defaultAccounts[accountType]
  );
}

export async function getTestExplorerUrl(accountType: TestAccount, iframeSrc?: string): Promise<string> {
  // We can't retrieve AZ CLI credentials from the browser so we get them here.
  const token = await getAzureCLICredentialsToken();
  const accountName = getAccountName(accountType);
  const params = new URLSearchParams();
  params.set("accountName", accountName);
  params.set("resourceGroup", resourceGroupName);
  params.set("subscriptionId", subscriptionId);
  params.set("token", token);

  // There seem to be occasional CORS issues with calling the copilot APIs (/api/tokens/sampledataconnection/v2, for example)
  // For now, since we don't test copilot, we can disable the copilot APIs by setting the feature flag to false.
  params.set("feature.enableCopilot", "false");

  if (iframeSrc) {
    params.set("iframeSrc", iframeSrc);
  }

  return `https://localhost:1234/testExplorer.html?${params.toString()}`;
}

/** Helper class that provides locator methods for TreeNode elements, on top of a Locator */
class TreeNode {
  constructor(
    public element: Locator,
    public frame: Frame,
    public id: string,
  ) { }

  async openContextMenu(): Promise<void> {
    await this.element.click({ button: "right" });
  }

  contextMenuItem(name: string): Locator {
    return this.frame.getByTestId(`TreeNode/ContextMenuItem:${name}`);
  }

  async expand(): Promise<void> {
    // Sometimes, the expand button doesn't load at all, because the node didn't have children when it was initially loaded.
    // Still, clicking the node will trigger loading and expansion. So if the node isn't expanded, we click it.

    // The "aria-expanded" attribute is applied to the TreeItem. But we have the TreeItemLayout selected because the TreeItem contains the child tree as well.
    // So, we need to find the TreeItem that contains this TreeItemLayout.
    const treeNodeContainer = this.frame.getByTestId(`TreeNodeContainer:${this.id}`);

    if ((await treeNodeContainer.getAttribute("aria-expanded")) !== "true") {
      // Click the node, to trigger loading and expansion
      await this.element.locator("css=.fui-TreeItemLayout__expandIcon").click();
    }
    await expect(treeNodeContainer).toHaveAttribute("aria-expanded", "true");
  }
}

export class Editor {
  constructor(
    public frame: Frame,
    public locator: Locator,
  ) { }

  text(): Promise<string | null> {
    return this.locator.evaluate(e => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = e.ownerDocument.defaultView as any;
      if (win._monaco_getEditorContentForElement) {
        return win._monaco_getEditorContentForElement(e);
      }
      return null;
    })
  }

  async setText(text: string): Promise<void> {
    // We trust that Monaco can handle the keyboard, and it's _extremely_ flaky to try and enter text using browser commands.
    // So we use a hook we installed in 'window' to set the content of the editor.

    // NOTE: This function is serialized and sent to the browser for execution
    // So you can't use any variables from the outer scope, but we can send a string (via the second argument to evaluate)
    await this.locator.evaluate((e, content) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = e.ownerDocument.defaultView as any;
      if (win._monaco_setEditorContentForElement) {
        win._monaco_setEditorContentForElement(e, content);
      }
    }, text);

    expect(await this.text()).toEqual(text);
  }
}


export class QueryTab {
  resultsPane: Locator;
  resultsView: Locator;
  executeCTA: Locator;
  errorList: Locator;
  queryStatsList: Locator;
  resultsEditor: Editor;
  resultsTab: Locator;
  queryStatsTab: Locator;
  constructor(
    public frame: Frame,
    public tabId: string,
    public tab: Locator,
    public locator: Locator,
  ) {
    this.resultsPane = locator.getByTestId("QueryTab/ResultsPane");
    this.resultsView = locator.getByTestId("QueryTab/ResultsPane/ResultsView");
    this.executeCTA = locator.getByTestId("QueryTab/ResultsPane/ExecuteCTA");
    this.errorList = locator.getByTestId("QueryTab/ResultsPane/ErrorList");
    this.resultsEditor = new Editor(
      this.frame,
      this.resultsView.getByTestId("EditorReact/Host/Loaded"));
    this.queryStatsList = locator.getByTestId("QueryTab/ResultsPane/ResultsView/QueryStatsList");
    this.resultsTab = this.resultsView.getByTestId("QueryTab/ResultsPane/ResultsView/ResultsTab");
    this.queryStatsTab = this.resultsView.getByTestId("QueryTab/ResultsPane/ResultsView/QueryStatsTab");
  }

  editor(): Editor {
    const locator = this.locator.getByTestId("EditorReact/Host/Loaded");
    return new Editor(this.frame, locator);
  }
}

/** Helper class that provides locator methods for DataExplorer components, on top of a Frame */
export class DataExplorer {
  constructor(public frame: Frame) { }

  tab(tabId: string): Locator {
    return this.frame.getByTestId(`Tab:${tabId}`);
  }

  queryTab(tabId: string): QueryTab {
    const tab = this.tab(tabId);
    const queryTab = tab.getByTestId("QueryTab");
    return new QueryTab(this.frame, tabId, tab, queryTab);
  }

  /** Select the command bar button with the specified label */
  commandBarButton(label: string): Locator {
    return this.frame.getByTestId(`CommandBar/Button:${label}`).and(this.frame.locator("css=button"));
  }

  /** Select the side panel with the specified title */
  panel(title: string): Locator {
    return this.frame.getByTestId(`Panel:${title}`);
  }

  /** Select the tree node with the specified id */
  treeNode(id: string): TreeNode {
    return new TreeNode(this.frame.getByTestId(`TreeNode:${id}`), this.frame, id);
  }

  /** Waits for the panel with the specified title to be open, then runs the provided callback. After the callback completes, waits for the panel to close. */
  async whilePanelOpen(title: string, action: (panel: Locator, okButton: Locator) => Promise<void>): Promise<void> {
    const panel = this.panel(title);
    await panel.waitFor();
    const okButton = panel.getByTestId("Panel/OkButton");
    await action(panel, okButton);
    await panel.waitFor({ state: "detached" });
  }

  /** Waits for the Data Explorer app to load */
  static async waitForExplorer(page: Page) {
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

  /** Opens the Data Explorer app using the specified test account (and optionally, the provided IFRAME src url). */
  static async open(page: Page, testAccount: TestAccount, iframeSrc?: string): Promise<DataExplorer> {
    const url = await getTestExplorerUrl(testAccount, iframeSrc);
    await page.goto(url);
    return DataExplorer.waitForExplorer(page);
  }
}