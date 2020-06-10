import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";

import StoredProcedureTab from "../Tabs/StoredProcedureTab";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";

const sampleStoredProcedureBody: string = `// SAMPLE STORED PROCEDURE
function sample(prefix) {
    var collection = getContext().getCollection();

    // Query documents and take 1st item.
    var isAccepted = collection.queryDocuments(
        collection.getSelfLink(),
        'SELECT * FROM root r',
    function (err, feed, options) {
        if (err) throw err;

        // Check the feed and if empty, set the body to 'no docs found', 
        // else take 1st element from feed
        if (!feed || !feed.length) {
            var response = getContext().getResponse();
            response.setBody('no docs found');
        }
        else {
            var response = getContext().getResponse();
            var body = { prefix: prefix, feed: feed[0] };
            response.setBody(JSON.stringify(body));
        }
    });

    if (!isAccepted) throw new Error('The query was not accepted by the server.');
}`;

export default class StoredProcedure implements ViewModels.StoredProcedure {
  public nodeKind: string;
  public container: ViewModels.Explorer;
  public collection: ViewModels.Collection;
  public self: string;
  public rid: string;
  public id: ko.Observable<string>;
  public body: ko.Observable<string>;
  public isExecuteEnabled: boolean;

  constructor(container: ViewModels.Explorer, collection: ViewModels.Collection, data: DataModels.StoredProcedure) {
    this.nodeKind = "StoredProcedure";
    this.container = container;
    this.collection = collection;
    this.self = data._self;
    this.rid = data._rid;
    this.id = ko.observable(data.id);
    this.body = ko.observable(data.body);
    this.isExecuteEnabled = this.container.isFeatureEnabled(Constants.Features.executeSproc);
  }

  public static create(source: ViewModels.Collection, event: MouseEvent) {
    const openedTabs = source.container.openedTabs();
    const id =
      openedTabs.filter((tab: ViewModels.Tab) => tab.tabKind === ViewModels.CollectionTabKind.StoredProcedures).length +
      1;
    const storedProcedure = <DataModels.StoredProcedure>{
      id: "",
      body: sampleStoredProcedureBody
    };
    let storedProcedureTab: ViewModels.Tab = new StoredProcedureTab({
      resource: storedProcedure,
      isNew: true,
      tabKind: ViewModels.CollectionTabKind.StoredProcedures,
      title: `New Stored Procedure ${id}`,
      tabPath: `${source.databaseId}>${source.id()}>New Stored Procedure ${id}`,
      documentClientUtility: source.container.documentClientUtility,
      collection: source,
      node: source,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(source.databaseId, source.id())}/sproc`,
      selfLink: "",
      isActive: ko.observable(false),
      onUpdateTabsButtons: source.container.onUpdateTabsButtons,
      openedTabs: source.container.openedTabs()
    });
    source.container.openedTabs.push(storedProcedureTab);

    // Activate
    storedProcedureTab.onTabClick();
  }

  public select() {
    this.container.selectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Stored procedure node",
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
  }

  public open = () => {
    this.select();

    const openedTabs = this.container.openedTabs();
    const storedProcedureTabsOpen: ViewModels.Tab[] =
      openedTabs &&
      openedTabs.filter(
        tab => tab.node && tab.node.rid === this.rid && tab.tabKind === ViewModels.CollectionTabKind.StoredProcedures
      );
    let storedProcedureTab: ViewModels.Tab =
      storedProcedureTabsOpen && storedProcedureTabsOpen.length > 0 && storedProcedureTabsOpen[0];
    if (!storedProcedureTab) {
      const storedProcedureData = <DataModels.StoredProcedure>{
        _rid: this.rid,
        _self: this.self,
        id: this.id(),
        body: this.body()
      };

      storedProcedureTab = new StoredProcedureTab({
        resource: storedProcedureData,
        isNew: false,
        tabKind: ViewModels.CollectionTabKind.StoredProcedures,
        title: storedProcedureData.id,
        tabPath: `${this.collection.databaseId}>${this.collection.id()}>${storedProcedureData.id}`,
        documentClientUtility: this.container.documentClientUtility,
        collection: this.collection,
        node: this,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(
          this.collection.databaseId,
          this.collection.id()
        )}/sprocs/${this.id()}`,
        selfLink: this.self,
        isActive: ko.observable(false),
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
        openedTabs: this.container.openedTabs()
      });
      this.container.openedTabs.push(storedProcedureTab);
    }

    // Activate
    storedProcedureTab.onTabClick();
  };

  public delete(source: ViewModels.Collection, event: MouseEvent | KeyboardEvent) {
    if (!window.confirm("Are you sure you want to delete the stored procedure?")) {
      return;
    }

    const storedProcedureData = <DataModels.StoredProcedure>{
      _rid: this.rid,
      _self: this.self,
      id: this.id(),
      body: this.body()
    };

    this.container.documentClientUtility.deleteStoredProcedure(this.collection, storedProcedureData).then(
      () => {
        this.container.openedTabs.remove((tab: ViewModels.Tab) => tab.node && tab.node.rid === this.rid);
        this.collection.children.remove(this);
      },
      reason => {}
    );
  }

  public execute(params: string[], partitionKeyValue?: string): void {
    const sprocTab: ViewModels.StoredProcedureTab = this._getCurrentStoredProcedureTab();
    sprocTab.isExecuting(true);
    this.container &&
      this.container.documentClientUtility
        .executeStoredProcedure(this.collection, this, partitionKeyValue, params)
        .then(
          (result: any) => {
            sprocTab.onExecuteSprocsResult(result, result.scriptLogs);
          },
          (error: any) => {
            sprocTab.onExecuteSprocsError(JSON.stringify(error));
          }
        )
        .finally(() => {
          sprocTab.isExecuting(false);
          this.onFocusAfterExecute();
        });
  }

  public onKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.key === "Delete") {
      this.delete(source, event);
      return false;
    }

    return true;
  };

  public onKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.key === " " || event.key === "Enter") {
      this.open();
      return false;
    }

    return true;
  };

  public onFocusAfterExecute(): void {
    const focusElement = document.getElementById("execute-storedproc-toggles");
    focusElement && focusElement.focus();
  }

  private _getCurrentStoredProcedureTab(): ViewModels.StoredProcedureTab {
    const openedTabs = this.container.openedTabs();
    const storedProcedureTabsOpen: ViewModels.Tab[] =
      openedTabs &&
      openedTabs.filter(
        tab => tab.node && tab.node.rid === this.rid && tab.tabKind === ViewModels.CollectionTabKind.StoredProcedures
      );

    return (storedProcedureTabsOpen &&
      storedProcedureTabsOpen.length > 0 &&
      storedProcedureTabsOpen[0]) as ViewModels.StoredProcedureTab;
  }
}
