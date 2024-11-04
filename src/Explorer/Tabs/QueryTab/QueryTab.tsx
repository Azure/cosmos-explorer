import { sendMessage } from "Common/MessageHandler";
import { ActionType, OpenQueryTab, TabKind } from "Contracts/ActionContracts";
import { MessageTypes } from "Contracts/MessageTypes";
import { CopilotProvider } from "Explorer/QueryCopilot/QueryCopilotContext";
import { userContext } from "UserContext";
import React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import type { QueryTabOptions } from "../../../Contracts/ViewModels";
import { useTabs } from "../../../hooks/useTabs";
import Explorer from "../../Explorer";
import {
  IQueryTabComponentProps,
  ITabAccessor,
  QueryTabComponent,
  QueryTabCopilotComponent,
} from "../../Tabs/QueryTab/QueryTabComponent";
import TabsBase from "../TabsBase";

export interface IQueryTabProps {
  container: Explorer;
}

export class NewQueryTab extends TabsBase {
  public queryText: string;
  public currentQuery: string;
  public partitionKey: DataModels.PartitionKey;
  public iQueryTabComponentProps: IQueryTabComponentProps;
  public iTabAccessor: ITabAccessor;

  protected persistedState: OpenQueryTab;

  constructor(
    options: QueryTabOptions,
    private props: IQueryTabProps,
  ) {
    super(options);
    this.partitionKey = options.partitionKey;
    this.iQueryTabComponentProps = {
      collection: this.collection,
      isExecutionError: this.isExecutionError(),
      tabId: this.tabId,
      tabsBaseInstance: this,
      queryText: options.queryText,
      partitionKey: this.partitionKey,
      stringsplitterDirection: options.stringsplitterDirection,
      queryViewSizePercent: options.queryViewSizePercent,
      container: this.props.container,
      onTabAccessor: (instance: ITabAccessor): void => {
        this.iTabAccessor = instance;
      },
      isPreferredApiMongoDB: false,
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

    // set initial state
    this.iQueryTabComponentProps.onUpdatePersistedState({
      queryText: options.queryText,
      splitterDirection: options.stringsplitterDirection,
      queryViewSizePercent: options.queryViewSizePercent,
    });
  }

  public render(): JSX.Element {
    return userContext.apiType === "SQL" ? (
      <CopilotProvider>
        <QueryTabCopilotComponent {...this.iQueryTabComponentProps} />
      </CopilotProvider>
    ) : (
      <QueryTabComponent {...this.iQueryTabComponentProps} />
    );
  }

  public onActivate(): void {
    this.propagateTabInformation(MessageTypes.ActivateTab);
    super.onActivate();
  }

  public onTabClick(): void {
    useTabs.getState().activateTab(this);
    this.iTabAccessor.onTabClickEvent();
  }

  public onCloseTabButtonClick(): void {
    useTabs.getState().closeTab(this);
    this.propagateTabInformation(MessageTypes.CloseTab);
    if (this.iTabAccessor) {
      this.iTabAccessor.onCloseClickEvent(true);
    }
  }

  public getContainer(): Explorer {
    return this.props.container;
  }

  private propagateTabInformation(type: MessageTypes): void {
    sendMessage({
      type,
      data: {
        kind: this.tabKind,
        databaseId: this.collection?.databaseId,
        collectionId: this.collection?.id?.(),
      },
    });
  }
}
