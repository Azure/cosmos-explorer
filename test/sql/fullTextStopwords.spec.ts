import { APIRequestContext, APIResponse, FrameLocator, Locator, Page, expect, test } from "@playwright/test";
import { randomUUID } from "crypto";
import { setTimeout as delay } from "timers/promises";

// Opt-in: an existing provisioned test database, ARM token, and database-scoped data token.
// This spec creates/deletes only its uniquely named 400 RU/s container, never the database or account.
const accountName = process.env.FULL_TEXT_TEST_ACCOUNT;
const databaseId = process.env.FULL_TEXT_TEST_DATABASE;
const subscriptionId = process.env.FULL_TEXT_TEST_SUBSCRIPTION;
const resourceGroup = process.env.FULL_TEXT_TEST_RESOURCE_GROUP;
const tenantId = process.env.FULL_TEXT_TEST_TENANT;
const armToken = process.env.FULL_TEXT_TEST_ARM_TOKEN;
const dataToken = process.env.FULL_TEXT_TEST_DATA_TOKEN;
const origin = process.env.FULL_TEXT_TEST_ORIGIN ?? "https://localhost:1234";
const enabled = !!(accountName && databaseId && subscriptionId && resourceGroup && tenantId && armToken && dataToken);
test.use({ trace: "off", video: "off", screenshot: "off", launchOptions: { args: [] } });

test.describe.serial("Live localhost full-text stopwords", () => {
  test.skip(!enabled, "Set FULL_TEXT_TEST_* variables for an explicitly approved live fixture.");
  const containerId = `stopwords-e2e-${randomUUID()}`;
  const accountPath = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`;
  const containerUrl = `https://management.azure.com${accountPath}/sqlDatabases/${databaseId}/containers/${containerId}?api-version=2025-11-01-preview`;
  const headers = { Authorization: `Bearer ${armToken}` };
  let page: Page;
  let frame: FrameLocator;
  let request: APIRequestContext;

  const expectCompactWordControls = async (group: Locator): Promise<void> => {
    for (const control of [
      group.getByRole("combobox", { name: "Stopword list" }),
      group.getByRole("textbox", { name: "Additional stopwords" }),
      group.getByRole("textbox", { name: "Words to keep" }),
    ]) {
      const width = await control.evaluate(
        (element) => (element.closest(".fui-Dropdown, .fui-Textarea") ?? element).getBoundingClientRect().width,
      );
      expect(width).toBeLessThanOrEqual(240);
    }
  };

  const waitForDeletion = async (response: APIResponse): Promise<void> => {
    const operationUrl = response.headers()["azure-asyncoperation"] ?? response.headers()["location"];
    if (!operationUrl) {
      expect(response.status()).not.toBe(202);
      return;
    }
    expect(new URL(operationUrl).origin).toBe("https://management.azure.com");
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      const progress = await request.get(operationUrl, { headers });
      expect(progress.ok()).toBe(true);
      if (progress.status() === 204) {
        return;
      }
      const body = await progress.json();
      if (body.status === "Failed" || body.status === "Canceled") {
        throw new Error(`Container cleanup failed: ${JSON.stringify(body.error)}`);
      }
      if (body.status === "Succeeded" || (progress.status() === 200 && !body.status)) {
        return;
      }
      await delay(2000);
    }
    throw new Error(`Timed out deleting owned container ${containerId}`);
  };

  test.beforeAll(async ({ browser, playwright }) => {
    expect(["localhost", "127.0.0.1"]).toContain(new URL(origin).hostname);
    request = await playwright.request.newContext();
    const accountResponse = await request.get(
      `https://management.azure.com${accountPath}?api-version=2025-11-01-preview`,
      { headers },
    );
    expect(accountResponse.status()).toBe(200);
    const account = await accountResponse.json();
    const capabilities: string[] = account.properties.capabilities.map(
      (capability: { name: string }) => capability.name,
    );
    expect(capabilities).not.toContain("EnableServerless");
    expect(capabilities).toContain("EnableNoSQLFullTextSearchPreviewFeatures");
    page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
    frame = page.frameLocator('[data-test="DataExplorerFrame"]');
    await page.route(`${origin}/config.json`, (route) =>
      route.fulfill({
        json: { allowedBackendEndpoints: [origin], PORTAL_BACKEND_ENDPOINT: origin, PROXY_PATH: "/proxy" },
      }),
    );
    await page.addInitScript(
      (config) => {
        if (location.origin === config.expectedOrigin && location.pathname === "/testExplorer.html") {
          Object.assign(window, { cosmosExplorerTestConfig: config });
        }
      },
      {
        expectedOrigin: origin,
        accountName,
        databaseId,
        subscriptionId,
        resourceGroup,
        tenantId,
        authorizationToken: armToken,
        aadToken: dataToken,
        iframeSrc: "explorer.html?platform=Portal&disablePortalInitCache&feature.enableCopilot=false",
      },
    );
    await page.goto(`${origin}/testExplorer.html`);
    await frame.getByText(databaseId!, { exact: true }).first().waitFor({ timeout: 90000 });
  });

  test.afterAll(async () => {
    if (request) {
      try {
        const existing = await request.get(containerUrl, { headers });
        if (existing.status() !== 404) {
          expect(existing.status()).toBe(200);
          const deletion = await request.delete(containerUrl, { headers });
          expect([200, 202, 204]).toContain(deletion.status());
          await waitForDeletion(deletion);
          await expect
            .poll(async () => (await request.get(containerUrl, { headers })).status(), {
              timeout: 180000,
              intervals: [1000, 2000, 5000],
            })
            .toBe(404);
        }
      } finally {
        await request.dispose();
        await page?.close();
      }
    }
  });

  test("creates losslessly, locks indexed analysis, validates edits, saves and discards", async () => {
    const testInfo = test.info();
    await frame.getByTestId("GlobalCommands").click();
    await frame.getByRole("menuitem", { name: "New Container", exact: true }).click();
    const panel = frame.getByTestId("Panel:New Container");
    await panel.getByRole("radio", { name: "Use existing database" }).check();
    await panel.getByRole("combobox", { name: "Choose an existing database" }).click();
    await frame.getByRole("option", { name: databaseId!, exact: true }).click();
    await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill(containerId);
    await panel.getByRole("textbox", { name: "Partition key", exact: true }).fill("/pk");
    await panel.getByRole("radio", { name: /Manual$/ }).check();
    await panel.getByRole("spinbutton", { name: "Container Required RU/s" }).fill("400");
    await panel.getByRole("button", { name: "Container Full Text Search Policy", exact: true }).click();
    await panel.getByRole("combobox", { name: /^Default language/ }).click();
    for (const language of [
      "English (US)",
      "French",
      "German",
      "Spanish",
      "Italian",
      "Portuguese (Portugal)",
      "Portuguese (Brazil)",
    ]) {
      await expect(frame.getByRole("option", { name: language, exact: true })).toBeVisible();
    }
    await frame.getByRole("option", { name: "English (US)", exact: true }).click();
    await panel.getByRole("checkbox", { name: "Customize stopwords with standard analysis" }).check();
    const defaults = panel.getByRole("group", { name: "Default stopwords" });
    await defaults.getByRole("textbox", { name: "Additional stopwords" }).fill("cosmos");
    await defaults.getByRole("textbox", { name: "Words to keep" }).fill("the");
    await expectCompactWordControls(defaults);
    expect((await panel.getByRole("combobox", { name: /^Default language/ }).boundingBox())?.width).toBeLessThanOrEqual(
      240,
    );
    await panel.getByRole("button", { name: "Add full text path" }).click();
    await expect(panel.getByRole("textbox", { name: /^Path/ })).toBeFocused();
    await panel.getByRole("textbox", { name: /^Path/ }).fill("/text");
    expect((await panel.getByRole("textbox", { name: /^Path/ }).boundingBox())?.width).toBeLessThanOrEqual(320);
    const pathHeader = panel.getByRole("button", { name: /^\/text Inherits defaults/ });
    await expect(pathHeader.locator("button, [role=button]")).toHaveCount(0);
    await pathHeader.press("Space");
    await expect(panel.getByRole("textbox", { name: /^Path/ })).toBeHidden();
    await expect(pathHeader).toHaveAttribute("aria-expanded", "false");
    await pathHeader.press("Enter");
    await expect(panel.getByRole("textbox", { name: /^Path/ })).toHaveValue("/text");
    await pathHeader.press("Tab");
    await expect(panel.getByRole("button", { name: "Delete full text path 1", exact: true })).toBeFocused();
    await panel.getByRole("button", { name: "Add full text path" }).click();
    await expect(panel.getByRole("textbox", { name: /^Path/ }).nth(1)).toBeFocused();
    await panel.getByRole("button", { name: "Delete full text path 2", exact: true }).click();
    await expect(panel.getByRole("button", { name: "Add full text path", exact: true })).toBeFocused();
    await expect(panel.getByRole("textbox", { name: /^Path/ })).toHaveValue("/text");
    await panel.getByRole("button", { name: "Add full text path", exact: true }).click();
    await expect(panel.getByRole("textbox", { name: /^Path/ }).nth(1)).toBeFocused();
    await panel.getByRole("button", { name: "Delete full text path 2", exact: true }).click();
    await panel.getByTestId("Panel/OkButton").click();
    await panel.waitFor({ state: "detached", timeout: 180000 });
    const createdResponse = await request.get(containerUrl, { headers });
    expect(createdResponse.status()).toBe(200);
    const created = (await createdResponse.json()).properties.resource;
    expect(created.fullTextPolicy).toMatchObject({
      package: "standard",
      defaultSpec: {
        language: "en-US",
        stopWordListKind: "basic",
        addStopWords: ["cosmos"],
        removeStopWords: ["the"],
        tokenizer: "word",
        filters: ["lowercase", "stop"],
      },
      fullTextPaths: [{ path: "/text" }],
    });

    const node = frame.getByTestId(`TreeNode:${databaseId}/${containerId}`);
    await node.waitFor({ timeout: 60000 });
    if (
      (await frame.getByTestId(`TreeNodeContainer:${databaseId}/${containerId}`).getAttribute("aria-expanded")) !==
      "true"
    ) {
      await node.click();
    }
    await frame.getByTestId(`TreeNode:${databaseId}/${containerId}/Scale & Settings`).click();
    await page.mouse.move(1350, 900);
    await page.keyboard.press("Escape");
    await frame.getByRole("tab", { name: "Scale", exact: true }).focus();
    await frame.getByRole("tab", { name: "Container Policies", exact: true }).click();
    const settingsDefaults = frame.getByRole("group", { name: "Default stopwords" });
    await expect(settingsDefaults.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue("cosmos");
    await expect(settingsDefaults.getByRole("textbox", { name: "Additional stopwords" })).toBeDisabled();
    await expectCompactWordControls(settingsDefaults);
    await expect(frame.getByRole("textbox", { name: /^Path/ })).toBeDisabled();
    await frame.getByRole("button", { name: "Add full text path" }).click();
    const save = frame.getByTestId("CommandBar/Button:Save").and(frame.locator("button"));
    await expect(save).toBeDisabled();
    await frame.getByRole("textbox", { name: /^Path/ }).nth(1).fill("/other");
    await frame.getByRole("checkbox", { name: "Inherit the container's language and stopwords" }).nth(1).uncheck();
    const other = frame.getByRole("group", { name: "Stopwords for /other" });
    await expectCompactWordControls(other);
    await other.getByRole("combobox", { name: "Stopword list" }).click();
    await frame.getByRole("option", { name: "Basic", exact: true }).click();
    await other.getByRole("textbox", { name: "Additional stopwords" }).fill("invalid phrase");
    await expect(save).toBeDisabled();
    const otherHeader = frame.getByRole("button", { name: /^\/other Overrides defaults/ });
    await otherHeader.press("Space");
    await expect(otherHeader).toContainText("Needs attention");
    await expect(other).toBeHidden();
    await expect(save).toBeDisabled();
    await otherHeader.press("Enter");
    await expect(other.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue("invalid phrase");
    await other.getByRole("textbox", { name: "Additional stopwords" }).fill("galaxy");
    await expect(save).toBeEnabled();
    await save.click();
    await expect(frame.getByTestId("notification-console/header-status")).toContainText(
      `Successfully updated container ${containerId}`,
      { timeout: 180000 },
    );
    await expect(save).toBeDisabled({ timeout: 180000 });
    const updated = (await (await request.get(containerUrl, { headers })).json()).properties.resource;
    expect(updated.fullTextPolicy.defaultSpec).toEqual(created.fullTextPolicy.defaultSpec);
    expect(updated.fullTextPolicy.fullTextPaths[1].addStopWords).toEqual(["galaxy"]);
    expect(updated.indexingPolicy.fullTextIndexes).toEqual([{ path: "/text" }]);
    await other.getByRole("textbox", { name: "Additional stopwords" }).fill("discardme");
    await frame.getByTestId("CommandBar/Button:Discard").and(frame.locator("button")).click();
    await expect(other.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue("galaxy");
    await page.screenshot({ path: testInfo.outputPath("settings-roundtrip.png"), animations: "disabled" });
  });

  test("applies additional stopwords and words to keep to real uploaded items and browser queries", async () => {
    const testInfo = test.info();
    await frame.getByTestId(`TreeNode:${databaseId}/${containerId}/Items`).click();
    await page.mouse.move(1350, 900);
    await frame.getByTestId("CommandBar/Button:Upload Item").and(frame.locator("button")).click();
    await frame.locator("#importFileInput").setInputFiles({
      name: "stopword-documents.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify([
          { id: "a", pk: "one", text: "cosmos orbit" },
          { id: "b", pk: "one", text: "orbit" },
          { id: "c", pk: "one", text: "the moon" },
          { id: "d", pk: "one", text: "moon" },
        ]),
      ),
    });
    await frame.getByTestId("Panel/OkButton").click();
    await expect(frame.getByTestId("file-upload-status")).toContainText("4 created, 0 throttled, 0 errors", {
      timeout: 90000,
    });
    await frame.getByLabel("Close Upload Items").click();
    await frame.getByTestId(`TreeNode:${databaseId}/${containerId}`).click({ button: "right" });
    await frame.getByRole("menu").getByRole("menuitem", { name: "New SQL Query", exact: true }).click();
    const editor = frame.getByTestId("EditorReact/Host/Loaded").filter({ visible: true }).first();
    await editor.waitFor();
    for (const [term, expected] of [
      ["cosmos orbit", ["a", "b"]],
      ["the moon", ["c"]],
    ] as const) {
      const query = `SELECT VALUE c.id FROM c WHERE FullTextContains(c.text, '${term}')`;
      await editor.evaluate((element, value) => {
        const win = element.ownerDocument.defaultView as Window & {
          _monaco_setEditorContentForElement?: (element: Element, value: string) => void;
        };
        if (!win?._monaco_setEditorContentForElement) {
          throw new Error("Monaco test input hook is unavailable");
        }
        win._monaco_setEditorContentForElement(element, value);
      }, query);
      const responsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.request().headers()["x-ms-documentdb-isquery"]?.toLowerCase() === "true" &&
          response.request().postDataJSON()?.query === query,
        { timeout: 90000 },
      );
      await frame.getByTestId("CommandBar/Button:Execute Query").and(frame.locator("button")).click();
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      const documents = (await response.json()).Documents;
      expect(Array.isArray(documents)).toBe(true);
      const results = frame.getByTestId("QueryTab/ResultsPane/ResultsView").getByTestId("EditorReact/Host/Loaded");
      await results.waitFor({ timeout: 90000 });
      const readResults = () =>
        results.evaluate((element) => {
          const win = element.ownerDocument.defaultView as Window & {
            _monaco_getEditorContentForElement?: (element: Element) => string;
          };
          if (!win?._monaco_getEditorContentForElement) {
            throw new Error("Monaco test output hook is unavailable");
          }
          return win._monaco_getEditorContentForElement(element);
        });
      await expect.poll(async () => JSON.parse(await readResults())).toEqual(documents);
      const actual = JSON.parse(await readResults());
      await testInfo.attach(`query-${term}`, {
        body: JSON.stringify({ query, expected, actual }),
        contentType: "application/json",
      });
      await page.screenshot({
        path: testInfo.outputPath(`query-${term.replace(" ", "-")}.png`),
        animations: "disabled",
      });
      expect.soft(actual.sort(), query).toEqual([...expected]);
    }
  });
});
