import * as ko from "knockout";
import * as _ from "underscore";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { readCollections } from "../../Common/dataAccess/readCollections";
import { readDatabaseOffer } from "../../Common/dataAccess/readDatabaseOffer";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { fetchPortalNotifications } from "../../Common/PortalNotifications";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { IJunoResponse, JunoClient } from "../../Juno/JunoClient";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { logConsoleError } from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { DatabaseSettingsTabV2 } from "../Tabs/SettingsTabV2";
import Collection from "./Collection";

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
  public junoClient: JunoClient;
  private isOfferRead: boolean;

  constructor(container: Explorer, data: any) {
    this.nodeKind = "Database";
    this.container = container;
    this.self = data._self;
    this.rid = data._rid;
    this.id = ko.observable(data.id);
    this.offer = ko.observable();
    this.collections = ko.observableArray<Collection>();
    this.isDatabaseExpanded = ko.observable<boolean>(false);
    this.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();
    this.isDatabaseShared = ko.pureComputed(() => {
      return this.offer && !!this.offer();
    });
    this.junoClient = new JunoClient();
    this.isOfferRead = false;
  }

  public onSettingsClick = () => {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.DatabaseSettings);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Settings node",

      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    const pendingNotificationsPromise: Promise<DataModels.Notification> = this.getPendingThroughputSplitNotification();
    const tabKind = ViewModels.CollectionTabKind.DatabaseSettingsV2;
    const matchingTabs = this.container.tabsManager.getTabs(tabKind, (tab) => tab.node?.id() === this.id());
    let settingsTab = matchingTabs?.[0] as DatabaseSettingsTabV2;

    if (!settingsTab) {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseName: this.id(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Scale",
      });
      pendingNotificationsPromise.then(
        (data: any) => {
          const pendingNotification: DataModels.Notification = data?.[0];
          const tabOptions: ViewModels.TabOptions = {
            tabKind,
            title: "Scale",
            tabPath: "",
            node: this,
            rid: this.rid,
            database: this,
            hashLocation: `${Constants.HashRoutePrefixes.databasesWithId(this.id())}/settings`,
            onLoadStartKey: startKey,
            onUpdateTabsButtons: this.container.onUpdateTabsButtons,
          };
          settingsTab = new DatabaseSettingsTabV2(tabOptions);
          settingsTab.pendingNotification(pendingNotification);
          this.container.tabsManager.activateNewTab(settingsTab);
        },
        (error: any) => {
          const errorMessage = getErrorMessage(error);
          TelemetryProcessor.traceFailure(
            Action.Tab,
            {
              databaseName: this.id(),
              collectionName: this.id(),

              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: "Scale",
              error: errorMessage,
              errorStack: getErrorStack(error),
            },
            startKey
          );
          logConsoleError(`Error while fetching database settings for database ${this.id()}: ${errorMessage}`);
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

  public isDatabaseNodeSelected(): boolean {
    return (
      !this.isDatabaseExpanded() &&
      this.container.selectedNode &&
      this.container.selectedNode() &&
      this.container.selectedNode().nodeKind === "Database" &&
      this.container.selectedNode().id() === this.id()
    );
  }

  public selectDatabase() {
    this.container.selectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Database node",

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public async expandDatabase() {
    if (this.isDatabaseExpanded()) {
      return;
    }

    await this.loadOffer();
    await this.loadCollections();
    this.isDatabaseExpanded(true);
    TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
      description: "Database node",

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public collapseDatabase() {
    if (!this.isDatabaseExpanded()) {
      return;
    }

    this.isDatabaseExpanded(false);
    TelemetryProcessor.trace(Action.CollapseTreeNode, ActionModifiers.Mark, {
      description: "Database node",

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public async loadCollections(): Promise<void> {
    const collectionVMs: Collection[] = [];
    const collections: DataModels.Collection[] = await readCollections(this.id());
    // TODO Remove
    // This is a hack to make Mongo collections read via ARM have a SQL-ish partitionKey property
    if (userContext.apiType === "Mongo" && userContext.authType === AuthType.AAD) {
      collections.map((collection) => {
        if (collection.shardKey) {
          const shardKey = Object.keys(collection.shardKey)[0];
          collection.partitionKey = {
            version: undefined,
            kind: "Hash",
            paths: [`/"$v"/"${shardKey.split(".").join(`"/"$v"/"`)}"/"$v"`],
          };
        } else {
          collection.partitionKey = {
            paths: ["/'$v'/'_partitionKey'/'$v'"],
            kind: "Hash",
            version: 2,
            systemKey: true,
          };
        }
      });
    }
    const deltaCollections = this.getDeltaCollections(collections);

    collections.forEach((collection: DataModels.Collection) => {
      this.addSchema(collection);
    });

    deltaCollections.toAdd.forEach((collection: DataModels.Collection) => {
      const collectionVM: Collection = new Collection(this.container, this.id(), collection);
      collectionVMs.push(collectionVM);
    });

    //merge collections
    this.addCollectionsToList(collectionVMs);
    this.deleteCollectionsFromList(deltaCollections.toDelete);
  }

  public openAddCollection(database: Database) {
    database.container.openAddCollectionPanel(database.id());
  }

  public findCollectionWithId(collectionId: string): ViewModels.Collection {
    return _.find(this.collections(), (collection: ViewModels.Collection) => collection.id() === collectionId);
  }

  public async loadOffer(): Promise<void> {
    if (!this.isOfferRead && !this.container.isServerlessEnabled() && !this.offer()) {
      const params: DataModels.ReadDatabaseOfferParams = {
        databaseId: this.id(),
        databaseResourceId: this.self,
      };
      this.offer(await readDatabaseOffer(params));
      this.isOfferRead = true;
    }
  }

  public async getPendingThroughputSplitNotification(): Promise<DataModels.Notification> {
    if (!this.container) {
      return undefined;
    }

    try {
      const notifications: DataModels.Notification[] = await fetchPortalNotifications();
      if (!notifications || notifications.length === 0) {
        return undefined;
      }

      return _.find(notifications, (notification: DataModels.Notification) => {
        const throughputUpdateRegExp: RegExp = new RegExp("Throughput update (.*) in progress");
        return (
          notification.kind === "message" &&
          !notification.collectionName &&
          notification.databaseName === this.id() &&
          notification.description &&
          throughputUpdateRegExp.test(notification.description)
        );
      });
    } catch (error) {
      Logger.logError(
        JSON.stringify({
          error: getErrorMessage(error),
          accountName: userContext?.databaseAccount,
          databaseName: this.id(),
          collectionName: this.id(),
        }),
        "Settings tree node"
      );

      return undefined;
    }
  }

  private getDeltaCollections(
    updatedCollectionsList: DataModels.Collection[]
  ): { toAdd: DataModels.Collection[]; toDelete: Collection[] } {
    const collectionsToAdd: DataModels.Collection[] = _.filter(
      updatedCollectionsList,
      (collection: DataModels.Collection) => {
        const collectionExists = _.some(
          this.collections(),
          (existingCollection: Collection) => existingCollection.id() === collection.id
        );
        return !collectionExists;
      }
    );

    let collectionsToDelete: Collection[] = [];
    ko.utils.arrayForEach(this.collections(), (collection: Collection) => {
      const collectionPresentInUpdatedList = _.some(
        updatedCollectionsList,
        (coll: DataModels.Collection) => coll.id === collection.id()
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
    if (collectionsToRemove.length === 0) {
      return;
    }

    const collectionsToKeep: Collection[] = [];

    ko.utils.arrayForEach(this.collections(), (collection: Collection) => {
      const shouldRemoveCollection = _.some(collectionsToRemove, (coll: Collection) => coll.id() === collection.id());
      if (!shouldRemoveCollection) {
        collectionsToKeep.push(collection);
      }
    });

    this.collections(collectionsToKeep);
  }

  public addSchema(collection: DataModels.Collection, interval?: number): NodeJS.Timeout {
    let checkForSchema: NodeJS.Timeout = null;
    interval = interval || 5000;

    if (collection.analyticalStorageTtl !== undefined && this.container.isSchemaEnabled()) {
      collection.requestSchema = () => {
        this.junoClient.requestSchema({
          id: undefined,
          subscriptionId: userContext.subscriptionId,
          resourceGroup: userContext.resourceGroup,
          accountName: userContext.databaseAccount.name,
          resource: `dbs/${this.id()}/colls/${collection.id}`,
          status: "new",
        });
        checkForSchema = setInterval(async () => {
          const response: IJunoResponse<DataModels.ISchema> = await this.junoClient.getSchema(
            userContext.subscriptionId,
            userContext.resourceGroup,
            userContext.databaseAccount.name,
            this.id(),
            collection.id
          );

          if (response.status >= 404) {
            clearInterval(checkForSchema);
          }

          if (response.data !== null) {
            clearInterval(checkForSchema);
            collection.schema = response.data;
          }
        }, interval);
      };

      collection.requestSchema();
    }

    return checkForSchema;
  }
}
