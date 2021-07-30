import { IColumn } from "@fluentui/react";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import QueryViewModel from "../../Tables/QueryBuilder/QueryViewModel";
import TabsBase from "../TabsBase";
import NewQueryTablesTab from "./QueryTablesTab";

export interface Button {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
}

export interface IOption {
  key: string;
  text: string;
}
export interface IDocument {
  partitionKey: string;
  rowKey: string;
  timeStamp: string;
}
export interface IQueryTablesTabComponentProps {
  tabKind: ViewModels.CollectionTabKind;
  title: string;
  tabPath: string;
  collection: ViewModels.CollectionBase;
  node: ViewModels.TreeNode;
  onLoadStartKey: number;
  container: Explorer;
  tabsBaseInstance: TabsBase;
  queryTablesTab: NewQueryTablesTab;
}

export interface IQueryTablesTabComponentStates {
  tableEntityListViewModel: TableEntityListViewModel;
  queryViewModel: QueryViewModel;
  queryText: string;
  selectedQueryText: string;
  executeQueryButton: Button;
  queryBuilderButton: Button;
  queryTextButton: Button;
  addEntityButton: Button;
  editEntityButton: Button;
  deleteEntityButton: Button;
  isHelperActive: boolean;
  columns: IColumn[];
  items: IDocument[];
  isExpanded: boolean;
  queryTableRows: IQueryTableRowsType[];
}

export interface IQueryTableRowsType {
  isQueryTableEntityChecked: boolean;
  isTimeStampSelected: boolean;
  selectedOperator: string;
  selectedField: string;
  entityValue: string;
  selectedEntityType: string;
  selectedOperation: string;
  selectedTimestamp: string;
  fieldOptions: IOption[];
  opertorOptions: IOption[];
  entityTypeOptions: IOption[];
  opertionOptions: IOption[];
  timestampOptions: IOption[];
  id: number;
}

export const opertionOptions = [
  { key: "And", text: "And" },
  { key: "Or", text: "Or" },
];
export const opertorOptions = [
  { key: "=", text: "=" },
  { key: ">", text: ">" },
  { key: ">=", text: ">=" },
  { key: "<", text: "<" },
  { key: "<=", text: "<=" },
  { key: "<>", text: "<>" },
];

export const fieldOptions = [
  { key: "PartitionKey", text: "PartitionKey" },
  { key: "RowKey", text: "RowKey" },
  { key: "Timestamp", text: "Timestamp" },
  { key: "t3PN", text: "t3PN" },
];

export const entityTypeOptions = [
  { key: "String", text: "String" },
  { key: "Boolean", text: "Boolean" },
  { key: "Binary", text: "Binary" },
  { key: "DateTime", text: "DateTime" },
  { key: "Double", text: "Double" },
  { key: "Guid", text: "Guid" },
  { key: "Int32", text: "Int32" },
  { key: "Int64", text: "Int64" },
];

export const timestampOptions = [
  { key: "Last hour", text: "Last hour" },
  { key: "Last 24 hours", text: "Last 24 hours" },
  { key: "Last 7 days", text: "Last 7 days" },
  { key: "Last 31 days", text: "Last 31 days" },
  { key: "Last 365 days", text: "Last 365 days" },
  { key: "Current month", text: "Current month" },
  { key: "Current year", text: "Current year" },
];
