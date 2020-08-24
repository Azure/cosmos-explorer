import * as _ from "underscore";
import * as ko from "knockout";
import Q from "q";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import DatabaseSettingsTab from "../Tabs/DatabaseSettingsTab";
import Collection from "./Collection";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import * as Logger from "../../Common/Logger";
import Explorer from "../Explorer";
import { readOffers, readOffer } from "../../Common/DocumentClientUtilityBase";
import { readCollections } from "../../Common/dataAccess/readCollections";
import { JunoClient, IJunoResponse } from "../../Juno/JunoClient";
import { userContext } from "../../UserContext";

export default class Database implements ViewModels.Database {
  public nodeKind: string;
  public container: Explorer;
  public self: string;
  public rid: string;
  public id: ko.Observable<string>;
  public offer: ko.Observable<DataModels.Offer>;
  public collections: ko.ObservableArray<Collection>;
  public isDatabaseExpanded: ko.Observable<boolean>;
  public isDatabaseShared: ko.Computed<boolean>;
  public selectedSubnodeKind: ko.Observable<ViewModels.CollectionTabKind>;
  private junoClient: JunoClient;

  constructor(container: Explorer, data: any, offer: DataModels.Offer) {
    this.nodeKind = "Database";
    this.container = container;
    this.self = data._self;
    this.rid = data._rid;
    this.id = ko.observable(data.id);
    this.offer = ko.observable(offer);
    this.collections = ko.observableArray<Collection>();
    this.isDatabaseExpanded = ko.observable<boolean>(false);
    this.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();
    this.isDatabaseShared = ko.pureComputed(() => {
      return this.offer && !!this.offer();
    });
    this.junoClient = new JunoClient();
  }

  public onSettingsClick = () => {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.DatabaseSettings);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Settings node",
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });

    const pendingNotificationsPromise: Q.Promise<DataModels.Notification> = this._getPendingThroughputSplitNotification();
    const matchingTabs = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.DatabaseSettings,
      tab => tab.rid === this.rid
    );
    let settingsTab: DatabaseSettingsTab = matchingTabs && (matchingTabs[0] as DatabaseSettingsTab);
    if (!settingsTab) {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseAccountName: this.container.databaseAccount().name,
        databaseName: this.id(),
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Scale"
      });
      Q.all([pendingNotificationsPromise, this.readSettings()]).then(
        (data: any) => {
          const pendingNotification: DataModels.Notification = data && data[0];
          settingsTab = new DatabaseSettingsTab({
            tabKind: ViewModels.CollectionTabKind.DatabaseSettings,
            title: "Scale",
            tabPath: "",
            node: this,
            rid: this.rid,
            database: this,
            hashLocation: `${Constants.HashRoutePrefixes.databasesWithId(this.id())}/settings`,
            selfLink: this.self,
            isActive: ko.observable(false),
            onLoadStartKey: startKey,
            onUpdateTabsButtons: this.container.onUpdateTabsButtons
          });

          settingsTab.pendingNotification(pendingNotification);
          this.container.tabsManager.activateNewTab(settingsTab);
        },
        (error: any) => {
          TelemetryProcessor.traceFailure(
            Action.Tab,
            {
              databaseAccountName: this.container.databaseAccount().name,
              databaseName: this.id(),
              collectionName: this.id(),
              defaultExperience: this.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: "Scale",
              error: error
            },
            startKey
          );
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Error while fetching database settings for database ${this.id()}: ${JSON.stringify(error)}`
          );
          throw error;
        }
      );
    } else {
      pendingNotificationsPromise.then(
        (pendingNotification: DataModels.Notification) => {
          settingsTab.pendingNotification(pendingNotification);
          this.container.tabsManager.activateTab(settingsTab);
        },
        (error: any) => {
          settingsTab.pendingNotification(undefined);
          this.container.tabsManager.activateTab(settingsTab);
        }
      );
    }
  };

  public readSettings(): Q.Promise<void> {
    const deferred: Q.Deferred<void> = Q.defer<void>();
    if (this.container.isServerlessEnabled()) {
      deferred.resolve();
    }

    this.container.isRefreshingExplorer(true);
    const databaseDataModel: DataModels.Database = <DataModels.Database>{
      id: this.id(),
      _rid: this.rid,
      _self: this.self
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.LoadOffers, {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience()
    });

    const offerInfoPromise: Q.Promise<DataModels.Offer[]> = readOffers();
    Q.all([offerInfoPromise]).then(
      () => {
        this.container.isRefreshingExplorer(false);

        const databaseOffer: DataModels.Offer = this._getOfferForDatabase(
          offerInfoPromise.valueOf(),
          databaseDataModel
        );
        readOffer(databaseOffer).then((offerDetail: DataModels.OfferWithHeaders) => {
          const offerThroughputInfo: DataModels.OfferThroughputInfo = {
            minimumRUForCollection:
              offerDetail.content &&
              offerDetail.content.collectionThroughputInfo &&
              offerDetail.content.collectionThroughputInfo.minimumRUForCollection,
            numPhysicalPartitions:
              offerDetail.content &&
              offerDetail.content.collectionThroughputInfo &&
              offerDetail.content.collectionThroughputInfo.numPhysicalPartitions
          };

          databaseOffer.content.collectionThroughputInfo = offerThroughputInfo;
          (databaseOffer as DataModels.OfferWithHeaders).headers = offerDetail.headers;
          this.offer(databaseOffer);
          this.offer.valueHasMutated();

          TelemetryProcessor.traceSuccess(
            Action.LoadOffers,
            {
              databaseAccountName: this.container.databaseAccount().name,
              defaultExperience: this.container.defaultExperience()
            },
            startKey
          );
          deferred.resolve();
        });
      },
      (error: any) => {
        this.container.isRefreshingExplorer(false);
        deferred.reject(error);
        TelemetryProcessor.traceFailure(
          Action.LoadOffers,
          {
            databaseAccountName: this.container.databaseAccount().name,
            defaultExperience: this.container.defaultExperience()
          },
          startKey
        );
      }
    );

    return deferred.promise;
  }

  public isDatabaseNodeSelected(): boolean {
    return (
      !this.isDatabaseExpanded() &&
      this.container.selectedNode &&
      this.container.selectedNode() &&
      this.container.selectedNode().rid === this.rid &&
      this.container.selectedNode().nodeKind === "Database"
    );
  }

  public onDeleteDatabaseContextMenuClick(source: ViewModels.Database, event: MouseEvent | KeyboardEvent) {
    this.container.deleteDatabaseConfirmationPane.open();
  }

  public selectDatabase() {
    this.container.selectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Database node",
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
  }

  public expandCollapseDatabase() {
    this.selectDatabase();
    if (this.isDatabaseExpanded()) {
      this.collapseDatabase();
    } else {
      this.expandDatabase();
    }
    this.container.onUpdateTabsButtons([]);
    this.container.tabsManager.refreshActiveTab(tab => tab.collection && tab.collection.getDatabase().rid === this.rid);
  }

  public expandDatabase() {
    if (this.isDatabaseExpanded()) {
      return;
    }

    this.loadCollections();
    this.isDatabaseExpanded(true);
    TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
      description: "Database node",
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
  }

  public collapseDatabase() {
    if (!this.isDatabaseExpanded()) {
      return;
    }

    this.isDatabaseExpanded(false);
    TelemetryProcessor.trace(Action.CollapseTreeNode, ActionModifiers.Mark, {
      description: "Database node",
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
  }

  public loadCollections(): Q.Promise<void> {
    let collectionVMs: Collection[] = [];
    let deferred: Q.Deferred<void> = Q.defer<void>();

    readCollections(this.id()).then(
      (collections: DataModels.Collection[]) => {
        let collectionsToAddVMPromises: Q.Promise<any>[] = [];
        let deltaCollections = this.getDeltaCollections(collections);

        deltaCollections.toAdd.forEach((collection: DataModels.Collection) => {
          this.addSchema(collection);
          const collectionVM: Collection = new Collection(this.container, this.id(), collection, null, null);
          collectionVMs.push(collectionVM);
        });

        //merge collections
        this.addCollectionsToList(collectionVMs);
        this.deleteCollectionsFromList(deltaCollections.toDelete);

        deferred.resolve();
      },
      (error: any) => {
        deferred.reject(error);
      }
    );

    return deferred.promise;
  }

  public openAddCollection(database: Database, event: MouseEvent) {
    database.container.addCollectionPane.databaseId(database.id());
    database.container.addCollectionPane.open();
  }

  public findCollectionWithId(collectionId: string): ViewModels.Collection {
    return _.find(this.collections(), (collection: ViewModels.Collection) => collection.id() === collectionId);
  }

  private _getPendingThroughputSplitNotification(): Q.Promise<DataModels.Notification> {
    if (!this.container) {
      return Q.resolve(undefined);
    }

    const deferred: Q.Deferred<DataModels.Notification> = Q.defer<DataModels.Notification>();
    this.container.notificationsClient.fetchNotifications().then(
      (notifications: DataModels.Notification[]) => {
        if (!notifications || notifications.length === 0) {
          deferred.resolve(undefined);
          return;
        }

        const pendingNotification = _.find(notifications, (notification: DataModels.Notification) => {
          const throughputUpdateRegExp: RegExp = new RegExp("Throughput update (.*) in progress");
          return (
            notification.kind === "message" &&
            !notification.collectionName &&
            notification.databaseName === this.id() &&
            notification.description &&
            throughputUpdateRegExp.test(notification.description)
          );
        });

        deferred.resolve(pendingNotification);
      },
      (error: any) => {
        Logger.logError(
          JSON.stringify({
            error: JSON.stringify(error),
            accountName: this.container && this.container.databaseAccount(),
            databaseName: this.id(),
            collectionName: this.id()
          }),
          "Settings tree node"
        );
        deferred.resolve(undefined);
      }
    );

    return deferred.promise;
  }

  private getDeltaCollections(
    updatedCollectionsList: DataModels.Collection[]
  ): { toAdd: DataModels.Collection[]; toDelete: Collection[] } {
    const collectionsToAdd: DataModels.Collection[] = _.filter(
      updatedCollectionsList,
      (collection: DataModels.Collection) => {
        const collectionExists = _.some(
          this.collections(),
          (existingCollection: Collection) => existingCollection.rid === collection._rid
        );
        return !collectionExists;
      }
    );

    let collectionsToDelete: Collection[] = [];
    ko.utils.arrayForEach(this.collections(), (collection: Collection) => {
      const collectionPresentInUpdatedList = _.some(
        updatedCollectionsList,
        (coll: DataModels.Collection) => coll._rid === collection.rid
      );
      if (!collectionPresentInUpdatedList) {
        collectionsToDelete.push(collection);
      }
    });

    return { toAdd: collectionsToAdd, toDelete: collectionsToDelete };
  }

  private addCollectionsToList(collections: Collection[]): void {
    this.collections(
      this.collections()
        .concat(collections)
        .sort((collection1, collection2) => collection1.id().localeCompare(collection2.id()))
    );
  }

  private deleteCollectionsFromList(collectionsToRemove: Collection[]): void {
    const collectionsToKeep: Collection[] = [];

    ko.utils.arrayForEach(this.collections(), (collection: Collection) => {
      const shouldRemoveCollection = _.some(collectionsToRemove, (coll: Collection) => coll.rid === collection.rid);
      if (!shouldRemoveCollection) {
        collectionsToKeep.push(collection);
      }
    });

    this.collections(collectionsToKeep);
  }

  private _getOfferForDatabase(offers: DataModels.Offer[], database: DataModels.Database): DataModels.Offer {
    return _.find(offers, (offer: DataModels.Offer) => offer.resource === database._self);
  }

  private addSchema(collection: DataModels.Collection): void {
    if (collection.analyticalStorageTtl == undefined || !this.container.isSchemaEnabled()) {
      return;
    }

    collection.requestSchema = () => {
      this.junoClient.requestSchema({
        id: null,
        subscriptionId: userContext.subscriptionId,
        resourceGroup: userContext.resourceGroup,
        accountName: userContext.databaseAccount.name,
        resource: `dbs/${this.id}/colls/${collection.id}`,
        status: "new"
      });
      const checkForSchema = setInterval(async () => {
        const response: IJunoResponse<DataModels.ISchema> = await this.junoClient.getSchema(
          userContext.databaseAccount.name,
          this.id(),
          collection.id
        );

        if (response.status >= 404) {
          clearInterval(checkForSchema);
        }

        if (response.data != null) {
          clearInterval(checkForSchema);
          collection.schema = response.data;
        }
      }, 5000);
    };

    collection.requestSchema();
  }
}
