import * as ko from "knockout";
import { MessageTypes } from "./Contracts/ExplorerContracts";
import * as ViewModels from "./Contracts/ViewModels";
import "../less/hostedexplorer.less";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import { ClientSecretCredential } from "@azure/identity";
import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import * as msRest from "@azure/ms-rest-js";
import { DatabaseAccountsGetResponse } from "@azure/arm-cosmosdb/esm/models";
import { TestExplorerParams } from "./TestExplorerParams";

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

class TestExplorer {
  private notebooksTestRunnerApplicationId: string;
  private notebooksTestRunnerClientId: string;
  private notebooksTestRunnerClientSecret: string;
  private notebooksAccountName: string;
  private notebooksAccountKey: string;
  private notebooksAccountSubscriptonId: string;
  private notebooksAccountResourceGroup: string;

  constructor() {
    window.onload = () => {
      this.initTestExplorer();
    };
    window.addEventListener("message", this.handleMessage.bind(this), false);
  }

  private parseUrlParams = (): void => {
    window.location.search
      .substr(1)
      .split("&")
      .forEach(item => {
        const tmp = item.split("=");
        const value = decodeURIComponent(tmp[1]);
        switch (tmp[0]) {
          case TestExplorerParams.notebooksTestRunnerApplicationId:
            this.notebooksTestRunnerApplicationId = value;
            break;
          case TestExplorerParams.notebooksTestRunnerClientId:
            this.notebooksTestRunnerClientId = value;
            break;
          case TestExplorerParams.notebooksTestRunnerClientSecret:
            this.notebooksTestRunnerClientSecret = value;
            break;
          case TestExplorerParams.notebooksAccountName:
            this.notebooksAccountName = value;
            break;
          case TestExplorerParams.notebooksAccountKey:
            this.notebooksAccountKey = value;
            break;
          case TestExplorerParams.notebooksAccountSubscriptonId:
            this.notebooksAccountSubscriptonId = value;
            break;
          case TestExplorerParams.notebooksAccountResourceGroup:
            this.notebooksAccountResourceGroup = value;
            break;
        }
      });
  };

  private handleMessage(event: MessageEvent) {
    if (event.data.type === MessageTypes.InitTestExplorer || event.data.type === MessageTypes.HideConnectScreen) {
      this.sendMessageToExplorerFrame(event.data);
    }
  }

  private async AADLogin(): Promise<string> {
    const credentials = new ClientSecretCredential(
      this.notebooksTestRunnerApplicationId,
      this.notebooksTestRunnerClientId,
      this.notebooksTestRunnerClientSecret
    );
    const token = await credentials.getToken("https://management.core.windows.net/.default");
    return token.token;
  }

  private async getDatabaseAccount(token: string): Promise<DatabaseAccountsGetResponse> {
    const client = new CosmosDBManagementClient(new CustomSigner(token), this.notebooksAccountSubscriptonId);
    return await client.databaseAccounts.get(this.notebooksAccountResourceGroup, this.notebooksAccountName);
  }

  private async initTestExplorer(): Promise<void> {
    this.parseUrlParams();
    const token = await this.AADLogin();
    const databaseAccount = await this.getDatabaseAccount(token);

    const content = {
      type: MessageTypes.InitTestExplorer,
      inputs: {
        databaseAccount: databaseAccount,
        subscriptionId: this.notebooksAccountSubscriptonId,
        resourceGroup: this.notebooksAccountResourceGroup,
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
        masterKey: this.notebooksAccountKey,
        loadDatabaseAccountTimestamp: 1604663109836,
        dataExplorerVersion: "1.0.1",
        sharedThroughputMinimum: 400,
        sharedThroughputMaximum: 1000000,
        sharedThroughputDefault: 400,
        defaultCollectionThroughput: {
          storage: "100",
          throughput: { fixed: 400, unlimited: 400, unlimitedmax: 100000, unlimitedmin: 400, shared: 400 }
        },
        flights: ["mongoindexeditor", "settingsv2"]
      } as ViewModels.DataExplorerInputsFrame
    };
    window.postMessage(content, window.location.href);

    const hideConnectContent = {
      type: MessageTypes.HideConnectScreen
    };
    window.postMessage(hideConnectContent, window.location.href);
  }

  private sendMessageToExplorerFrame(data: unknown): void {
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
  }
}

const testExplorer = new TestExplorer();
ko.applyBindings(testExplorer);
