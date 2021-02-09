import "../../less/hostedexplorer.less";
import { TestExplorerParams } from "./TestExplorerParams";
import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import * as msRest from "@azure/ms-rest-js";
import * as ViewModels from "../../src/Contracts/ViewModels";
import { Capability, DatabaseAccount } from "../../src/Contracts/DataModels";

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

const getDatabaseAccount = async (
  token: string,
  notebooksAccountSubscriptonId: string,
  notebooksAccountResourceGroup: string,
  notebooksAccountName: string
): Promise<DatabaseAccount> => {
  const client = new CosmosDBManagementClient(new CustomSigner(token), notebooksAccountSubscriptonId);
  const databaseAccountGetResponse = await client.databaseAccounts.get(
    notebooksAccountResourceGroup,
    notebooksAccountName
  );

  const databaseAccount: DatabaseAccount = {
    id: databaseAccountGetResponse.id,
    name: databaseAccountGetResponse.name,
    location: databaseAccountGetResponse.location,
    type: databaseAccountGetResponse.type,
    kind: databaseAccountGetResponse.kind,
    tags: databaseAccountGetResponse.tags,
    properties: {
      documentEndpoint: databaseAccountGetResponse.documentEndpoint,
      tableEndpoint: undefined,
      gremlinEndpoint: undefined,
      cassandraEndpoint: undefined,
      capabilities: databaseAccountGetResponse.capabilities.map((capability) => {
        return { name: capability.name } as Capability;
      }),
    },
  };

  return databaseAccount;
};

const initTestExplorer = async (): Promise<void> => {
  const urlSearchParams = new URLSearchParams(window.location.search);
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
  const selfServeType = urlSearchParams.get(TestExplorerParams.selfServeType);

  const token = decodeURIComponent(urlSearchParams.get(TestExplorerParams.token));
  const databaseAccount = await getDatabaseAccount(
    token,
    portalRunnerSubscripton,
    portalRunnerResourceGroup,
    portalRunnerDatabaseAccount
  );

  const initTestExplorerContent = {
    inputs: {
      databaseAccount: databaseAccount,
      subscriptionId: portalRunnerSubscripton,
      resourceGroup: portalRunnerResourceGroup,
      authorizationToken: `Bearer ${token}`,
      features: { sampleFeature: "sampleFeatureValue" },
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
        throughput: { fixed: 400, unlimited: 400, unlimitedmax: 100000, unlimitedmin: 400, shared: 400 },
      },
      // add UI test only when feature is not dependent on flights anymore
      flights: [],
      selfServeType,
    } as ViewModels.DataExplorerInputsFrame,
  };

  const iframe = document.createElement("iframe");
  window.addEventListener(
    "message",
    (event) => {
      // After we have received the "ready" message from the child iframe we can post configuration
      // This simulates the same action that happens in the portal
      console.dir(event.data);
      if (event.data?.data === "ready") {
        iframe.contentWindow.postMessage(
          {
            signature: "pcIframe",
            data: initTestExplorerContent,
          },
          iframe.contentDocument.referrer || window.location.href
        );
      }
    },
    false
  );
  iframe.id = "explorerMenu";
  iframe.name = "explorer";
  iframe.classList.add("iframe");
  iframe.title = "explorer";
  iframe.src = "explorer.html?platform=Portal&disablePortalInitCache";
  document.body.appendChild(iframe);
};

initTestExplorer();
