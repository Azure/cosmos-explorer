import { ActionType, TabKind } from "Contracts/ActionContracts";
import React from "react";
import MongoUtility from "../../../Common/MongoUtility";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useTabs } from "../../../hooks/useTabs";
import Explorer from "../../Explorer";
import { NewQueryTab } from "../QueryTab/QueryTab";
import { IQueryTabComponentProps, ITabAccessor, QueryTabComponent } from "../QueryTab/QueryTabComponent";

export interface IMongoQueryTabProps {
  container: Explorer;
  viewModelcollection?: ViewModels.Collection;
}

export class NewMongoQueryTab extends NewQueryTab {
  public collection: ViewModels.Collection;
  public iMongoQueryTabComponentProps: IQueryTabComponentProps;
  public queryText: string;

  constructor(
    options: ViewModels.QueryTabOptions,
    private mongoQueryTabProps: IMongoQueryTabProps,
  ) {
    super(options, mongoQueryTabProps);
    this.queryText = options.queryText ?? "";
    this.iMongoQueryTabComponentProps = {
      collection: options.collection,
      isExecutionError: this.isExecutionError(),
      tabId: this.tabId,
      tabsBaseInstance: this,
      queryText: this.queryText,
      partitionKey: this.partitionKey,
      splitterDirection: options.splitterDirection,
      queryViewSizePercent: options.queryViewSizePercent,
      container: this.mongoQueryTabProps.container,
      onTabAccessor: (instance: ITabAccessor): void => {
        this.iTabAccessor = instance;
      },
      isPreferredApiMongoDB: true,
      monacoEditorSetting: "plaintext",
      viewModelcollection: this.mongoQueryTabProps.viewModelcollection,
      onUpdatePersistedState: (state: {
        queryText: string;
        splitterDirection: string;
        queryViewSizePercent: number;
      }): void => {
        this.persistedState = {
          actionType: ActionType.OpenCollectionTab,
          tabKind: TabKind.SQLQuery,
          databaseResourceId: options.collection.databaseId,
          collectionResourceId: options.collection.id(),
          query: {
            text: state.queryText,
          },
          splitterDirection: state.splitterDirection as "vertical" | "horizontal",
          queryViewSizePercent: state.queryViewSizePercent,
        };
        if (this.triggerPersistState) {
          this.triggerPersistState();
        }
      },
    };
  }

  /** Renders a Javascript object to be displayed inside Monaco Editor */
  //eslint-disable-next-line
  public renderObjectForEditor(value: any, replacer: any, space: string | number): string {
    return MongoUtility.tojson(value, undefined, false);
  }

  public canDuplicate(): boolean {
    return true;
  }

  public duplicateTab(): void {
    const id = useTabs.getState().getTabs(ViewModels.CollectionTabKind.Query).length + 1;
    const queryText = this.iTabAccessor?.onSaveClickEvent() ?? this.persistedState?.query?.text ?? "";
    const newTab = new NewMongoQueryTab(
      {
        tabKind: ViewModels.CollectionTabKind.Query,
        title: `Query ${id}`,
        tabPath: "",
        collection: this.collection,
        node: this.collection,
        queryText,
        partitionKey: this.partitionKey,
        splitterDirection: this.persistedState?.splitterDirection,
        queryViewSizePercent: this.persistedState?.queryViewSizePercent,
      },
      this.mongoQueryTabProps,
    );
    useTabs.getState().activateNewTab(newTab);
  }

  public render(): JSX.Element {
    return <QueryTabComponent {...this.iMongoQueryTabComponentProps} />;
  }
}
