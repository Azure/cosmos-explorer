import { CopilotProvider } from "Explorer/QueryCopilot/QueryCopilotContext";
import { userContext } from "UserContext";
import React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import type { QueryTabOptions } from "../../../Contracts/ViewModels";
import { useTabs } from "../../../hooks/useTabs";
import Explorer from "../../Explorer";
import QueryTabComponent, {
  IQueryTabComponentProps,
  ITabAccessor,
  QueryTabFunctionComponent,
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
        <QueryTabFunctionComponent {...this.iQueryTabComponentProps} />
      </CopilotProvider>
    ) : (<QueryTabComponent {...this.iQueryTabComponentProps} />);
  }

  public onTabClick(): void {
    useTabs.getState().activateTab(this);
    this.iTabAccessor.onTabClickEvent();
  }

  public onCloseTabButtonClick(): void {
    useTabs.getState().closeTab(this);
    if (this.iTabAccessor) {
      this.iTabAccessor.onCloseClickEvent(true);
    }
  }

  public getContainer(): Explorer {
    return this.props.container;
  }
}
