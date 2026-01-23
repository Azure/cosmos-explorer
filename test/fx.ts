import { DefaultAzureCredential } from "@azure/identity";
import { Frame, Locator, Page, expect } from "@playwright/test";
import crypto from "crypto";
import { TestContainerContext } from "./testData";

const RETRY_COUNT = 3;

export interface TestNameOptions {
  length?: number;
  timestampped?: boolean;
  prefixed?: boolean;
}

export function generateUniqueName(baseName: string, options?: TestNameOptions): string {
  const length = options?.length ?? 1;
  const timestamp = options?.timestampped === undefined ? true : options.timestampped;
  const prefixed = options?.prefixed === undefined ? true : options.prefixed;

  const prefix = prefixed ? "t_" : "";
  const suffix = timestamp ? `_${Date.now()}` : "";
  return `${prefix}${baseName}${crypto.randomBytes(length).toString("hex")}${suffix}`;
}

export function getAzureCLICredentials(): DefaultAzureCredential {
  return new DefaultAzureCredential();
}

export async function getAzureCLICredentialsToken(): Promise<string> {
  const credentials = getAzureCLICredentials();
  const token = (await credentials.getToken("https://management.core.windows.net//.default"))?.token || "";
  return token;
}

export enum TestAccount {
  Tables = "Tables",
  Cassandra = "Cassandra",
  Gremlin = "Gremlin",
  Mongo = "Mongo",
  MongoReadonly = "MongoReadOnly",
  Mongo32 = "Mongo32",
  SQL = "SQL",
  SQLReadOnly = "SQLReadOnly",
  SQLContainerCopyOnly = "SQLContainerCopyOnly",
}

export const defaultAccounts: Record<TestAccount, string> = {
  [TestAccount.Tables]: "github-e2etests-tables",
  [TestAccount.Cassandra]: "github-e2etests-cassandra",
  [TestAccount.Gremlin]: "github-e2etests-gremlin",
  [TestAccount.Mongo]: "github-e2etests-mongo",
  [TestAccount.MongoReadonly]: "github-e2etests-mongo-readonly",
  [TestAccount.Mongo32]: "github-e2etests-mongo32",
  [TestAccount.SQL]: "github-e2etests-sql",
  [TestAccount.SQLReadOnly]: "github-e2etests-sql-readonly",
  [TestAccount.SQLContainerCopyOnly]: "github-e2etests-sql-containercopyonly",
};

export const resourceGroupName = process.env.DE_TEST_RESOURCE_GROUP ?? "de-e2e-tests";
export const subscriptionId = process.env.DE_TEST_SUBSCRIPTION_ID ?? "69e02f2d-f059-4409-9eac-97e8a276ae2c";
export const TEST_AUTOSCALE_THROUGHPUT_RU = 1000;
export const TEST_AUTOSCALE_MAX_THROUGHPUT_RU_2K = 2000;
export const TEST_MANUAL_THROUGHPUT_RU_2K = 2000;
export const ONE_MINUTE_MS: number = 60 * 1000;

function tryGetStandardName(accountType: TestAccount) {
  if (accountType === TestAccount.MongoReadonly) {
    return "aisayas-e2e-mongo-readonly";
  }
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

type TestExplorerUrlOptions = {
  iframeSrc?: string;
  enablecontainercopy?: boolean;
};

export async function getTestExplorerUrl(accountType: TestAccount, options?: TestExplorerUrlOptions): Promise<string> {
  const { iframeSrc, enablecontainercopy } = options ?? {};

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

  const nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_TOKEN;
  const nosqlReadOnlyRbacToken = process.env.NOSQL_READONLY_TESTACCOUNT_TOKEN;
  const nosqlContainerCopyRbacToken = process.env.NOSQL_CONTAINERCOPY_TESTACCOUNT_TOKEN;
  const tableRbacToken = process.env.TABLE_TESTACCOUNT_TOKEN;
  const gremlinRbacToken = process.env.GREMLIN_TESTACCOUNT_TOKEN;
  const cassandraRbacToken = process.env.CASSANDRA_TESTACCOUNT_TOKEN;
  const mongoRbacToken = process.env.MONGO_TESTACCOUNT_TOKEN;
  const mongo32RbacToken = process.env.MONGO32_TESTACCOUNT_TOKEN;
  const mongoReadOnlyRbacToken = process.env.MONGO_READONLY_TESTACCOUNT_TOKEN;

  switch (accountType) {
    case TestAccount.SQL:
      if (nosqlRbacToken) {
        params.set("nosqlRbacToken", nosqlRbacToken);
        params.set("enableaaddataplane", "true");
      }
      break;

    case TestAccount.SQLContainerCopyOnly:
      if (nosqlContainerCopyRbacToken) {
        params.set("nosqlRbacToken", nosqlContainerCopyRbacToken);
        params.set("enableaaddataplane", "true");
      }
      if (enablecontainercopy) {
        params.set("enablecontainercopy", "true");
      }
      break;

    case TestAccount.SQLReadOnly:
      if (nosqlReadOnlyRbacToken) {
        params.set("nosqlReadOnlyRbacToken", nosqlReadOnlyRbacToken);
        params.set("enableaaddataplane", "true");
      }
      break;

    case TestAccount.Tables:
      if (tableRbacToken) {
        params.set("tableRbacToken", tableRbacToken);
        params.set("enableaaddataplane", "true");
      }
      break;

    case TestAccount.Gremlin:
      if (gremlinRbacToken) {
        params.set("gremlinRbacToken", gremlinRbacToken);
        params.set("enableaaddataplane", "true");
      }
      break;

    case TestAccount.Cassandra:
      if (cassandraRbacToken) {
        params.set("cassandraRbacToken", cassandraRbacToken);
        params.set("enableaaddataplane", "true");
      }
      break;

    case TestAccount.Mongo:
      if (mongoRbacToken) {
        params.set("mongoRbacToken", mongoRbacToken);
        params.set("enableaaddataplane", "true");
      }
      break;

    case TestAccount.Mongo32:
      if (mongo32RbacToken) {
        params.set("mongo32RbacToken", mongo32RbacToken);
        params.set("enableaaddataplane", "true");
      }
      break;

    case TestAccount.MongoReadonly:
      if (mongoReadOnlyRbacToken) {
        params.set("mongoReadOnlyRbacToken", mongoReadOnlyRbacToken);
        params.set("enableaaddataplane", "true");
      }
      break;
  }

  if (iframeSrc) {
    params.set("iframeSrc", iframeSrc);
  }

  return `https://localhost:1234/testExplorer.html?${params.toString()}`;
}

type DropdownItemExpectations = {
  ariaLabel?: string;
  itemCount?: number;
};

type DropdownItemMatcher = {
  name?: string;
  position?: number;
};

export async function getDropdownItemByNameOrPosition(
  frame: Frame,
  matcher?: DropdownItemMatcher,
  expectedOptions?: DropdownItemExpectations,
): Promise<Locator> {
  const dropdownItemsWrapper = frame.locator("div.ms-Dropdown-items");
  if (expectedOptions?.ariaLabel) {
    expect(await dropdownItemsWrapper.getAttribute("aria-label")).toEqual(expectedOptions.ariaLabel);
  }
  if (expectedOptions?.itemCount) {
    const items = dropdownItemsWrapper.locator("button.ms-Dropdown-item[role='option']");
    await expect(items).toHaveCount(expectedOptions.itemCount);
  }
  const containerDropdownItems = dropdownItemsWrapper.locator("button.ms-Dropdown-item[role='option']");
  if (matcher?.name) {
    return containerDropdownItems.filter({ hasText: matcher.name });
  } else if (matcher?.position !== undefined) {
    return containerDropdownItems.nth(matcher.position);
  }
  // Return first item if no matcher is provided
  return containerDropdownItems.first();
}

/** Helper class that provides locator methods for TreeNode elements, on top of a Locator */
class TreeNode {
  constructor(
    public element: Locator,
    public frame: Frame,
    public id: string,
  ) {}

  async openContextMenu(): Promise<void> {
    await this.element.click({ button: "right" });
  }

  contextMenuItem(name: string): Locator {
    return this.frame.getByTestId(`TreeNode/ContextMenuItem:${name}`);
  }

  async expand(): Promise<void> {
    const treeNodeContainer = this.frame.getByTestId(`TreeNodeContainer:${this.id}`);
    const tree = this.frame.getByTestId(`Tree:${this.id}`);

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    const expandNode = async () => {
      if ((await treeNodeContainer.getAttribute("aria-expanded")) !== "true") {
        // Click the node, to trigger loading and expansion
        await this.element.click();
      }

      // Try three times to wait for the node to expand.
      for (let i = 0; i < RETRY_COUNT; i++) {
        try {
          await tree.waitFor({ state: "visible" });
          // The tree has expanded, let's get out of here
          return true;
        } catch {
          // Just try again
          if ((await treeNodeContainer.getAttribute("aria-expanded")) !== "true") {
            // We might have collapsed the node, try expanding it again, then retry.
            await this.element.click();
          }
        }
      }
      return false;
    };

    if (await expandNode()) {
      return;
    }

    // The tree never expanded. OR, it may have expanded in between when we found the "ExpandIcon" and when we clicked it (it's happened before)
    // So, let's try one more time to expand it.
    if (!(await expandNode())) {
      // The tree never expanded. This is a problem.
      throw new Error(`Node ${this.id} did not expand after clicking it.`);
    }

    // We did it. It took a lot of weird messing around, but we expanded a tree node... I hope.
  }
}

export class Editor {
  constructor(
    public frame: Frame,
    public locator: Locator,
  ) {}

  text(): Promise<string | null> {
    return this.locator.evaluate((e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = e.ownerDocument.defaultView as any;
      if (win._monaco_getEditorContentForElement) {
        return win._monaco_getEditorContentForElement(e);
      }
      return null;
    });
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
    this.resultsEditor = new Editor(this.frame, this.resultsView.getByTestId("EditorReact/Host/Loaded"));
    this.queryStatsList = locator.getByTestId("QueryTab/ResultsPane/ResultsView/QueryStatsList");
    this.resultsTab = this.resultsView.getByTestId("QueryTab/ResultsPane/ResultsView/ResultsTab");
    this.queryStatsTab = this.resultsView.getByTestId("QueryTab/ResultsPane/ResultsView/QueryStatsTab");
  }

  editor(): Editor {
    const locator = this.locator.getByTestId("EditorReact/Host/Loaded");
    return new Editor(this.frame, locator);
  }
}

export class DocumentsTab {
  documentsFilter: Locator;
  documentsListPane: Locator;
  documentResultsPane: Locator;
  resultsEditor: Editor;
  loadMoreButton: Locator;
  filterInput: Locator;
  filterButton: Locator;

  constructor(
    public frame: Frame,
    public tabId: string,
    public tab: Locator,
    public locator: Locator,
  ) {
    this.documentsFilter = this.locator.getByTestId("DocumentsTab/Filter");
    this.documentsListPane = this.locator.getByTestId("DocumentsTab/DocumentsPane");
    this.documentResultsPane = this.locator.getByTestId("DocumentsTab/ResultsPane");
    this.resultsEditor = new Editor(this.frame, this.documentResultsPane.getByTestId("EditorReact/Host/Loaded"));
    this.loadMoreButton = this.documentsListPane.getByTestId("DocumentsTab/LoadMore");
    this.filterInput = this.documentsFilter.getByTestId("DocumentsTab/FilterInput");
    this.filterButton = this.documentsFilter.getByTestId("DocumentsTab/ApplyFilter");
  }

  async setFilter(text: string) {
    await this.filterInput.fill(text);
  }
}

type PanelOpenOptions = {
  closeTimeout?: number;
};

export enum CommandBarButton {
  Save = "Save",
  Delete = "Delete",
  Execute = "Execute",
  ExecuteQuery = "Execute Query",
  UploadItem = "Upload Item",
  NewDocument = "New Document",
}

/** Helper class that provides locator methods for DataExplorer components, on top of a Frame */
export class DataExplorer {
  constructor(public frame: Frame) {}

  tab(tabId: string): Locator {
    return this.frame.getByTestId(`Tab:${tabId}`);
  }

  queryTab(tabId: string): QueryTab {
    const tab = this.tab(tabId);
    const queryTab = tab.getByTestId("QueryTab");
    return new QueryTab(this.frame, tabId, tab, queryTab);
  }

  documentsTab(tabId: string): DocumentsTab {
    const tab = this.tab(tabId);
    const documentsTab = tab.getByTestId("DocumentsTab");
    return new DocumentsTab(this.frame, tabId, tab, documentsTab);
  }

  /** Select the primary global command button.
   *
   * There's only a single "primary" button, but we still require you to pass the label to confirm you're selecting the right button.
   */
  async globalCommandButton(label: string): Promise<Locator> {
    await this.frame.getByTestId("GlobalCommands").click();
    return this.frame.getByRole("menuitem", { name: label });
  }

  /** Select the command bar button with the specified label */
  commandBarButton(commandBarButton: CommandBarButton): Locator {
    return this.frame.getByTestId(`CommandBar/Button:${commandBarButton}`).and(this.frame.locator("css=button"));
  }

  dialogButton(label: string): Locator {
    return this.frame.getByTestId(`DialogButton:${label}`).and(this.frame.locator("css=button"));
  }

  /** Select the side panel with the specified title */
  panel(title: string): Locator {
    return this.frame.getByTestId(`Panel:${title}`);
  }

  async waitForNode(treeNodeId: string): Promise<TreeNode> {
    const node = this.treeNode(treeNodeId);

    // Is the node already visible?
    if (await node.element.isVisible()) {
      return node;
    }

    // No, try refreshing the tree
    const refreshButton = this.frame.getByTestId("Sidebar/RefreshButton");
    await refreshButton.click();

    // Try a few times to find the node
    for (let i = 0; i < RETRY_COUNT; i++) {
      try {
        await node.element.waitFor();
        return node;
      } catch {
        // Just try again
      }
    }

    // We tried 3 times, but the node never appeared
    throw new Error(`Node ${treeNodeId} not found and did not appear after refreshing.`);
  }

  async waitForContainerNode(databaseId: string, containerId: string): Promise<TreeNode> {
    const databaseNode = await this.waitForNode(databaseId);

    // The container node may be auto-expanded. Wait 5s for that to happen
    try {
      const containerNode = this.treeNode(`${databaseId}/${containerId}`);
      await containerNode.element.waitFor({ state: "visible", timeout: 5 * 1000 });
      return containerNode;
    } catch {
      // It didn't auto-expand, that's fine, we'll expand it ourselves
    }

    // Ok, expand the database node.
    await databaseNode.expand();

    return await this.waitForNode(`${databaseId}/${containerId}`);
  }

  async waitForContainerItemsNode(databaseId: string, containerId: string): Promise<TreeNode> {
    return await this.waitForNode(`${databaseId}/${containerId}/Items`);
  }

  async waitForContainerDocumentsNode(databaseId: string, containerId: string): Promise<TreeNode> {
    return await this.waitForNode(`${databaseId}/${containerId}/Documents`);
  }

  async waitForCommandBarButton(label: CommandBarButton, timeout?: number): Promise<Locator> {
    const commandBar = this.commandBarButton(label);
    await commandBar.waitFor({ state: "visible", timeout });
    return commandBar;
  }

  async waitForDialogButton(label: string, timeout?: number): Promise<Locator> {
    const dialogButton = this.dialogButton(label);
    await dialogButton.waitFor({ timeout });
    return dialogButton;
  }

  /** Select the tree node with the specified id */
  treeNode(id: string): TreeNode {
    return new TreeNode(this.frame.getByTestId(`TreeNode:${id}`), this.frame, id);
  }

  /** Waits for the panel with the specified title to be open, then runs the provided callback. After the callback completes, waits for the panel to close. */
  async whilePanelOpen(
    title: string,
    action: (panel: Locator, okButton: Locator) => Promise<void>,
    options?: PanelOpenOptions,
  ): Promise<void> {
    options ||= {};

    const panel = this.panel(title);
    await panel.waitFor();
    const okButton = panel.getByTestId("Panel/OkButton");
    await action(panel, okButton);
    await panel.waitFor({ state: "detached", timeout: options.closeTimeout });
  }

  /** Opens the Scale & Settings panel for the specified container */
  async openScaleAndSettings(context: TestContainerContext): Promise<void> {
    const containerNode = await this.waitForContainerNode(context.database.id, context.container.id);
    await containerNode.expand();

    // // refresh tree to remove deleted database
    // const consoleMessages = await this.getNotificationConsoleMessages();
    // const refreshButton = this.frame.getByTestId("Sidebar/RefreshButton");
    // await refreshButton.click();
    // await expect(consoleMessages).toContainText("Successfully refreshed databases", {
    //   timeout: ONE_MINUTE_MS,
    // });
    // await this.collapseNotificationConsole();

    const scaleAndSettingsButton = this.frame.getByTestId(
      `TreeNode:${context.database.id}/${context.container.id}/Scale & Settings`,
    );
    await scaleAndSettingsButton.click();
  }

  /** Gets the console message element */
  getConsoleHeaderStatus(): Locator {
    return this.frame.getByTestId("notification-console/header-status");
  }

  async expandNotificationConsole(): Promise<void> {
    await this.setNotificationConsoleExpanded(true);
  }

  async collapseNotificationConsole(): Promise<void> {
    await this.setNotificationConsoleExpanded(false);
  }

  async setNotificationConsoleExpanded(expanded: boolean): Promise<void> {
    const notificationConsoleToggleButton = this.frame.getByTestId("NotificationConsole/ExpandCollapseButton");
    const alt = await notificationConsoleToggleButton.locator("img").getAttribute("alt");

    // When expanded, the icon says "Collapse icon"
    if (expanded && alt === "Expand icon") {
      await notificationConsoleToggleButton.click();
    } else if (!expanded && alt === "Collapse icon") {
      await notificationConsoleToggleButton.click();
    }
  }

  async getNotificationConsoleMessages(): Promise<Locator> {
    await this.setNotificationConsoleExpanded(true);
    return this.frame.getByTestId("NotificationConsole/Contents");
  }

  async getDropdownItemByName(name: string, ariaLabel?: string): Promise<Locator> {
    const dropdownItemsWrapper = this.frame.locator("div.ms-Dropdown-items");
    if (ariaLabel) {
      expect(await dropdownItemsWrapper.getAttribute("aria-label")).toEqual(ariaLabel);
    }
    const containerDropdownItems = dropdownItemsWrapper.locator("button.ms-Dropdown-item[role='option']");
    return containerDropdownItems.filter({ hasText: name });
  }

  /** Waits for the Data Explorer app to load */
  static async waitForExplorer(page: Page, options?: TestExplorerUrlOptions): Promise<DataExplorer> {
    const iframeElement = await page.getByTestId("DataExplorerFrame").elementHandle();
    if (iframeElement === null) {
      throw new Error("Explorer iframe not found");
    }

    const explorerFrame = await iframeElement.contentFrame();

    if (explorerFrame === null) {
      throw new Error("Explorer frame not found");
    }

    if (!options?.enablecontainercopy) {
      await explorerFrame?.getByTestId("DataExplorerRoot").waitFor();
    }

    return new DataExplorer(explorerFrame);
  }

  /** Opens the Data Explorer app using the specified test account (and optionally, the provided IFRAME src url). */
  static async open(page: Page, testAccount: TestAccount, iframeSrc?: string): Promise<DataExplorer> {
    const url = await getTestExplorerUrl(testAccount, { iframeSrc });
    await page.goto(url);
    return DataExplorer.waitForExplorer(page);
  }
}

export async function waitForApiResponse(
  page: Page,
  urlPattern: string,
  method?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payloadValidator?: (payload: any) => boolean,
) {
  try {
    // Check if page is still valid before waiting
    if (page.isClosed()) {
      throw new Error(`Page is closed, cannot wait for API response: ${urlPattern}`);
    }

    return page.waitForResponse(
      async (response) => {
        const request = response.request();

        if (!request.url().includes(urlPattern)) {
          return false;
        }

        if (method && request.method() !== method) {
          return false;
        }

        if (payloadValidator && (request.method() === "POST" || request.method() === "PUT")) {
          const postData = request.postData();
          if (postData) {
            try {
              const payload = JSON.parse(postData);
              return payloadValidator(payload);
            } catch {
              return false;
            }
          }
        }
        return true;
      },
      { timeout: 60 * 1000 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Target page, context or browser has been closed")) {
      console.warn("Page was closed while waiting for API response:", urlPattern);
      throw new Error(`Page closed while waiting for API response: ${urlPattern}`);
    }
    throw error;
  }
}
export async function interceptAndInspectApiRequest(
  page: Page,
  urlPattern: string,
  method: string = "POST",
  error: Error,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorValidator: (url?: string, payload?: any) => boolean,
): Promise<void> {
  await page.route(
    (url) => url.pathname.includes(urlPattern),
    async (route, request) => {
      if (request.method() !== method) {
        await route.continue();
        return;
      }
      const postData = request.postData();
      if (postData) {
        try {
          const payload = JSON.parse(postData);
          if (errorValidator && errorValidator(request.url(), payload)) {
            await route.fulfill({
              status: 409,
              contentType: "application/json",
              body: JSON.stringify({
                code: "Conflict",
                message: error.message,
              }),
            });
            return;
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes("not allowed")) {
            throw err;
          }
        }
      }

      await route.continue();
    },
  );
}

export class ContainerCopy {
  constructor(
    public frame: Frame,
    public wrapper: Locator,
  ) {}

  static async waitForContainerCopy(page: Page): Promise<ContainerCopy> {
    const explorerFrame = await DataExplorer.waitForExplorer(page, { enablecontainercopy: true });
    const containerCopyWrapper = explorerFrame.frame.locator("div#containerCopyWrapper");
    return new ContainerCopy(explorerFrame.frame, containerCopyWrapper);
  }

  static async open(page: Page, testAccount: TestAccount, iframeSrc?: string): Promise<ContainerCopy> {
    const url = await getTestExplorerUrl(testAccount, { iframeSrc, enablecontainercopy: true });
    await page.goto(url);
    return ContainerCopy.waitForContainerCopy(page);
  }
}
