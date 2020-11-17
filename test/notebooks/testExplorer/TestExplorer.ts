import { MessageTypes } from "../../../src/Contracts/ExplorerContracts";
import "../../../less/hostedexplorer.less";
import { TestExplorerParams } from "./TestExplorerParams";
import { ClientSecretCredential } from "@azure/identity";
import { DatabaseAccountsGetResponse } from "@azure/arm-cosmosdb/esm/models";
import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import * as msRest from "@azure/ms-rest-js";
import * as ViewModels from "../../../src/Contracts/ViewModels";

class CustomSigner implements msRest.ServiceClientCredentials {
  private token: string;
  constructor(token: string) {
    this.token = token;
  }

  async signRequest(webResource: msRest.WebResourceLike): Promise<msRest.WebResourceLike> {
    webResource.headers.set("authorization", `bearer ${this.token}`);
    return webResource;
  }
}

const handleMessage = (event: MessageEvent): void => {
  if (event.data.type === MessageTypes.InitTestExplorer) {
    sendMessageToExplorerFrame(event.data);
  }
};

const AADLogin = async (
  notebooksTestRunnerApplicationId: string,
  notebooksTestRunnerClientId: string,
  notebooksTestRunnerClientSecret: string
): Promise<string> => {
  const credentials = new ClientSecretCredential(
    notebooksTestRunnerApplicationId,
    notebooksTestRunnerClientId,
    notebooksTestRunnerClientSecret
  );
  const token = await credentials.getToken("https://management.core.windows.net/.default");
  return token.token;
};

const getDatabaseAccount = async (
  token: string,
  notebooksAccountSubscriptonId: string,
  notebooksAccountResourceGroup: string,
  notebooksAccountName: string
): Promise<DatabaseAccountsGetResponse> => {
  const client = new CosmosDBManagementClient(new CustomSigner(token), notebooksAccountSubscriptonId);
  return await client.databaseAccounts.get(notebooksAccountResourceGroup, notebooksAccountName);
};

const sendMessageToExplorerFrame = (data: unknown): void => {
  const explorerFrame = document.getElementById("explorerMenu") as HTMLIFrameElement;

  explorerFrame &&
    explorerFrame.contentDocument &&
    explorerFrame.contentDocument.referrer &&
    explorerFrame.contentWindow.postMessage(
      {
        signature: "pcIframe",
        data: data
      },
      explorerFrame.contentDocument.referrer || window.location.href
    );
};

const initTestExplorer = async (): Promise<void> => {
  window.addEventListener("message", handleMessage, false);

  const urlSearchParams = new URLSearchParams(window.location.search);
  const notebooksTestRunnerTenantId = decodeURIComponent(
    urlSearchParams.get(TestExplorerParams.notebooksTestRunnerTenantId)
  );
  const notebooksTestRunnerClientId = decodeURIComponent(
    urlSearchParams.get(TestExplorerParams.notebooksTestRunnerClientId)
  );
  const notebooksTestRunnerClientSecret = decodeURIComponent(
    urlSearchParams.get(TestExplorerParams.notebooksTestRunnerClientSecret)
  );
  const portalRunnerDatabaseAccount = decodeURIComponent(
    urlSearchParams.get(TestExplorerParams.portalRunnerDatabaseAccount)
  );
  const portalRunnerDatabaseAccountKey = decodeURIComponent(
    urlSearchParams.get(TestExplorerParams.portalRunnerDatabaseAccountKey)
  );
  const portalRunnerSubscripton = decodeURIComponent(urlSearchParams.get(TestExplorerParams.portalRunnerSubscripton));
  const portalRunnerResourceGroup = decodeURIComponent(
    urlSearchParams.get(TestExplorerParams.portalRunnerResourceGroup)
  );

  const token = await AADLogin(
    notebooksTestRunnerTenantId,
    notebooksTestRunnerClientId,
    notebooksTestRunnerClientSecret
  );
  const databaseAccount = await getDatabaseAccount(
    token,
    portalRunnerSubscripton,
    portalRunnerResourceGroup,
    portalRunnerDatabaseAccount
  );

  const initTestExplorerContent = {
    type: MessageTypes.InitTestExplorer,
    inputs: {
      databaseAccount: databaseAccount,
      subscriptionId: portalRunnerSubscripton,
      resourceGroup: portalRunnerResourceGroup,
      authorizationToken: `Bearer ${token}`,
      features: {},
      hasWriteAccess: true,
      csmEndpoint: "https://management.azure.com",
      dnsSuffix: "documents.azure.com",
      serverId: "prod1",
      extensionEndpoint: "/proxy",
      subscriptionType: 3,
      quotaId: "Internal_2014-09-01",
      addCollectionDefaultFlight: "2",
      isTryCosmosDBSubscription: false,
      masterKey: portalRunnerDatabaseAccountKey,
      loadDatabaseAccountTimestamp: 1604663109836,
      dataExplorerVersion: "1.0.1",
      sharedThroughputMinimum: 400,
      sharedThroughputMaximum: 1000000,
      sharedThroughputDefault: 400,
      defaultCollectionThroughput: {
        storage: "100",
        throughput: { fixed: 400, unlimited: 400, unlimitedmax: 100000, unlimitedmin: 400, shared: 400 }
      },
      // add UI test only when feature is not dependent on flights anymore
      flights: []
    } as ViewModels.DataExplorerInputsFrame
  };

  window.postMessage(initTestExplorerContent, window.location.href);
};

window.addEventListener("load", initTestExplorer);
