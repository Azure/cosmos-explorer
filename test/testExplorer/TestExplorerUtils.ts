import { Frame } from "puppeteer";
import { TestExplorerParams } from "./TestExplorerParams";

let testExplorerFrame: Frame;
export const getTestExplorerFrame = async (params?: Map<string, string>): Promise<Frame> => {
  if (testExplorerFrame) {
    return testExplorerFrame;
  }

  const notebooksTestRunnerTenantId = process.env.NOTEBOOKS_TEST_RUNNER_TENANT_ID;
  const notebooksTestRunnerClientId = process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_ID;
  const notebooksTestRunnerClientSecret = process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_SECRET;
  const portalRunnerDatabaseAccount = process.env.PORTAL_RUNNER_DATABASE_ACCOUNT;
  const portalRunnerDatabaseAccountKey = process.env.PORTAL_RUNNER_DATABASE_ACCOUNT_KEY;
  const portalRunnerSubscripton = process.env.PORTAL_RUNNER_SUBSCRIPTION;
  const portalRunnerResourceGroup = process.env.PORTAL_RUNNER_RESOURCE_GROUP;

  const testExplorerUrl = new URL("testExplorer.html", "https://localhost:1234");
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerTenantId,
    encodeURI(notebooksTestRunnerTenantId)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerClientId,
    encodeURI(notebooksTestRunnerClientId)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerClientSecret,
    encodeURI(notebooksTestRunnerClientSecret)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.portalRunnerDatabaseAccount,
    encodeURI(portalRunnerDatabaseAccount)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.portalRunnerDatabaseAccountKey,
    encodeURI(portalRunnerDatabaseAccountKey)
  );
  testExplorerUrl.searchParams.append(TestExplorerParams.portalRunnerSubscripton, encodeURI(portalRunnerSubscripton));
  testExplorerUrl.searchParams.append(
    TestExplorerParams.portalRunnerResourceGroup,
    encodeURI(portalRunnerResourceGroup)
  );

  if (params) {
    for (const key of params.keys()) {
      testExplorerUrl.searchParams.append(key, encodeURI(params.get(key)));
    }
  }

  await page.goto(testExplorerUrl.toString());
  const handle = await page.waitForSelector("iframe");
  return await handle.contentFrame();
};
