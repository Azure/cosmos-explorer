import {
  Button,
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  TableRowData as RowStateBase,
  SortDirection,
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
  tokens,
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
  ColumnSort,
  deleteDocumentsTabSubComponentState,
  readDocumentsTabSubComponentState,
  saveDocumentsTabSubComponentState,
  SubComponentName,
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
  onSelectedRowsChange: (selectedItemsIndices: Set<TableRowId>) => void;
  selectedRows: Set<TableRowId>;
  size: { height: number; width: number };
  selectedColumnIds: string[];
  columnDefinitions: ColumnDefinition[];
  style?: React.CSSProperties;
  isRowSelectionDisabled?: boolean;
  collection: ViewModels.CollectionBase;
  onColumnSelectionChange?: (newSelectedColumnIds: string[]) => void;
  defaultColumnSelection?: string[];
  isColumnSelectionDisabled?: boolean;
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

const defaultSize = {
  idealWidth: 200,
  minWidth: 50,
};

export const DocumentsTableComponent: React.FC<IDocumentsTableComponentProps> = ({
  onRefreshTable,
  items,
  onSelectedRowsChange,
  selectedRows,
  style,
  size,
  selectedColumnIds,
  columnDefinitions,
  isRowSelectionDisabled: isSelectionDisabled,
  collection,
  onColumnSelectionChange,
  defaultColumnSelection,
  isColumnSelectionDisabled,
}: IDocumentsTableComponentProps) => {
  const styles = useDocumentsTabStyles();

  const sortedRowsRef = React.useRef(null);

  const [columnSizingOptions, setColumnSizingOptions] = React.useState<TableColumnSizingOptions>(() => {
    const columnSizesMap: ColumnSizesMap = readDocumentsTabSubComponentState(
      SubComponentName.ColumnSizes,
      collection,
      {},
    );
    const columnSizesPx: TableColumnSizingOptions = {};
    selectedColumnIds.forEach((columnId) => {
      if (
        !columnSizesMap ||
        !columnSizesMap[columnId] ||
        columnSizesMap[columnId].widthPx === undefined ||
        isNaN(columnSizesMap[columnId].widthPx)
      ) {
        columnSizesPx[columnId] = defaultSize;
      } else {
        columnSizesPx[columnId] = {
          idealWidth: columnSizesMap[columnId].widthPx,
          minWidth: 50,
        };
      }
    });
    return columnSizesPx;
  });

  const [sortState, setSortState] = React.useState<{
    sortDirection: "ascending" | "descending";
    sortColumn: TableColumnId | undefined;
  }>(() => {
    const sort = readDocumentsTabSubComponentState<ColumnSort>(SubComponentName.ColumnSort, collection, undefined);

    if (!sort) {
      return {
        sortDirection: undefined,
        sortColumn: undefined,
      };
    }

    return {
      sortDirection: sort.direction,
      sortColumn: sort.columnId,
    };
  });

  const onColumnResize = React.useCallback((_, { columnId, width }: { columnId: string; width: number }) => {
    setColumnSizingOptions((state) => {
      const newSizingOptions = {
        ...state,
        [columnId]: {
          ...state[columnId],
          idealWidth: width,
        },
      };

      const persistentSizes = Object.keys(newSizingOptions).reduce((acc, key) => {
        acc[key] = {
          widthPx: newSizingOptions[key].idealWidth,
        };
        return acc;
      }, {} as ColumnSizesMap);

      saveDocumentsTabSubComponentState<ColumnSizesMap>(
        SubComponentName.ColumnSizes,
        collection,
        persistentSizes,
        true,
      );

      return newSizingOptions;
    });
  }, []);

  // const restoreFocusTargetAttribute = useRestoreFocusTarget();

  const onSortClick = (event: React.SyntheticEvent, columnId: string, direction: SortDirection) => {
    setColumnSort(event, columnId, direction);

    if (columnId === undefined || direction === undefined) {
      deleteDocumentsTabSubComponentState(SubComponentName.ColumnSort, collection);
      return;
    }

    saveDocumentsTabSubComponentState<ColumnSort>(SubComponentName.ColumnSort, collection, {
      columnId,
      direction,
    });
  };

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
                    style={{ position: "absolute", right: 10, backgroundColor: tokens.colorNeutralBackground1 }}
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem key="refresh" icon={<ArrowClockwise16Regular />} onClick={onRefreshTable}>
                      Refresh
                    </MenuItem>
                    <>
                      <MenuItem
                        icon={<TextSortAscendingRegular />}
                        onClick={(e) => onSortClick(e, column.id, "ascending")}
                      >
                        Sort ascending
                      </MenuItem>
                      <MenuItem
                        icon={<TextSortDescendingRegular />}
                        onClick={(e) => onSortClick(e, column.id, "descending")}
                      >
                        Sort descending
                      </MenuItem>
                      <MenuItem icon={<ArrowResetRegular />} onClick={(e) => onSortClick(e, undefined, undefined)}>
                        Reset sorting
                      </MenuItem>
                      {!isColumnSelectionDisabled && (
                        <MenuItem key="editcolumns" icon={<EditRegular />} onClick={openColumnSelectionPane}>
                          Edit columns
                        </MenuItem>
                      )}
                      <MenuDivider />
                    </>
                    <MenuItem
                      key="keyboardresize"
                      icon={<TableResizeColumnRegular />}
                      onClick={columnSizing.enableKeyboardMode(column.id)}
                    >
                      Resize with left/right arrow keys
                    </MenuItem>
                    {!isColumnSelectionDisabled && (
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
                    )}
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
    (e: React.MouseEvent | undefined, index: number, rowId: TableRowId) => {
      if (isSelectionDisabled) {
        // Only allow click
        onSelectedRowsChange(new Set<TableRowId>([rowId]));
        setSelectionStartIndex(index);
        return;
      }

      // The selection helper computes in the index space (what's visible to the user in the table, ie the sorted array).
      // selectedRows is in the rowId space (the index of the original unsorted array), so it must be converted to the index space.
      const selectedRowsIndex = new Set<number>();
      selectedRows.forEach((rowId) => {
        const index = sortedRowsRef.current.findIndex((row: TableRowData) => row.rowId === rowId);
        if (index !== -1) {
          selectedRowsIndex.add(index);
        } else {
          // This should never happen
          console.error(`Row with rowId ${rowId} not found in sorted rows`);
        }
      });

      const result = selectionHelper(
        selectedRowsIndex,
        index,
        e && isEnvironmentShiftPressed(e),
        e && isEnvironmentCtrlPressed(e),
        selectionStartIndex,
      );

      // Convert selectionHelper result from index space back to rowId space
      const selectedRowIds = new Set<TableRowId>();
      result.selection.forEach((index) => {
        selectedRowIds.add(sortedRowsRef.current[index].rowId);
      });
      onSelectedRowsChange(selectedRowIds);

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
    (e: React.KeyboardEvent<Element>, rowId: TableRowId) => {
      if (e.key === NormalizedEventKey.Enter || e.key === NormalizedEventKey.Space) {
        onSelectedRowsChange(new Set<TableRowId>([rowId]));
      }
    },
    [onSelectedRowsChange],
  );

  const RenderRow = ({ index, style, data }: ReactWindowRenderFnProps) => {
    // WARNING: because the table sorts the data, 'index' is not the same as 'rowId'
    // The rowId is the index of the item in the original array,
    // while the index is the index of the item in the sorted array
    const { item, selected, appearance, onClick, onKeyDown, rowId } = data[index];

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
            onClick={(e: React.MouseEvent<Element, MouseEvent>) => onTableCellClicked(e, index, rowId)}
            onKeyPress={(e: React.KeyboardEvent<Element>) => onIdClicked(e, rowId)}
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

  // Store the sorted rows in a ref which won't trigger a re-render (as opposed to a state)
  sortedRowsRef.current = rows;

  // If there are no selected rows, auto select the first row
  const [autoSelectFirstDoc, setAutoSelectFirstDoc] = React.useState<boolean>(true);
  React.useEffect(() => {
    if (autoSelectFirstDoc && sortedRowsRef.current?.length > 0 && selectedRows.size === 0) {
      setAutoSelectFirstDoc(false);
      const DOC_INDEX_TO_SELECT = 0;
      onTableCellClicked(undefined, DOC_INDEX_TO_SELECT, sortedRowsRef.current[DOC_INDEX_TO_SELECT].rowId);
    }
  }, [selectedRows, onTableCellClicked, autoSelectFirstDoc]);

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
    <Table noNativeElements {...tableProps}>
      <TableHeader className={styles.tableHeader}>
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
        <div className={styles.tableHeaderFiller}></div>
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
