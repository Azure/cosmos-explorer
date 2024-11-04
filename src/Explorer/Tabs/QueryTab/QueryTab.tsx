import { sendMessage } from "Common/MessageHandler";
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
    };
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
