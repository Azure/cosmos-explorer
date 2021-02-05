import { Frame } from "puppeteer";
import { TestExplorerParams } from "./TestExplorerParams";
import { ClientSecretCredential } from "@azure/identity";
import { ApiKind } from "../../src/Contracts/DataModels";

let testExplorerFrame: Frame;
export const getTestExplorerFrame = async (apiKind?: ApiKind, params?: Map<string, string>): Promise<Frame> => {
  if (testExplorerFrame) {
    return testExplorerFrame;
  }

  let portalRunnerDatabaseAccount: string;
  let portalRunnerDatabaseAccountKey: string;

  switch (apiKind) {
    case ApiKind.MongoDB:
      portalRunnerDatabaseAccount = process.env.PORTAL_RUNNER_MONGO_DATABASE_ACCOUNT;
      portalRunnerDatabaseAccountKey = process.env.PORTAL_RUNNER_MONGO_DATABASE_ACCOUNT_KEY;
      break;
    default:
      portalRunnerDatabaseAccount = process.env.PORTAL_RUNNER_DATABASE_ACCOUNT;
      portalRunnerDatabaseAccountKey = process.env.PORTAL_RUNNER_DATABASE_ACCOUNT_KEY;
  }

  // eslint-disable-next-line no-console
  console.log("portalRunnerDatabaseAccount:" + portalRunnerDatabaseAccount);
  // eslint-disable-next-line no-console
  console.log("portalRunnerDatabaseAccountKey:" + portalRunnerDatabaseAccountKey);

  const notebooksTestRunnerTenantId = process.env.NOTEBOOKS_TEST_RUNNER_TENANT_ID;
  const notebooksTestRunnerClientId = process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_ID;
  const notebooksTestRunnerClientSecret = process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_SECRET;
  const portalRunnerSubscripton = process.env.PORTAL_RUNNER_SUBSCRIPTION;
  const portalRunnerResourceGroup = process.env.PORTAL_RUNNER_RESOURCE_GROUP;

  const credentials = new ClientSecretCredential(
    notebooksTestRunnerTenantId,
    notebooksTestRunnerClientId,
    notebooksTestRunnerClientSecret
  );

  const { token } = await credentials.getToken("https://management.core.windows.net/.default");

  const testExplorerUrl = new URL("testExplorer.html", "https://localhost:1234");
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
  testExplorerUrl.searchParams.append(TestExplorerParams.token, encodeURI(token));

  if (params) {
    for (const key of params.keys()) {
      testExplorerUrl.searchParams.append(key, encodeURI(params.get(key)));
    }
  }

  await page.goto(testExplorerUrl.toString());
  const handle = await page.waitForSelector("iframe");
  return await handle.contentFrame();
};
