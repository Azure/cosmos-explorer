import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import { deleteStoredProcedure } from "../../Common/dataAccess/deleteStoredProcedure";
import { executeStoredProcedure } from "../../Common/dataAccess/executeStoredProcedure";
import * as ViewModels from "../../Contracts/ViewModels";
import { useTabs } from "../../hooks/useTabs";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { useDialog } from "../Controls/Dialog";
import Explorer from "../Explorer";
import { getErrorMessage } from "../Tables/Utilities";
import { NewStoredProcedureTab } from "../Tabs/StoredProcedureTab/StoredProcedureTab";
import TabsBase from "../Tabs/TabsBase";
import { useSelectedNode } from "../useSelectedNode";

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

export default class StoredProcedure {
  public nodeKind: string;
  public container: Explorer;
  public collection: ViewModels.Collection;
  public self: string;
  public rid: string;
  public id: ko.Observable<string>;
  public body: ko.Observable<string>;
  public isExecuteEnabled: boolean;

  constructor(container: Explorer, collection: ViewModels.Collection, data: StoredProcedureDefinition & Resource) {
    this.nodeKind = "StoredProcedure";
    this.container = container;
    this.collection = collection;
    this.self = data._self;
    this.rid = data._rid;
    this.id = ko.observable(data.id);
    this.body = ko.observable(data.body as string);
    this.isExecuteEnabled = userContext.features.executeSproc;
  }

  public static create(source: ViewModels.Collection, event: MouseEvent) {
    const id = useTabs.getState().getTabs(ViewModels.CollectionTabKind.StoredProcedures).length + 1;
    const storedProcedure = <StoredProcedureDefinition>{
      id: "",
      body: sampleStoredProcedureBody,
    };

    const storedProcedureTab: NewStoredProcedureTab = new NewStoredProcedureTab(
      {
        resource: storedProcedure,
        isNew: true,
        tabKind: ViewModels.CollectionTabKind.StoredProcedures,
        title: `New Stored Procedure ${id}`,
        tabPath: `${source.databaseId}>${source.id()}>New Stored Procedure ${id}`,
        collection: source,
        node: source,
      },
      {
        collection: source,
        container: source.container,
      }
    );

    useTabs.getState().activateNewTab(storedProcedureTab);
  }

  public select() {
    useSelectedNode.getState().setSelectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Stored procedure node",

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public open = () => {
    this.select();

    const storedProcedureTabs: NewStoredProcedureTab[] = useTabs
      .getState()
      .getTabs(
        ViewModels.CollectionTabKind.StoredProcedures,
        (tab: TabsBase) => tab.node && tab.node.rid === this.rid
      ) as NewStoredProcedureTab[];
    let storedProcedureTab: NewStoredProcedureTab = storedProcedureTabs && storedProcedureTabs[0];

    if (storedProcedureTab) {
      useTabs.getState().activateTab(storedProcedureTab);
    } else {
      const storedProcedureData = <StoredProcedureDefinition>{
        _rid: this.rid,
        _self: this.self,
        id: this.id(),
        body: this.body(),
      };

      storedProcedureTab = new NewStoredProcedureTab(
        {
          resource: storedProcedureData,
          isNew: false,
          tabKind: ViewModels.CollectionTabKind.StoredProcedures,
          title: storedProcedureData.id,
          tabPath: `${this.collection.databaseId}>${this.collection.id()}>${storedProcedureData.id}`,
          collection: this.collection,
          node: this,
        },
        {
          collection: this.collection,
          container: this.container,
        }
      );

      useTabs.getState().activateNewTab(storedProcedureTab);
    }
  };
  public delete() {
    useDialog.getState().showOkCancelModalDialog(
      "Confirm delete",
      "Are you sure you want to delete the stored procedure?",
      "Delete",
      () => {
        deleteStoredProcedure(this.collection.databaseId, this.collection.id(), this.id()).then(
          () => {
            useTabs.getState().closeTabsByComparator((tab: TabsBase) => tab.node && tab.node.rid === this.rid);
            this.collection.children.remove(this);
          },
          (reason) => {}
        );
      },
      "Cancel",
      undefined
    );
  }

  public execute(params: string[], partitionKeyValue?: string): void {
    const sprocTabs: NewStoredProcedureTab[] = useTabs
      .getState()
      .getTabs(
        ViewModels.CollectionTabKind.StoredProcedures,
        (tab: TabsBase) => tab.node && tab.node.rid === this.rid
      ) as NewStoredProcedureTab[];
    const sprocTab: NewStoredProcedureTab = sprocTabs && sprocTabs.length > 0 && sprocTabs[0];
    sprocTab.isExecuting(true);
    this.container &&
      executeStoredProcedure(this.collection, this, partitionKeyValue, params)
        .then(
          (result) => {
            sprocTab.onExecuteSprocsResult(result);
          },
          (error) => {
            sprocTab.onExecuteSprocsError(getErrorMessage(error));
          }
        )
        .finally(() => {
          sprocTab.isExecuting(false);
          this.onFocusAfterExecute();
        });
  }

  public onFocusAfterExecute(): void {
    const focusElement = document.getElementById("execute-storedproc-toggles");
    focusElement && focusElement.focus();
  }
}
