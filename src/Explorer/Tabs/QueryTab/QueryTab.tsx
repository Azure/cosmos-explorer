import React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import type { QueryTabOptions } from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import { IQueryTabComponentProps, ITabAccessor } from "../../Tabs/QueryTab/QueryTabComponent";
import TabsBase from "../TabsBase";
import QueryTabComponent from "./QueryTabComponent";

export interface IQueryTabProps {
  container: Explorer;
}

export class NewQueryTab extends TabsBase {
  public queryText: string;
  public currentQuery: string;
  public partitionKey: DataModels.PartitionKey;
  public iQueryTabComponentProps: IQueryTabComponentProps;
  public iTabAccessor: ITabAccessor;

  constructor(options: QueryTabOptions, private props: IQueryTabProps) {
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
    return <QueryTabComponent {...this.iQueryTabComponentProps} />;
  }

  public onTabClick(): void {
    this.manager?.activateTab(this);
    this.iTabAccessor.onTabClickEvent();
  }

  public onCloseTabButtonClick(): void {
    this.manager?.closeTab(this);
    if (this.iTabAccessor) {
      this.iTabAccessor.onCloseClickEvent(true);
    }
  }

  public getContainer(): Explorer {
    return this.props.container;
  }
}
