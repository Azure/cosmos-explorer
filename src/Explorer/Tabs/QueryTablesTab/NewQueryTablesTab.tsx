import React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import type { TabOptions } from "../../../Contracts/ViewModels";
import { useTabs } from "../../../hooks/useTabs";
import Explorer from "../../Explorer";
import TableCommands from "../../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import TabsBase from "../TabsBase";
import {
  IQueryTablesTabAccessor,
  IQueryTablesTabComponentProps,
  QueryTablesTabComponent,
} from "./QueryTablesTabComponent";

export interface IQueryTablesTabProps {
  container: Explorer;
}

export class NewQueryTablesTab extends TabsBase {
  public queryText: string;
  public currentQuery: string;
  public partitionKey: DataModels.PartitionKey;
  public iQueryTablesTabComponentProps: IQueryTablesTabComponentProps;
  public tableEntityListViewModel: TableEntityListViewModel;
  public tableCommands: TableCommands;
  public iQueryTablesTabAccessor: IQueryTablesTabAccessor;

  constructor(options: TabOptions, private props: IQueryTablesTabProps) {
    super(options);
    this.tableCommands = new TableCommands(props.container);
    this.tableEntityListViewModel = new TableEntityListViewModel(this.tableCommands, this);
    this.iQueryTablesTabComponentProps = {
      collection: this.collection,
      tabId: this.tabId,
      tabsBaseInstance: this,
      queryTablesTab: this,
      container: this.props.container,
      onQueryTablesTabAccessor: (instance: IQueryTablesTabAccessor) => {
        this.iQueryTablesTabAccessor = instance;
      },
    };
  }

  public render(): JSX.Element {
    return <QueryTablesTabComponent {...this.iQueryTablesTabComponentProps} />;
  }

  public onTabClick(): void {
    useTabs.getState().activateTab(this);
    this.iQueryTablesTabAccessor.onTabClickEvent();
  }
}
