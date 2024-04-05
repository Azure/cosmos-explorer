/* eslint-disable no-console */
import "../../less/hostedexplorer.less";
import { DataExplorerInputsFrame } from "../../src/Contracts/ViewModels";
import { updateUserContext } from "../../src/UserContext";
import { get, listKeys } from "../../src/Utils/arm/generatedClients/cosmos/databaseAccounts";

const resourceGroup = process.env.RESOURCE_GROUP || "";
//const subscriptionId = process.env.SUBSCRIPTION_ID || "";
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "";
const urlSearchParams = new URLSearchParams(window.location.search);
const accountName = urlSearchParams.get("accountName") || "portal-sql-runner-west-us";
const selfServeType = urlSearchParams.get("selfServeType") || "example";
const iframeSrc = urlSearchParams.get("iframeSrc") || "explorer.html?platform=Portal&disablePortalInitCache";
const token = urlSearchParams.get("token");

//if (!process.env.AZURE_CLIENT_SECRET) {
//  throw new Error(
//    "process.env.AZURE_CLIENT_SECRET was not set! Set it in your .env file and restart webpack dev server",
//  );
//}

// Azure SDK clients accept the credential as a parameter
//const credentials = new ClientSecretCredential(
//  process.env.AZURE_TENANT_ID,
//  process.env.AZURE_CLIENT_ID,
//  process.env.AZURE_CLIENT_SECRET,
//  {
//    authorityHost: "https://localhost:1234",
//  },
//);

console.log("Resource Group:", resourceGroup);
console.log("Subcription: ", subscriptionId);
console.log("Account Name: ", accountName);

const initTestExplorer = async (): Promise<void> => {
  console.log("Init Test Explorer : 0");
  updateUserContext({
    authorizationToken: `bearer ${token}`,
  });
  console.log("Init Test Explorer : 1");
  const databaseAccount = await get(subscriptionId, resourceGroup, accountName);
  const keys = await listKeys(subscriptionId, resourceGroup, accountName);
  console.log("Init Test Explorer : 2");

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
      extensionEndpoint: "/proxy",
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
  console.log("Init Test Explorer : 3");

  const iframe = document.createElement("iframe");
  window.addEventListener(
    "message",
    (event) => {
      // After we have received the "ready" message from the child iframe we can post configuration
      // This simulates the same action that happens in the portal
      console.dir(event.data);
      if (event.data?.kind === "ready") {
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
  iframe.classList.add("iframe");
  iframe.title = "explorer";
  iframe.src = iframeSrc;
  console.log("Init Test Explorer : 4");
  document.body.appendChild(iframe);
  console.log("Init Test Explorer : 5");
};

initTestExplorer();
