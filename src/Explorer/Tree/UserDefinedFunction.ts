import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import UserDefinedFunctionTab from "../Tabs/UserDefinedFunctionTab";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import Explorer from "../Explorer";

export default class UserDefinedFunction implements ViewModels.UserDefinedFunction {
  public nodeKind: string;
  public container: Explorer;
  public collection: ViewModels.Collection;
  public self: string;
  public rid: string;
  public id: ko.Observable<string>;
  public body: ko.Observable<string>;

  constructor(container: Explorer, collection: ViewModels.Collection, data: DataModels.UserDefinedFunction) {
    this.nodeKind = "UserDefinedFunction";
    this.container = container;

    this.collection = collection;
    this.self = data._self;
    this.rid = data._rid;
    this.id = ko.observable(data.id);
    this.body = ko.observable(data.body);
  }

  public static create(source: ViewModels.Collection, event: MouseEvent) {
    const id = source.container.tabsManager.getTabs(ViewModels.CollectionTabKind.UserDefinedFunctions).length + 1;
    const userDefinedFunction = <DataModels.UserDefinedFunction>{
      id: "",
      body: "function userDefinedFunction(){}"
    };

    const userDefinedFunctionTab: UserDefinedFunctionTab = new UserDefinedFunctionTab({
      resource: userDefinedFunction,
      isNew: true,
      tabKind: ViewModels.CollectionTabKind.UserDefinedFunctions,
      title: `New UDF ${id}`,
      tabPath: "",
      documentClientUtility: source.container.documentClientUtility,
      collection: source,
      node: source,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(source.databaseId, source.id())}/udf`,
      selfLink: "",
      isActive: ko.observable(false),
      onUpdateTabsButtons: source.container.onUpdateTabsButtons
    });

    source.container.tabsManager.activateNewTab(userDefinedFunctionTab);
  }

  public open = () => {
    this.select();

    const userDefinedFunctionTabs: UserDefinedFunctionTab[] = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.UserDefinedFunctions,
      (tab: ViewModels.Tab) => tab.collection && tab.collection.rid === this.rid
    ) as UserDefinedFunctionTab[];
    let userDefinedFunctionTab: UserDefinedFunctionTab = userDefinedFunctionTabs && userDefinedFunctionTabs[0];

    if (userDefinedFunctionTab) {
      this.container.tabsManager.activateTab(userDefinedFunctionTab);
    } else {
      const userDefinedFunctionData = <DataModels.UserDefinedFunction>{
        _rid: this.rid,
        _self: this.self,
        id: this.id(),
        body: this.body()
      };

      userDefinedFunctionTab = new UserDefinedFunctionTab({
        resource: userDefinedFunctionData,
        isNew: false,
        tabKind: ViewModels.CollectionTabKind.UserDefinedFunctions,
        title: userDefinedFunctionData.id,
        tabPath: "",
        documentClientUtility: this.container.documentClientUtility,
        collection: this.collection,
        node: this,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(
          this.collection.databaseId,
          this.collection.id()
        )}/udfs/${this.id()}`,
        selfLink: "",
        isActive: ko.observable(false),
        onUpdateTabsButtons: this.container.onUpdateTabsButtons
      });

      this.container.tabsManager.activateNewTab(userDefinedFunctionTab);
    }
  };

  public select() {
    this.container.selectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "UDF item node",
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
  }

  public delete() {
    if (!window.confirm("Are you sure you want to delete the user defined function?")) {
      return;
    }

    const userDefinedFunctionData = <DataModels.UserDefinedFunction>{
      _rid: this.rid,
      _self: this.self,
      id: this.id(),
      body: this.body()
    };
    this.container.documentClientUtility.deleteUserDefinedFunction(this.collection, userDefinedFunctionData).then(
      () => {
        this.container.tabsManager.removeTabByComparator(
          (tab: ViewModels.Tab) => tab.node && tab.node.rid === this.rid
        );
        this.collection.children.remove(this);
      },
      reason => {}
    );
  }
}
