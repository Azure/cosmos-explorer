/* eslint-disable no-console */
import "../../less/hostedexplorer.less";
import { DataExplorerInputsFrame } from "../../src/Contracts/ViewModels";
import { updateUserContext } from "../../src/UserContext";
import { get, listKeys } from "../../src/Utils/arm/generatedClients/cosmos/databaseAccounts";

const urlSearchParams = new URLSearchParams(window.location.search);
const resourceGroup = urlSearchParams.get("resourceGroup") || process.env.RESOURCE_GROUP || "";
const subscriptionId = urlSearchParams.get("subscriptionId") || process.env.SUBSCRIPTION_ID || "";
const accountName = urlSearchParams.get("accountName") || "portal-sql-runner-west-us";
const selfServeType = urlSearchParams.get("selfServeType") || "example";
const iframeSrc = urlSearchParams.get("iframeSrc") || "explorer.html?platform=Portal&disablePortalInitCache";
const token = urlSearchParams.get("token");

console.log("Resource Group:", resourceGroup);
console.log("Subcription: ", subscriptionId);
console.log("Account Name: ", accountName);

const initTestExplorer = async (): Promise<void> => {
  updateUserContext({
    authorizationToken: `bearer ${token}`,
  });
  const databaseAccount = await get(subscriptionId, resourceGroup, accountName);
  const keys = await listKeys(subscriptionId, resourceGroup, accountName);

  // Disable the quickstart carousel.
  if (databaseAccount?.id) {
    localStorage.setItem(databaseAccount.id, "true");
  }

  const initTestExplorerContent = {
    inputs: {
      databaseAccount: databaseAccount,
      subscriptionId,
      resourceGroup,
      authorizationToken: `Bearer ${token}`,
      features: {},
      hasWriteAccess: true,
      csmEndpoint: "https://management.azure.com",
      dnsSuffix: "documents.azure.com",
      serverId: "prod1",
      portalBackendEndpoint: "https://cdb-ms-mpac-pbe.cosmos.azure.com",
      mongoProxyEndpoint: "https://cdb-ms-mpac-mp.cosmos.azure.com",
      cassandraProxyEndpoint: "https://cdb-ms-mpac-cp.cosmos.azure.com",
      subscriptionType: 3,
      quotaId: "Internal_2014-09-01",
      isTryCosmosDBSubscription: false,
      masterKey: keys.primaryMasterKey,
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
    } as DataExplorerInputsFrame,
  };

  const iframe = document.createElement("iframe");
  window.addEventListener(
    "message",
    (event) => {
      // After we have received the "ready" message from the child iframe we can post configuration
      // This simulates the same action that happens in the portal
      console.dir(event.data);
      if (event.data?.kind === "ready") {
        if (!iframe.contentWindow || !iframe.contentDocument) {
          throw new Error("iframe is not loaded");
        }

        iframe.contentWindow.postMessage(
          {
            signature: "pcIframe",
            data: initTestExplorerContent,
          },
          iframe.contentDocument.referrer || window.location.href,
        );
      }
    },
    false,
  );
  iframe.id = "explorerMenu";
  iframe.name = "explorer";
  iframe.setAttribute("data-test", "DataExplorerFrame");
  iframe.classList.add("iframe");
  iframe.title = "explorer";
  iframe.src = iframeSrc; // CodeQL [SM03712] Not used in production, only for testing purposes
  document.body.appendChild(iframe);
};

initTestExplorer();
