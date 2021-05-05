import { Checkbox, Text } from "office-ui-fabric-react";
import React, { FunctionComponent, useEffect, useState } from "react";
import { userContext } from "../../../../UserContext";
import Explorer from "../../../Explorer";
import * as Constants from "../../../Tables/Constants";
import QueryViewModel from "../../../Tables/QueryBuilder/QueryViewModel";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "../../GenericRightPaneComponent/GenericRightPaneComponent";

interface TableQuerySelectPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  queryViewModel: QueryViewModel;
}

interface ISelectColumn {
  columnName: string;
  selected: boolean;
  editable: boolean;
}

export const TableQuerySelectPanel: FunctionComponent<TableQuerySelectPanelProps> = ({
  explorer,
  closePanel,
  queryViewModel,
}: TableQuerySelectPanelProps): JSX.Element => {
  const [columnOptions, setColumnOptions] = useState<ISelectColumn[]>([
    { columnName: "", selected: true, editable: false },
  ]);
  const [isAvailableColumnChecked, setIsAvailableColumnChecked] = useState<boolean>(true);

  const genericPaneProps: GenericRightPaneProps = {
    formError: "",
    formErrorDetail: "",
    id: "querySelectPane",
    isExecuting: false,
    title: "Select Column",
    submitButtonText: "OK",
    onClose: () => closePanel(),
    onSubmit: () => submit(),
    expandConsole: () => explorer.expandConsole(),
  };

  const submit = (): void => {
    queryViewModel.selectText(getParameters());
    queryViewModel.getSelectMessage();
    closePanel();
  };

  const handleClick = (isChecked: boolean, selectedColumn: string): void => {
    const columns = columnOptions.map((column) => {
      if (column.columnName === selectedColumn) {
        column.selected = isChecked;
        return { ...column };
      }
      return { ...column };
    });
    canSelectAll();
    setColumnOptions(columns);
  };

  useEffect(() => {
    queryViewModel && setTableColumns(queryViewModel.columnOptions());
  }, []);

  const setTableColumns = (columnNames: string[]): void => {
    const columns: ISelectColumn[] =
      columnNames &&
      columnNames.length &&
      columnNames.map((value: string) => {
        const columnOption: ISelectColumn = {
          columnName: value,
          selected: true,
          editable: isEntityEditable(value),
        };
        return columnOption;
      });
    setColumnOptions(columns);
  };

  const isEntityEditable = (name: string): boolean => {
    if (userContext.apiType === "Cassandra") {
      const cassandraKeys = queryViewModel.queryTablesTab.collection.cassandraKeys.partitionKeys
        .concat(queryViewModel.queryTablesTab.collection.cassandraKeys.clusteringKeys)
        .map((key) => key.property);
      return !cassandraKeys.includes(name);
    }
    return !(
      name === Constants.EntityKeyNames.PartitionKey ||
      name === Constants.EntityKeyNames.RowKey ||
      name === Constants.EntityKeyNames.Timestamp
    );
  };

  const availableColumnsCheckboxClick = (event: React.FormEvent<HTMLElement>, isChecked: boolean): void => {
    setIsAvailableColumnChecked(isChecked);
    selectClearAll(isChecked);
  };

  const selectClearAll = (isChecked: boolean): void => {
    const columns: ISelectColumn[] = columnOptions.map((column: ISelectColumn) => {
      if (isEntityEditable(column.columnName)) {
        column.selected = isChecked;
        return { ...column };
      }
      return { ...column };
    });
    setColumnOptions(columns);
  };

  const getParameters = (): string[] => {
    const selectedColumns = columnOptions.filter((value: ISelectColumn) => value.selected === true);
    const columns: string[] = selectedColumns.map((value: ISelectColumn) => {
      const name: string = value.columnName;
      return name;
    });

    return columns;
  };

  const canSelectAll = (): void => {
    const canSelectAllColumn: boolean = columnOptions.some((value: ISelectColumn) => {
      return !value.selected;
    });
    setIsAvailableColumnChecked(!canSelectAllColumn);
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          <Text>Select the columns that you want to query.</Text>
          <div className="column-select-view">
            <Checkbox
              id="availableCheckbox"
              label="Available Columns"
              checked={isAvailableColumnChecked}
              onChange={availableColumnsCheckboxClick}
            />
            {columnOptions.map((column) => {
              return (
                <Checkbox
                  label={column.columnName}
                  onChange={(_event, isChecked: boolean) => handleClick(isChecked, column.columnName)}
                  key={column.columnName}
                  checked={column.selected}
                  disabled={!column.editable}
                />
              );
            })}
          </div>
        </div>
      </div>
    </GenericRightPaneComponent>
  );
};
