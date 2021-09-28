import { IColumn, Selection } from "@fluentui/react";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import * as Entities from "../../Tables/Entities";
import ClauseGroup from "../../Tables/QueryBuilder/ClauseGroup";
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
  isEditorActive: boolean;
  selectedItems: Entities.ITableEntity[];
  isValue: boolean;
  isTimestamp: boolean;
  isCustomLastTimestamp: boolean;
  isCustomRangeTimestamp: boolean;
  operators: string[];
  selectMessage: string;
  queryTableRows: IQueryTableRowsType[];
  originalItems: IDocument[];
  rowSelected: boolean;
  selection: Selection;
  entities: Entities.ITableEntity[];
  headers: string[];
  isLoading: boolean;
  queryErrorMessage: string;
  hasQueryError: boolean;
  currentPage: number;
  currentStartIndex: number;
  fromDocument: number;
  toDocument: number;
  selectedItem: number;
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
  operatorOptions: IOption[];
  entityTypeOptions: IOption[];
  operationOptions: IOption[];
  timestampOptions: IOption[];
  id: string;
  clauseGroup: ClauseGroup;
  isLocal: boolean;
  isTimestamp: boolean;
  isValue: boolean;
  isCustomRangeTimestamp: boolean;
  customTimeValue: string;
  timeValue: string;
}

export const getformattedOptions = (options: Array<string>): IOption[] => {
  return options.map((option) => {
    return { key: option, text: option };
  });
};
