import {
  Button,
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  TableRowData as RowStateBase,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableColumnDefinition,
  TableColumnId,
  TableColumnSizingOptions,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowId,
  TableSelectionCell,
  useArrowNavigationGroup,
  useTableColumnSizing_unstable,
  useTableFeatures,
  useTableSelection,
  useTableSort,
} from "@fluentui/react-components";
import {
  ArrowClockwise16Regular,
  ArrowResetRegular,
  DeleteRegular,
  EditRegular,
  MoreHorizontalRegular,
  TableResizeColumnRegular,
  TextSortAscendingRegular,
  TextSortDescendingRegular,
} from "@fluentui/react-icons";
import { NormalizedEventKey } from "Common/Constants";
import { TableColumnSelectionPane } from "Explorer/Panes/TableColumnSelectionPane/TableColumnSelectionPane";
import {
  ColumnSizesMap,
  readSubComponentState,
  saveSubComponentState,
  SubComponentName,
  WidthDefinition,
} from "Explorer/Tabs/DocumentsTabV2/DocumentsTabStateUtil";
import { INITIAL_SELECTED_ROW_INDEX, useDocumentsTabStyles } from "Explorer/Tabs/DocumentsTabV2/DocumentsTabV2";
import { selectionHelper } from "Explorer/Tabs/DocumentsTabV2/SelectionHelper";
import { LayoutConstants } from "Explorer/Theme/ThemeUtil";
import { isEnvironmentCtrlPressed, isEnvironmentShiftPressed } from "Utils/KeyboardUtils";
import { useSidePanel } from "hooks/useSidePanel";
import React, { useCallback, useMemo } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import * as ViewModels from "../../../Contracts/ViewModels";

export type DocumentsTableComponentItem = {
  id: string;
} & Record<string, string | number>;

export type ColumnDefinition = {
  id: string;
  label: string;
  isPartitionKey: boolean;
};
export interface IDocumentsTableComponentProps {
  onRefreshTable: () => void;
  items: DocumentsTableComponentItem[];
  onItemClicked: (index: number) => void;
  onSelectedRowsChange: (selectedItemsIndices: Set<TableRowId>) => void;
  selectedRows: Set<TableRowId>;
  size: { height: number; width: number };
  selectedColumnIds: string[];
  columnDefinitions: ColumnDefinition[];
  style?: React.CSSProperties;
  isSelectionDisabled?: boolean;
  collection: ViewModels.CollectionBase;
  onColumnSelectionChange?: (newSelectedColumnIds: string[]) => void;
  defaultColumnSelection?: string[];
}

interface TableRowData extends RowStateBase<DocumentsTableComponentItem> {
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  selected: boolean;
  appearance: "brand" | "none";
}
interface ReactWindowRenderFnProps extends ListChildComponentProps {
  data: TableRowData[];
}

const COLUMNS_MENU_NAME = "columnsMenu";

export const DocumentsTableComponent: React.FC<IDocumentsTableComponentProps> = ({
  onRefreshTable,
  items,
  onSelectedRowsChange,
  selectedRows,
  style,
  size,
  selectedColumnIds,
  columnDefinitions,
  isSelectionDisabled,
  collection,
  onColumnSelectionChange,
  defaultColumnSelection,
}: IDocumentsTableComponentProps) => {
  const styles = useDocumentsTabStyles();

  const defaultSize: WidthDefinition = {
    idealWidth: 200,
    minWidth: 50,
  };

  const [columnSizingOptions, setColumnSizingOptions] = React.useState<TableColumnSizingOptions>(() => {
    const columnSizesMap: ColumnSizesMap = readSubComponentState(SubComponentName.ColumnSizes, collection, {});
    const columnSizesPx: ColumnSizesMap = {};
    selectedColumnIds.forEach((columnId) => {
      columnSizesPx[columnId] = (columnSizesMap && columnSizesMap[columnId]) || defaultSize;
    });
    return columnSizesPx;
  });

  const [sortState, setSortState] = React.useState<{
    sortDirection: "ascending" | "descending";
    sortColumn: TableColumnId | undefined;
  }>({
    sortDirection: undefined,
    sortColumn: undefined,
  });

  const onColumnResize = React.useCallback((_, { columnId, width }) => {
    setColumnSizingOptions((state) => {
      const newSizingOptions = {
        ...state,
        [columnId]: {
          ...state[columnId],
          idealWidth: width,
        },
      };

      saveSubComponentState(SubComponentName.ColumnSizes, collection, newSizingOptions, true);

      return newSizingOptions;
    });
  }, []);

  // const restoreFocusTargetAttribute = useRestoreFocusTarget();

  // Columns must be a static object and cannot change on re-renders otherwise React will complain about too many refreshes
  const columns: TableColumnDefinition<DocumentsTableComponentItem>[] = useMemo(
    () =>
      columnDefinitions
        .filter((column) => selectedColumnIds.includes(column.id))
        .map((column) => ({
          columnId: column.id,
          compare: (a, b) => {
            if (typeof a[column.id] === "string") {
              return (a[column.id] as string).localeCompare(b[column.id] as string);
            } else if (typeof a[column.id] === "number") {
              return (a[column.id] as number) - (b[column.id] as number);
            } else {
              // Should not happen
              return 0;
            }
          },
          renderHeaderCell: () => (
            <>
              <span title={column.label}>{column.label}</span>
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Button
                    // {...restoreFocusTargetAttribute}
                    appearance="transparent"
                    aria-label="Select column"
                    size="small"
                    icon={<MoreHorizontalRegular />}
                    style={{ position: "absolute", right: 0 }}
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem key="refresh" icon={<ArrowClockwise16Regular />} onClick={onRefreshTable}>
                      Refresh
                    </MenuItem>
                    <MenuItem
                      icon={<TextSortAscendingRegular />}
                      onClick={(e) => setColumnSort(e, column.id, "ascending")}
                    >
                      Sort ascending
                    </MenuItem>
                    <MenuItem
                      icon={<TextSortDescendingRegular />}
                      onClick={(e) => setColumnSort(e, column.id, "descending")}
                    >
                      Sort descending
                    </MenuItem>
                    <MenuItem icon={<ArrowResetRegular />} onClick={(e) => setColumnSort(e, undefined, undefined)}>
                      Reset sorting
                    </MenuItem>
                    <MenuItem key="editcolumns" icon={<EditRegular />} onClick={openColumnSelectionPane}>
                      Edit columns
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem
                      key="keyboardresize"
                      icon={<TableResizeColumnRegular />}
                      onClick={columnSizing.enableKeyboardMode(column.id)}
                    >
                      Resize with left/right arrow keys
                    </MenuItem>
                    <MenuItem
                      key="remove"
                      icon={<DeleteRegular />}
                      onClick={() => {
                        // Remove column id from selectedColumnIds
                        const index = selectedColumnIds.indexOf(column.id);
                        if (index === -1) {
                          return;
                        }
                        const newSelectedColumnIds = [...selectedColumnIds];
                        newSelectedColumnIds.splice(index, 1);
                        onColumnSelectionChange(newSelectedColumnIds);
                      }}
                    >
                      Remove column
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </>
          ),
          renderCell: (item) => (
            <TableCellLayout truncate title={`${item[column.id]}`}>
              {item[column.id]}
            </TableCellLayout>
          ),
        })),
    [columnDefinitions, onColumnSelectionChange, selectedColumnIds],
  );

  const [selectionStartIndex, setSelectionStartIndex] = React.useState<number>(INITIAL_SELECTED_ROW_INDEX);
  const onTableCellClicked = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (isSelectionDisabled) {
        // Only allow click
        onSelectedRowsChange(new Set<TableRowId>([index]));
        setSelectionStartIndex(index);
        return;
      }

      const result = selectionHelper(
        selectedRows as Set<number>,
        index,
        isEnvironmentShiftPressed(e),
        isEnvironmentCtrlPressed(e),
        selectionStartIndex,
      );
      onSelectedRowsChange(result.selection);
      if (result.selectionStartIndex !== undefined) {
        setSelectionStartIndex(result.selectionStartIndex);
      }
    },
    [isSelectionDisabled, selectedRows, selectionStartIndex, onSelectedRowsChange],
  );

  /**
   * Callback for when:
   * - a key has been pressed on the cell
   * - a key is down and the cell is clicked by the mouse
   */
  const onIdClicked = useCallback(
    (e: React.KeyboardEvent<Element>, index: number) => {
      if (e.key === NormalizedEventKey.Enter || e.key === NormalizedEventKey.Space) {
        onSelectedRowsChange(new Set<TableRowId>([index]));
      }
    },
    [onSelectedRowsChange],
  );

  const RenderRow = ({ index, style, data }: ReactWindowRenderFnProps) => {
    const { item, selected, appearance, onClick, onKeyDown } = data[index];
    return (
      <TableRow
        aria-rowindex={index + 2}
        className={styles.tableRow}
        style={{
          ...style,
          cursor: "pointer",
          userSelect: "none",
        }}
        key={item.id}
        aria-selected={selected}
        appearance={appearance}
      >
        {!isSelectionDisabled && (
          <TableSelectionCell
            checked={selected}
            checkboxIndicator={{ "aria-label": "Select row" }}
            onClick={(e: React.MouseEvent) => {
              setSelectionStartIndex(index);
              onClick(e);
            }}
            onKeyDown={onKeyDown}
          />
        )}
        {columns.map((column) => (
          <TableCell
            key={column.columnId}
            className={styles.tableCell}
            // When clicking on a cell with shift/ctrl key, onKeyDown is called instead of onClick.
            onClick={(e: React.MouseEvent<Element, MouseEvent>) => onTableCellClicked(e, index)}
            onKeyPress={(e: React.KeyboardEvent<Element>) => onIdClicked(e, index)}
            {...columnSizing.getTableCellProps(column.columnId)}
            tabIndex={column.columnId === "id" ? 0 : -1}
          >
            {column.renderCell(item)}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  const {
    getRows,
    columnSizing_unstable: columnSizing,
    tableRef,
    selection: { allRowsSelected, someRowsSelected, toggleAllRows, toggleRow, isRowSelected },
    sort: { getSortDirection, setColumnSort, sort },
  } = useTableFeatures(
    {
      columns,
      items,
    },
    [
      useTableColumnSizing_unstable({ columnSizingOptions, onColumnResize }),
      useTableSelection({
        selectionMode: isSelectionDisabled ? "single" : "multiselect",
        selectedItems: selectedRows,
        // eslint-disable-next-line react/prop-types
        onSelectionChange: (e, data) => onSelectedRowsChange(data.selectedItems),
      }),
      useTableSort({
        sortState,
        onSortChange: (e, nextSortState) => setSortState(nextSortState),
      }),
    ],
  );

  const headerSortProps = (columnId: TableColumnId) => ({
    // onClick: (e: React.MouseEvent) => toggleColumnSort(e, columnId),
    sortDirection: getSortDirection(columnId),
  });

  const rows: TableRowData[] = sort(
    getRows((row) => {
      const selected = isRowSelected(row.rowId);
      return {
        ...row,
        onClick: (e: React.MouseEvent) => toggleRow(e, row.rowId),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === " ") {
            e.preventDefault();
            toggleRow(e, row.rowId);
          }
        },
        selected,
        appearance: selected ? ("brand" as const) : ("none" as const),
      };
    }),
  );

  const toggleAllKeydown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === " ") {
        toggleAllRows(e);
        e.preventDefault();
      }
    },
    [toggleAllRows],
  );

  // Cell keyboard navigation
  const keyboardNavAttr = useArrowNavigationGroup({ axis: "grid" });

  // TODO: Bug in fluent UI typings that requires any here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableProps: any = {
    "aria-label": "Filtered documents table",
    role: "grid",
    ...columnSizing.getTableProps(),
    ...keyboardNavAttr,
    size: "small",
    ref: tableRef,
    ...style,
  };

  const checkedValues: { [COLUMNS_MENU_NAME]: string[] } = {
    [COLUMNS_MENU_NAME]: [],
  };
  columnDefinitions.forEach(
    (columnDefinition) =>
      selectedColumnIds.includes(columnDefinition.id) && checkedValues[COLUMNS_MENU_NAME].push(columnDefinition.id),
  );

  const openColumnSelectionPane = (): void => {
    useSidePanel
      .getState()
      .openSidePanel(
        "Select columns",
        <TableColumnSelectionPane
          selectedColumnIds={selectedColumnIds}
          columnDefinitions={columnDefinitions}
          onSelectionChange={onColumnSelectionChange}
          defaultSelection={defaultColumnSelection}
        />,
      );
  };

  return (
    <Table noNativeElements sortable {...tableProps}>
      <TableHeader>
        <TableRow className={styles.tableRow} style={{ width: size ? size.width - 15 : "100%" }}>
          {!isSelectionDisabled && (
            <TableSelectionCell
              key="selectcell"
              checked={allRowsSelected ? true : someRowsSelected ? "mixed" : false}
              onClick={toggleAllRows}
              onKeyDown={toggleAllKeydown}
              checkboxIndicator={{ "aria-label": "Select all rows " }}
            />
          )}
          {columns.map((column) => (
            <TableHeaderCell
              className={styles.tableCell}
              key={column.columnId}
              {...columnSizing.getTableHeaderCellProps(column.columnId)}
              {...headerSortProps(column.columnId)}
            >
              {column.renderHeaderCell()}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <List
          height={size !== undefined ? size.height - LayoutConstants.rowHeight /* table header */ : 0}
          itemCount={items.length}
          itemSize={LayoutConstants.rowHeight}
          width={size ? size.width : 0}
          itemData={rows}
          style={{ overflowY: "scroll" }}
        >
          {RenderRow}
        </List>
      </TableBody>
    </Table>
  );
};
