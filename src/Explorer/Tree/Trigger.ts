import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import Collection from "./Collection";
import TriggerTab from "../Tabs/TriggerTab";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";

export default class Trigger implements ViewModels.Trigger {
  public nodeKind: string;
  public container: ViewModels.Explorer;
  public collection: ViewModels.Collection;
  public self: string;
  public rid: string;
  public id: ko.Observable<string>;
  public body: ko.Observable<string>;
  public triggerType: ko.Observable<string>;
  public triggerOperation: ko.Observable<string>;

  constructor(container: ViewModels.Explorer, collection: ViewModels.Collection, data: any) {
    this.nodeKind = "Trigger";
    this.container = container;
    this.collection = collection;
    this.self = data._self;
    this.rid = data._rid;
    this.id = ko.observable(data.id);
    this.body = ko.observable(data.body);
    this.triggerOperation = ko.observable(data.triggerOperation);
    this.triggerType = ko.observable(data.triggerType);
  }

  public select() {
    this.container.selectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Trigger node",
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public static create(source: ViewModels.Collection, event: MouseEvent) {
    const id =
      source.container
        .openedTabs()
        .filter((tab: ViewModels.Tab) => tab.tabKind === ViewModels.CollectionTabKind.Triggers).length + 1;
    const trigger = <DataModels.Trigger>{
      id: "",
      body: "function trigger(){}",
      triggerOperation: "All",
      triggerType: "Pre",
    };

    let triggerTab: ViewModels.Tab = new TriggerTab({
      resource: trigger,
      isNew: true,
      tabKind: ViewModels.CollectionTabKind.Triggers,
      title: `New Trigger ${id}`,
      tabPath: "",
      documentClientUtility: source.container.documentClientUtility,
      collection: source,
      node: source,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(source.databaseId, source.id())}/trigger`,
      selfLink: "",
      isActive: ko.observable(false),
      onUpdateTabsButtons: source.container.onUpdateTabsButtons,
      openedTabs: source.container.openedTabs(),
    });

    source.container.openedTabs.push(triggerTab);

    // Activate
    triggerTab.onTabClick();
  }

  public open = () => {
    this.select();

    let triggerTab: ViewModels.Tab = this.container
      .openedTabs()
      .filter((tab) => tab.node && tab.node.rid === this.rid)[0];
    if (!triggerTab) {
      const triggerData = <DataModels.Trigger>{
        _rid: this.rid,
        _self: this.self,
        id: this.id(),
        body: this.body(),
        triggerOperation: this.triggerOperation(),
        triggerType: this.triggerType(),
      };

      triggerTab = new TriggerTab({
        resource: triggerData,
        isNew: false,
        tabKind: ViewModels.CollectionTabKind.Triggers,
        title: triggerData.id,
        tabPath: "",
        documentClientUtility: this.container.documentClientUtility,
        collection: this.collection,
        node: this,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(
          this.collection.databaseId,
          this.collection.id()
        )}/triggers/${this.id()}`,
        selfLink: "",
        isActive: ko.observable(false),
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
        openedTabs: this.container.openedTabs(),
      });

      this.container.openedTabs.push(triggerTab);
    }

    // Activate
    triggerTab.onTabClick();
  };

  public delete() {
    if (!window.confirm("Are you sure you want to delete the trigger?")) {
      return;
    }

    const triggerData = <DataModels.Trigger>{
      _rid: this.rid,
      _self: this.self,
      id: this.id(),
      body: this.body(),
      triggerOperation: this.triggerOperation(),
      triggerType: this.triggerType(),
    };

    this.container.documentClientUtility.deleteTrigger(this.collection, triggerData).then(
      () => {
        this.container.openedTabs.remove((tab: ViewModels.Tab) => tab.node && tab.node.rid === this.rid);
        this.collection.children.remove(this);
      },
      (reason) => {}
    );
  }
}
