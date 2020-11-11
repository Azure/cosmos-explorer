import "./Shared/appInsights";
import * as _ from "underscore";
import * as ko from "knockout";
import { MessageTypes } from "./Contracts/ExplorerContracts";
import "../less/hostedexplorer.less";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import * as ViewModels from "./Contracts/ViewModels";
import { ClientSecretCredential } from "@azure/identity";

class TestExplorer {
  public isButtonVisible: ko.Observable<boolean>;

  constructor() {
    this.isButtonVisible = ko.observable(true);
    window.addEventListener("message", this.handleMessage.bind(this), false);
  }

  private handleMessage(event: MessageEvent) {
    if (event.data.type === MessageTypes.InitTestExplorer || event.data.type === MessageTypes.HideConnectScreen) {
      this.sendMessageToExplorerFrame(event.data);
    }
  }

  private async AADLogin(): Promise<string> {
    const tenantId = "72f988bf-86f1-41af-91ab-2d7cd011db47";
    const clientId = "fd8753b0-0707-4e32-84e9-2532af865fb4";
    const clientSecret = "xGT82g3sO4AJ.C~G6dii5LP~6-yCit9J-h";

    const credentials = new ClientSecretCredential(tenantId, clientId, clientSecret);

    const token = await credentials.getToken("https://management.core.windows.net/.default");

    return token.token;
  }

  public async postMessage(): Promise<void> {
    const token = await this.AADLogin();
    const content = {
      type: MessageTypes.InitTestExplorer,
      inputs: {
        databaseAccount: {
          id:
            "/subscriptions/18f84a75-22a7-487c-a800-4e1bdad7779a/resourceGroups/srnara-cassandra-test/providers/Microsoft.DocumentDB/databaseAccounts/srnara-notebook",
          name: "srnara-notebook",
          location: "East US",
          type: "Microsoft.DocumentDB/databaseAccounts",
          kind: "GlobalDocumentDB",
          tags: { defaultExperience: "Core (SQL)" },
          systemData: { createdAt: "2019-10-16T20:46:11.4096965Z" },
          properties: {
            provisioningState: "Succeeded",
            documentEndpoint: "https://srnara-notebook.documents.azure.com:443/",
            publicNetworkAccess: "Enabled",
            enableAutomaticFailover: false,
            enableMultipleWriteLocations: true,
            enablePartitionKeyMonitor: false,
            isVirtualNetworkFilterEnabled: false,
            virtualNetworkRules: [],
            EnabledApiTypes: "Sql",
            disableKeyBasedMetadataWriteAccess: false,
            enableFreeTier: false,
            enableAnalyticalStorage: true,
            instanceId: "41978508-99b1-477d-9205-2d2f1ce7fc1a",
            createMode: "Default",
            databaseAccountOfferType: "Standard",
            consistencyPolicy: { defaultConsistencyLevel: "Session", maxIntervalInSeconds: 5, maxStalenessPrefix: 100 },
            configurationOverrides: {},
            writeLocations: [
              {
                id: "srnara-notebook-eastus",
                locationName: "East US",
                documentEndpoint: "https://srnara-notebook-eastus.documents.azure.com:443/",
                provisioningState: "Succeeded",
                failoverPriority: 0,
                isZoneRedundant: false
              }
            ],
            readLocations: [
              {
                id: "srnara-notebook-eastus",
                locationName: "East US",
                documentEndpoint: "https://srnara-notebook-eastus.documents.azure.com:443/",
                provisioningState: "Succeeded",
                failoverPriority: 0,
                isZoneRedundant: false
              }
            ],
            locations: [
              {
                id: "srnara-notebook-eastus",
                locationName: "East US",
                documentEndpoint: "https://srnara-notebook-eastus.documents.azure.com:443/",
                provisioningState: "Succeeded",
                failoverPriority: 0,
                isZoneRedundant: false
              }
            ],
            failoverPolicies: [{ id: "srnara-notebook-eastus", locationName: "East US", failoverPriority: 0 }],
            cors: [],
            capabilities: [],
            ipRules: [],
            backupPolicy: {
              type: "Periodic",
              periodicModeProperties: { backupIntervalInMinutes: 240, backupRetentionIntervalInHours: 8 }
            }
          }
        },
        subscriptionId: "18f84a75-22a7-487c-a800-4e1bdad7779a",
        resourceGroup: "srnara-cassandra-test",
        authorizationToken: `Bearer ${token}`,
        features: {
          cacheextensionapp: "false",
          detailednetworktelemetry: "false",
          logexternaldomainlinks: "true",
          enableextensionpreviewstamp: "true",
          gctelemetry: "false",
          mereactblade: "true",
          paralleltokens: "false",
          prefetchbrowsequerymanifest: "false",
          prefetchtokensinparallel: "true",
          pretick: "false",
          reactdatafetch: "false",
          shellworker: "true",
          shellworkerassets: "true",
          shellworkerbrowseprereqs: "true",
          shellworkersubs: "true",
          simplebatch: "false",
          storageperf1: "false",
          storageperf2: "false",
          earlymenucontentvm: "false",
          bladefullrenderx: "false",
          controlstelemetry: "true",
          noeffectflight: "true",
          advisornotificationdays: "30",
          advisornotificationpercent: "100",
          allserviceswithoverview: "true",
          argsharedqueries: "true",
          argsubscriptions: "true",
          armviewer: "true",
          asyncsearch: "true",
          azureconsole: "true",
          azurehome: "true",
          columnchooserreact: "true",
          contactinfo: "true",
          custombingsearch: "true",
          dashboardalphaapi: "true",
          dashboardautorefresh: "true",
          dashboardautorefreshinterval: "60",
          dashboardfeedback: "true",
          dashboardnewpinexperience: "true",
          dashboardpreviewapi: "true",
          dashboardrefresh: "true",
          devsatsurvey: "true",
          deploy2020: "true",
          enableregionmove: "true",
          enablestartswithmdm: "true",
          enhancedprint: "true",
          essentialsjsonview: "true",
          freelancer: "true",
          guidedtour: "true",
          helpcontentwhatsnewenabled: "true",
          hidefavoritestars: "true",
          hostingservicesuffix: "mpac",
          hubsresourceaccessfromconfig: "true",
          internalonly: "nobanner",
          iriscore: "true",
          iriscorealt: "true",
          iriscoresurfacename: "88000327",
          irissurfacename: "AzurePortal_Notifications_Preview",
          landalltohome: "true",
          loggraphcallwitharmtoken: "true",
          meazblade: "true",
          mistendpoint: "https://mist.int.monitor.azure.com",
          nojqueryeval: "true",
          nopdlearlymenucontentbundles: "true",
          npsintervaldays: "90",
          npspercent: "2.4",
          npsshowportaluri: "true",
          policyawarecontrols: "true",
          prefetchtokens: "true",
          prewarmingtesting: "true",
          reactviewendpointindex: "1",
          reloadafterdays: "5",
          serverfetchedevents: "true",
          sessionvalidity: "true",
          settingsportalinstance: "mpac",
          shadowargcall: "true",
          showbugreportlink: "true",
          showhovercard: "true",
          sidebarhamburgermode: "true",
          singlesignout: "true",
          subscreditcheck: "true",
          tenants2020: "true",
          tilegallerycuration: "true",
          upgradefromtrialbutton: "true",
          argbrowseviews: "true",
          argforoldbrowse: "true",
          argforrgoverview: "true",
          argtagsfilter: "true",
          artbrowse: "true",
          automationtasks: "true",
          browsecuration: "default",
          browsedialogcompactpills: "true",
          browsedialogpills: "true",
          browsefilterstelemetry: "true",
          bypasstokencacheforcustomsignin: "true",
          cloudsimplereservations: "true",
          contactabilitybycountry: "true",
          cryptoapihash: "true",
          dashboardfilters: "true",
          dashboardfiltersaddbutton: "true",
          devnps: "true",
          devnpsintervaldays: "45",
          devnpspercent: "50.0",
          enableaeoemails: "false",
          enablee2emonitoring: "true",
          enablelocationchange: "true",
          experimentation: "false",
          failajaxonnulltoken: "true",
          fastencode: "true",
          feedback: "true",
          feedbackwithsupport: "true",
          fullscreenblades: "true",
          hidemodalsonsmallscreens: "true",
          hidemodalswhendeeplinked: "true",
          irismessagelimit: "1",
          isworkbooksavailable: "true",
          migratetomsal: "true",
          mspexpert: "true",
          mspfilter: "true",
          mspinfo: "true",
          newresourceapi: "true",
          newsupportblade: "true",
          nps: "true",
          outagebanner: "true",
          portalpolling: "true",
          preact: "true",
          preferredusername: "true",
          prefetchdrafttoken: "true",
          prefetchrecents: "true",
          providers2019: "true",
          pushtokens: "true",
          removesubsdropdownlimit: "true",
          reservationsinbrowse: "true",
          reservehozscroll: "true",
          resourcehealth: "true",
          savedeploymentnotification: "true",
          seetemplate: "true",
          serveravatar: "true",
          showpostcreatefeedbackoption: "true",
          showservicehealthalerts: "true",
          showworkflowappkindbrowse: "true",
          supplementalbatchsize: "20",
          tenantscoperedirect: "true",
          tokencaching: "true",
          usealertsv2blade: "true",
          usemsallogin: "true",
          zerosubsexperience: "true",
          regionsegments: "true",
          allservicesweave: "false",
          bundlingkind: "DefaultPartitioner",
          confighash: "CGZNcAynkOLM",
          env: "ms",
          l: "en.en-us",
          pageversion: "6.659.0.25051.201105-0922",
          prefetchhome: "false",
          prewarmie: "false",
          weaveblade: "true",
          dataexplorersource: "https://localhost:1234/explorer.html",
          experimentationflights: "settingsv2;mongoindexeditor"
        },
        hasWriteAccess: true,
        csmEndpoint: "https://management.azure.com",
        dnsSuffix: "documents.azure.com",
        serverId: "prod1",
        extensionEndpoint: "/proxy",
        subscriptionType: 3,
        quotaId: "Internal_2014-09-01",
        addCollectionDefaultFlight: "2",
        isTryCosmosDBSubscription: false,
        masterKey: "jB16xFppH34oIsrxhKytgqlGdq4n3UcHAD9J20jNosrOAzDKfAcvM1kfeBM49ccFxjpFW85Du2ISvrjdl7i4fg==",
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
    this.isButtonVisible(false);
  }

  private sendMessageToExplorerFrame(data: any): void {
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
