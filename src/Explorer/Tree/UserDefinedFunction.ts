import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import { deleteUserDefinedFunction } from "../../Common/dataAccess/deleteUserDefinedFunction";
import * as ViewModels from "../../Contracts/ViewModels";
import { useTabs } from "../../hooks/useTabs";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { useDialog } from "../Controls/Dialog";
import Explorer from "../Explorer";
import UserDefinedFunctionTab from "../Tabs/UserDefinedFunctionTab";
import { useSelectedNode } from "../useSelectedNode";

export default class UserDefinedFunction {
  public nodeKind: string;
  public container: Explorer;
  public collection: ViewModels.Collection;
  public self: string;
  public rid: string;
  public id: ko.Observable<string>;
  public body: ko.Observable<string>;

  constructor(container: Explorer, collection: ViewModels.Collection, data: UserDefinedFunctionDefinition & Resource) {
    this.nodeKind = "UserDefinedFunction";
    this.container = container;

    this.collection = collection;
    this.self = data._self;
    this.rid = data._rid;
    this.id = ko.observable(data.id);
    this.body = ko.observable(data.body as string);
  }

  public static create(source: ViewModels.Collection) {
    const id = useTabs.getState().getTabs(ViewModels.CollectionTabKind.UserDefinedFunctions).length + 1;
    const userDefinedFunction = {
      id: "",
      body: "function userDefinedFunction(){}",
    };

    const userDefinedFunctionTab: UserDefinedFunctionTab = new UserDefinedFunctionTab({
      resource: userDefinedFunction,
      isNew: true,
      tabKind: ViewModels.CollectionTabKind.UserDefinedFunctions,
      title: `New UDF ${id}`,
      tabPath: "",
      collection: source,
      node: source,
    });

    useTabs.getState().activateNewTab(userDefinedFunctionTab);
  }

  public open = () => {
    this.select();

    const userDefinedFunctionTabs: UserDefinedFunctionTab[] = useTabs
      .getState()
      .getTabs(
        ViewModels.CollectionTabKind.UserDefinedFunctions,
        (tab) => tab.node?.rid === this.rid,
      ) as UserDefinedFunctionTab[];
    let userDefinedFunctionTab: UserDefinedFunctionTab = userDefinedFunctionTabs && userDefinedFunctionTabs[0];

    if (userDefinedFunctionTab) {
      useTabs.getState().activateTab(userDefinedFunctionTab);
    } else {
      const userDefinedFunctionData = {
        _rid: this.rid,
        _self: this.self,
        id: this.id(),
        body: this.body(),
      };

      userDefinedFunctionTab = new UserDefinedFunctionTab({
        resource: userDefinedFunctionData,
        isNew: false,
        tabKind: ViewModels.CollectionTabKind.UserDefinedFunctions,
        title: userDefinedFunctionData.id,
        tabPath: "",
        collection: this.collection,
        node: this,
      });

      useTabs.getState().activateNewTab(userDefinedFunctionTab);
    }
  };

  public select() {
    useSelectedNode.getState().setSelectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "UDF item node",

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public delete() {
    useDialog.getState().showOkCancelModalDialog(
      "Confirm delete",
      "Are you sure you want to delete the user defined function?",
      "Delete",
      () => {
        deleteUserDefinedFunction(this.collection.databaseId, this.collection.id(), this.id()).then(
          () => {
            useTabs.getState().closeTabsByComparator((tab) => tab.node && tab.node.rid === this.rid);
            this.collection.children.remove(this);
          },
          () => {
            /**/
          },
        );
      },
      "Cancel",
      undefined,
    );
  }
}
