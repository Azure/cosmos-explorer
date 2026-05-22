import { ActionType, OpenCollectionTab, TabKind } from "Contracts/ActionContracts";
import React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import { SettingsComponent } from "../Controls/Settings/SettingsComponent";
import TabsBase from "./TabsBase";

export class SettingsTabV2 extends TabsBase {
  public render(): JSX.Element {
    return <SettingsComponent settingsTab={this} />;
  }
}

export class CollectionSettingsTabV2 extends SettingsTabV2 {
  protected persistedState: OpenCollectionTab;

  constructor(options: ViewModels.TabOptions) {
    super(options);
    this.persistedState = {
      actionType: ActionType.OpenCollectionTab,
      tabKind: TabKind.ScaleSettings,
      databaseResourceId: options.collection.databaseId,
      collectionResourceId: options.collection.id(),
    };
  }

  public onActivate(): void {
    super.onActivate();
    this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.CollectionSettingsV2);
  }
}

export class DatabaseSettingsTabV2 extends SettingsTabV2 {
  public onActivate(): void {
    super.onActivate();
    this.database.selectedSubnodeKind(ViewModels.CollectionTabKind.DatabaseSettingsV2);
  }
}
