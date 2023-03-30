import * as ko from "knockout";
import React from "react";
import * as _ from "underscore";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { readCollections, readCollectionsWithPagination } from "../../Common/dataAccess/readCollections";
import { readDatabaseOffer } from "../../Common/dataAccess/readDatabaseOffer";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { fetchPortalNotifications } from "../../Common/PortalNotifications";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { useSidePanel } from "../../hooks/useSidePanel";
import { useTabs } from "../../hooks/useTabs";
import { IJunoResponse, JunoClient } from "../../Juno/JunoClient";
import * as StorageUtility from "../../Shared/StorageUtility";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { getCollectionName } from "../../Utils/APITypeUtils";
import { isServerlessAccount } from "../../Utils/CapabilityUtils";
import { logConsoleError } from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { AddCollectionPanel } from "../Panes/AddCollectionPanel";
import { DatabaseSettingsTabV2 } from "../Tabs/SettingsTabV2";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
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
  public isSampleDB: boolean;
  public collectionsContinuationToken?: string;
  private isOfferRead: boolean;

  constructor(container: Explorer, data: DataModels.Database) {
    this.nodeKind = "Database";
    this.container = container;
    this.self = data._self;
    this.rid = data._rid;
    this.id = ko.observable(data.id);
    this.offer = ko.observable();
    this.collections = ko.observableArray<Collection>();
    this.collections.subscribe(() => useDatabases.getState().updateDatabase(this));
    this.isDatabaseExpanded = ko.observable<boolean>(false);
    this.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();
    this.isDatabaseShared = ko.pureComputed(() => {
      return this.offer && !!this.offer();
    });
    this.junoClient = new JunoClient();
    this.isSampleDB = false;
    this.isOfferRead = false;
  }

  public onSettingsClick = async (): Promise<void> => {
    useSelectedNode.getState().setSelectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.DatabaseSettings);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Settings node",

      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
    if (throughputCap && throughputCap !== -1) {
      await useDatabases.getState().loadAllOffers();
    }

    const pendingNotificationsPromise: Promise<DataModels.Notification> = this.getPendingThroughputSplitNotification();
    const tabKind = ViewModels.CollectionTabKind.DatabaseSettingsV2;
    const matchingTabs = useTabs.getState().getTabs(tabKind, (tab) => tab.node?.id() === this.id());
    let settingsTab = matchingTabs?.[0] as DatabaseSettingsTabV2;

    if (!settingsTab) {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseName: this.id(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Scale",
      });
      pendingNotificationsPromise.then(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data: any) => {
          const pendingNotification: DataModels.Notification = data?.[0];
          const tabOptions: ViewModels.TabOptions = {
            tabKind,
            title: "Scale",
            tabPath: "",
            node: this,
            rid: this.rid,
            database: this,
            onLoadStartKey: startKey,
          };
          settingsTab = new DatabaseSettingsTabV2(tabOptions);
          settingsTab.pendingNotification(pendingNotification);
          useTabs.getState().activateNewTab(settingsTab);
        },
        (error) => {
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
          useTabs.getState().activateTab(settingsTab);
        },
        () => {
          settingsTab.pendingNotification(undefined);
          useTabs.getState().activateTab(settingsTab);
        }
      );
    }
  };

  public async expandDatabase() {
    if (this.isDatabaseExpanded()) {
      return;
    }

    await this.loadOffer();
    await this.loadCollections(true);
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

  public async loadCollections(restart = false) {
    const collectionVMs: Collection[] = [];
    let collections: DataModels.Collection[] = [];
    if (restart) {
      this.collectionsContinuationToken = undefined;
    }
    const containerPaginationEnabled =
      StorageUtility.LocalStorageUtility.getEntryString(StorageUtility.StorageKey.ContainerPaginationEnabled) ===
      "true";
    if (containerPaginationEnabled) {
      const collectionsWithPagination: DataModels.CollectionsWithPagination = await readCollectionsWithPagination(
        this.id(),
        this.collectionsContinuationToken
      );

      if (collectionsWithPagination.collections?.length === Constants.Queries.containersPerPage) {
        this.collectionsContinuationToken = collectionsWithPagination.continuationToken;
      } else {
        this.collectionsContinuationToken = undefined;
      }
      collections = collectionsWithPagination.collections;
    } else {
      collections = await readCollections(this.id());
    }

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
    if (!containerPaginationEnabled || restart) {
      this.deleteCollectionsFromList(deltaCollections.toDelete);
    }

    useDatabases.getState().updateDatabase(this);
  }

  public async openAddCollection(database: Database): Promise<void> {
    await useDatabases.getState().loadDatabaseOffers();
    useSidePanel
      .getState()
      .openSidePanel(
        "New " + getCollectionName(),
        <AddCollectionPanel explorer={database.container} databaseId={database.id()} />
      );
  }

  public findCollectionWithId(collectionId: string): ViewModels.Collection {
    return _.find(this.collections(), (collection: ViewModels.Collection) => collection.id() === collectionId);
  }

  public async loadOffer(): Promise<void> {
    if (!this.isOfferRead && !isServerlessAccount() && !this.offer()) {
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
        const throughputUpdateRegExp = new RegExp("Throughput update (.*) in progress");
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

    const collectionsToDelete: Collection[] = [];
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
    let checkForSchema: NodeJS.Timeout;
    interval = interval || 5000;

    if (collection.analyticalStorageTtl !== undefined && userContext.features.enableSchema) {
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

          if (response.data !== undefined) {
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
