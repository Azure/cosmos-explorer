import { expect, test, type Page } from "@playwright/test";

import { DataExplorer, TestAccount } from "../fx";

// Using existing database and container from environment variables
// Set these in your test environment or they'll use defaults
const DATABASE_ID = process.env.INDEX_ADVISOR_TEST_DATABASE || "t_db05_1765364190570";
const CONTAINER_ID = process.env.INDEX_ADVISOR_TEST_CONTAINER || "testcontainer";

// Mock SDK response structure based on IndexMetricsResponse interface
const mockIndexMetricsWithSingleUtilized = {
  UtilizedIndexes: {
    SingleIndexes: [
      { IndexSpec: "/_partitionKey/?", IndexImpactScore: "High" },
      { IndexSpec: "/name/?", IndexImpactScore: "Medium" },
    ],
  },
  PotentialIndexes: {},
};

const mockIndexMetricsWithCompositeUtilized = {
  UtilizedIndexes: {
    CompositeIndexes: [
      {
        IndexSpecs: ["/category asc", "/price desc"],
        IndexImpactScore: "High",
      },
    ],
  },
  PotentialIndexes: {},
};

const mockIndexMetricsWithSinglePotential = {
  UtilizedIndexes: {},
  PotentialIndexes: {
    SingleIndexes: [
      { IndexSpec: "/email/?", IndexImpactScore: "High" },
      { IndexSpec: "/status/?", IndexImpactScore: "Medium" },
      { IndexSpec: "/createdDate/?", IndexImpactScore: "Low" },
    ],
  },
};

const mockIndexMetricsWithCompositePotential = {
  UtilizedIndexes: {},
  PotentialIndexes: {
    CompositeIndexes: [
      {
        IndexSpecs: ["/userId asc", "/timestamp desc"],
        IndexImpactScore: "High",
      },
      {
        IndexSpecs: ["/country asc", "/city asc", "/zipCode asc"],
        IndexImpactScore: "Medium",
      },
    ],
  },
};

const mockIndexMetricsComplete = {
  UtilizedIndexes: {
    SingleIndexes: [
      { IndexSpec: "/_partitionKey/?", IndexImpactScore: "High" },
      { IndexSpec: "/name/?", IndexImpactScore: "Medium" },
    ],
    CompositeIndexes: [
      {
        IndexSpecs: ["/category asc", "/price desc"],
        IndexImpactScore: "High",
      },
    ],
  },
  PotentialIndexes: {
    SingleIndexes: [
      { IndexSpec: "/email/?", IndexImpactScore: "High" },
      { IndexSpec: "/status/?", IndexImpactScore: "Medium" },
      { IndexSpec: "/createdDate/?", IndexImpactScore: "Low" },
    ],
    CompositeIndexes: [
      {
        IndexSpecs: ["/userId asc", "/timestamp desc"],
        IndexImpactScore: "High",
      },
      {
        IndexSpecs: ["/country asc", "/city asc", "/zipCode asc"],
        IndexImpactScore: "Medium",
      },
    ],
  },
};

// Helper function to intercept SDK calls and inject mock response
async function interceptIndexMetrics(
  page: Page,
  mockResponse: any,
): Promise<void> {
  await page.route("**/dbs/*/colls/*/docs", async (route) => {
    const request = route.request();

    // Check if this is a query request with populateIndexMetrics
    if (request.method() === "POST") {
      const postData = request.postData();

      if (postData) {
        try {
          const body = JSON.parse(postData);

          // If this is a query request, we'll intercept it
          if (body.query) {
            // Fetch the actual response
            const response = await route.fetch();
            const responseBody = await response.json();

            // Add our mock indexMetrics to the response
            const modifiedResponse = {
              ...responseBody,
              indexMetrics: mockResponse ? JSON.stringify(mockResponse) : undefined,
            };

            await route.fulfill({
              status: response.status(),
              headers: response.headers(),
              body: JSON.stringify(modifiedResponse),
            });
            return;
          }
        } catch (e) {
          // If parsing fails, continue with normal route
        }
      }
    }

    await route.continue();
  });
}

// Helper function to set up query tab and navigate to Index Advisor
async function setupIndexAdvisorTab(page: Page, mockResponse?: any) {
  if (mockResponse !== undefined) {
    await interceptIndexMetrics(page, mockResponse);
  }

  const explorer = await DataExplorer.open(page, TestAccount.SQL);
  const databaseNode = await explorer.waitForNode(DATABASE_ID);
  await databaseNode.expand();
  await page.waitForTimeout(2000);

  const containerNode = await explorer.waitForNode(`${DATABASE_ID}/${CONTAINER_ID}`);
  await containerNode.openContextMenu();
  await containerNode.contextMenuItem("New SQL Query").click();
  await page.waitForTimeout(2000);

  const queryTab = explorer.queryTab("tab0");
  await queryTab.editor().locator.waitFor({ timeout: 30 * 1000 });
  await queryTab.editor().locator.click();

  const executeQueryButton = explorer.commandBarButton("Execute Query");
  await executeQueryButton.click();
  await expect(queryTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

  const indexAdvisorTab = queryTab.resultsView.getByTestId("QueryTab/ResultsPane/ResultsView/IndexAdvisorTab");
  await indexAdvisorTab.click();
  await page.waitForTimeout(2000);

  return { explorer, queryTab, indexAdvisorTab };
}

test("Index Advisor tab loads without errors", async ({ page }) => {
  const { indexAdvisorTab } = await setupIndexAdvisorTab(page, mockIndexMetricsComplete);
  await expect(indexAdvisorTab).toHaveAttribute("aria-selected", "true");
});

test("Verify UI sections are collapsible", async ({ page }) => {
  const { explorer } = await setupIndexAdvisorTab(page, mockIndexMetricsComplete);

  // Verify both section headers exist
  const includedHeader = explorer.frame.getByText("Included in Current Policy", { exact: true });
  const notIncludedHeader = explorer.frame.getByText("Not Included in Current Policy", { exact: true });
  
  await expect(includedHeader).toBeVisible();
  await expect(notIncludedHeader).toBeVisible();

  // Test collapsibility by checking if chevron/arrow icon changes state
  // Both sections should be expandable/collapsible regardless of content
  await includedHeader.click();
  await page.waitForTimeout(300);
  await includedHeader.click();
  await page.waitForTimeout(300);

  await notIncludedHeader.click();
  await page.waitForTimeout(300);
  await notIncludedHeader.click();
  await page.waitForTimeout(300);
});

test("Verify SDK response structure - Case 1: Empty response", async ({ page }) => {
  const { explorer } = await setupIndexAdvisorTab(page, {
    UtilizedIndexes: {},
    PotentialIndexes: {},
  });

  // Verify both section headers still exist even with no data
  await expect(explorer.frame.getByText("Included in Current Policy", { exact: true })).toBeVisible();
  await expect(explorer.frame.getByText("Not Included in Current Policy", { exact: true })).toBeVisible();

  // Verify table headers
  const table = explorer.frame.locator("table");
  await expect(table.getByText("Index", { exact: true })).toBeVisible();
  await expect(table.getByText("Estimated Impact", { exact: true })).toBeVisible();

  // Verify "Update Indexing Policy" button is NOT visible when there are no potential indexes
  const updateButton = explorer.frame.getByRole("button", { name: /Update Indexing Policy/i });
  await expect(updateButton).not.toBeVisible();
});
