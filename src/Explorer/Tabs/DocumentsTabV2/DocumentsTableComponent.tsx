import {
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
  createTableColumn,
  useArrowNavigationGroup,
  useTableColumnSizing_unstable,
  useTableFeatures,
  useTableSelection,
} from "@fluentui/react-components";
import React, { useEffect, useMemo } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

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

export const DocumentsTableComponent: React.FC<IDocumentsTableComponentProps> = ({
  items,
  onItemClicked,
  onSelectedRowsChange,
  selectedRows,
  style,
  size,
  columnHeaders,
}: IDocumentsTableComponentProps) => {
  const [activeItemIndex, setActiveItemIndex] = React.useState<number>(undefined);

  const initialSizingOptions: TableColumnSizingOptions = {
    id: {
      idealWidth: 280,
      minWidth: 50,
    },
  };
  columnHeaders.partitionKeyHeaders.forEach((pkHeader) => {
    initialSizingOptions[pkHeader] = {
      idealWidth: 200,
      minWidth: 50,
    };
  });

  const [columnSizingOptions, setColumnSizingOptions] = React.useState<TableColumnSizingOptions>(initialSizingOptions);

  const onColumnResize = React.useCallback((_, { columnId, width }) => {
    setColumnSizingOptions((state) => ({
      ...state,
      [columnId]: {
        ...state[columnId],
        idealWidth: width,
      },
    }));
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

  const RenderRow = ({ index, style, data }: ReactWindowRenderFnProps) => {
    const { item, selected, appearance, onClick, onKeyDown } = data[index];
    return (
      <TableRow aria-rowindex={index + 2} style={style} key={item.id} aria-selected={selected} appearance={appearance}>
        <TableSelectionCell
          checked={selected}
          checkboxIndicator={{ "aria-label": "Select row" }}
          onClick={onClick}
          onKeyDown={onKeyDown}
        />
        {columns.map((column) => (
          <TableCell
            key={column.columnId}
            onClick={(/* e */) => onSelectedRowsChange(new Set<TableRowId>([index]))}
            onKeyDown={onKeyDown}
            {...columnSizing.getTableCellProps(column.columnId)}
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
        selectionMode: "multiselect",
        selectedItems: selectedRows,
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

  // Load document depending on selection
  useEffect(() => {
    if (selectedRows.size === 1 && items.length > 0) {
      const newActiveItemIndex = selectedRows.values().next().value;
      if (newActiveItemIndex !== activeItemIndex) {
        onItemClicked(newActiveItemIndex);
        setActiveItemIndex(newActiveItemIndex);
      }
    }
  }, [selectedRows, items]);

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
    <Table noNativeElements {...tableProps}>
      <TableHeader>
        <TableRow>
          <TableSelectionCell
            checked={allRowsSelected ? true : someRowsSelected ? "mixed" : false}
            onClick={toggleAllRows}
            onKeyDown={toggleAllKeydown}
            checkboxIndicator={{ "aria-label": "Select all rows " }}
          />
          {columns.map((column /* index */) => (
            <Menu openOnContext key={column.columnId}>
              <MenuTrigger>
                <TableHeaderCell key={column.columnId} {...columnSizing.getTableHeaderCellProps(column.columnId)}>
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
        >
          {RenderRow}
        </List>
      </TableBody>
    </Table>
  );
};
