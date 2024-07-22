import {
  createTableColumn,
  Menu,
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
} from "@fluentui/react-components";
import { NormalizedEventKey } from "Common/Constants";
import {
  ColumnSizesMap,
  readSubComponentState,
  saveSubComponentState,
  WidthDefinition,
} from "Explorer/Tabs/DocumentsTabV2/DocumentsTabStateUtil";
import { selectionHelper } from "Explorer/Tabs/DocumentsTabV2/SelectionHelper";
import { isEnvironmentCtrlPressed, isEnvironmentShiftPressed } from "Utils/KeyboardUtils";
import React, { useCallback, useMemo } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import * as ViewModels from "../../../Contracts/ViewModels";

export type DocumentsTableComponentItem = {
  id: string;
} & Record<string, string>;

export type ColumnHeaders = {
  idHeader: string;
  partitionKeyHeaders: string[];
};
export interface IDocumentsTableComponentProps {
  items: DocumentsTableComponentItem[];
  onItemClicked: (index: number) => void;
  onSelectedRowsChange: (selectedItemsIndices: Set<TableRowId>) => void;
  selectedRows: Set<TableRowId>;
  size: { height: number; width: number };
  columnHeaders: ColumnHeaders;
  style?: React.CSSProperties;
  isSelectionDisabled?: boolean;
  collection: ViewModels.CollectionBase;
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

const defaultSize: WidthDefinition = {
  idealWidth: 200,
  minWidth: 50,
};

export const DocumentsTableComponent: React.FC<IDocumentsTableComponentProps> = ({
  items,
  onSelectedRowsChange,
  selectedRows,
  style,
  size,
  columnHeaders,
  isSelectionDisabled,
  collection,
}: IDocumentsTableComponentProps) => {
  const [columnSizingOptions, setColumnSizingOptions] = React.useState<TableColumnSizingOptions>(() => {
    const columnIds = ["id"].concat(columnHeaders.partitionKeyHeaders);
    const columnSizesMap: ColumnSizesMap = readSubComponentState("ColumnSizes", collection, {});
    const columnSizesPx: ColumnSizesMap = {};
    columnIds.forEach((columnId) => {
      columnSizesPx[columnId] = (columnSizesMap && columnSizesMap[columnId]) || defaultSize;
    });
    return columnSizesPx;
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

      saveSubComponentState("ColumnSizes", collection, newSizingOptions, true);

      return newSizingOptions;
    });
  }, []);

  // Columns must be a static object and cannot change on re-renders otherwise React will complain about too many refreshes
  const columns: TableColumnDefinition<DocumentsTableComponentItem>[] = useMemo(
    () =>
      [
        createTableColumn<DocumentsTableComponentItem>({
          columnId: "id",
          compare: (a, b) => a.id.localeCompare(b.id),
          renderHeaderCell: () => columnHeaders.idHeader,
          renderCell: (item) => (
            <TableCellLayout truncate title={item.id}>
              {item.id}
            </TableCellLayout>
          ),
        }),
      ].concat(
        columnHeaders.partitionKeyHeaders.map((pkHeader) =>
          createTableColumn<DocumentsTableComponentItem>({
            columnId: pkHeader,
            compare: (a, b) => a[pkHeader].localeCompare(b[pkHeader]),
            // Show Refresh button on last column
            renderHeaderCell: () => <span title={pkHeader}>{pkHeader}</span>,
            renderCell: (item) => (
              <TableCellLayout truncate title={item[pkHeader]}>
                {item[pkHeader]}
              </TableCellLayout>
            ),
          }),
        ),
      ),
    [columnHeaders],
  );

  const [selectionStartIndex, setSelectionStartIndex] = React.useState<number>(undefined);
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
        style={{ ...style, cursor: "pointer", userSelect: "none" }}
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
            className="documentsTableCell"
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
    ],
  );

  const rows: TableRowData[] = getRows((row) => {
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
  });

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
    size: "extra-small",
    ref: tableRef,
    ...style,
  };

  return (
    <Table className="documentsTable" noNativeElements {...tableProps}>
      <TableHeader className="documentsTableHeader">
        <TableRow style={{ width: size ? size.width - 15 : "100%" }}>
          {!isSelectionDisabled && (
            <TableSelectionCell
              checked={allRowsSelected ? true : someRowsSelected ? "mixed" : false}
              onClick={toggleAllRows}
              onKeyDown={toggleAllKeydown}
              checkboxIndicator={{ "aria-label": "Select all rows " }}
            />
          )}
          {columns.map((column /* index */) => (
            <Menu openOnContext key={column.columnId}>
              <MenuTrigger>
                <TableHeaderCell
                  className="documentsTableCell"
                  key={column.columnId}
                  {...columnSizing.getTableHeaderCellProps(column.columnId)}
                >
                  {column.renderHeaderCell()}
                </TableHeaderCell>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={columnSizing.enableKeyboardMode(column.columnId)}>
                    Keyboard Column Resizing
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <List
          height={size !== undefined ? size.height - 32 /* table header */ - 21 /* load more */ : 0}
          itemCount={items.length}
          itemSize={30}
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
