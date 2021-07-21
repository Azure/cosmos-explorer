import React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import TableCommands from "../../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import TabsBase from "../TabsBase";
import QueryTablesTabComponent, { IQueryTablesTabComponentProps } from "./QueryTablesTabComponent";

interface QueryTablesTabProps {
  container: Explorer;
}

class NewQueryTablesTab extends TabsBase {
  public iQueryTablesTabCompProps: IQueryTablesTabComponentProps;
  public collection: ViewModels.Collection;
  public tableEntityListViewModel: TableEntityListViewModel;
  public tableCommands: TableCommands;

  constructor(options: ViewModels.TabOptions, props: QueryTablesTabProps) {
    super(options);
    this.tableCommands = new TableCommands(props.container);
    this.tableEntityListViewModel = new TableEntityListViewModel(this.tableCommands, this);
    this.iQueryTablesTabCompProps = {
      tabKind: options.tabKind,
      title: options.title,
      tabPath: options.tabPath,
      collection: options.collection,
      node: options.node,
      onLoadStartKey: options.onLoadStartKey,
      container: props.container,
      tabsBaseInstance: this,
      queryTablesTab: this,
    };
    console.log("🚀 ~ file: QueryTablesTab.tsx ~ line 13 ~ NewQueryTablesTab ~ constructor ~ props", props);
  }
  public render(): JSX.Element {
    return <QueryTablesTabComponent {...this.iQueryTablesTabCompProps} />;
  }
}

export default NewQueryTablesTab;
