import {
  Button,
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
  useFluent,
  useScrollbarWidth,
  useTableColumnSizing_unstable,
  useTableFeatures,
  useTableSelection,
} from "@fluentui/react-components";
import { ArrowClockwise16Filled } from "@fluentui/react-icons";
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
  onSelectedItemsChange: (selectedItemsIndices: Set<number>) => void;
  size: { height: number; width: number };
  columnHeaders: ColumnHeaders;
  onRefreshClicked: () => void;
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
  onSelectedItemsChange,
  style,
  size,
  columnHeaders,
  onRefreshClicked,
}: IDocumentsTableComponentProps) => {
  const { targetDocument } = useFluent();
  const scrollbarWidth = useScrollbarWidth({ targetDocument });

  const [activeItemIndex, setActiveItemIndex] = React.useState<number>(undefined);

  const initialSizingOptions: TableColumnSizingOptions = {
    id: {
      idealWidth: 280,
      // minWidth: 273,
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

  const [selectedRows, setSelectedRows] = React.useState<Set<TableRowId>>(() => new Set<TableRowId>([0]));

  // If selected rows change, call props
  useEffect(() => {
    if (onSelectedItemsChange) {
      onSelectedItemsChange(selectedRows);
    }
  }, [selectedRows, onSelectedItemsChange]);

  // Columns must be a static object and cannot change on re-renders otherwise React will complain about too many refreshes
  const columns: TableColumnDefinition<DocumentsTableComponentItem>[] = useMemo(
    () =>
      [
        createTableColumn<DocumentsTableComponentItem>({
          columnId: "id",
          compare: (a, b) => a.id.localeCompare(b.id),
          renderHeaderCell: () => "id",
          renderCell: (item) => <TableCellLayout truncate>{item.id}</TableCellLayout>,
        }),
      ].concat(
        columnHeaders.partitionKeyHeaders.map((pkHeader, index) =>
          createTableColumn<DocumentsTableComponentItem>({
            columnId: pkHeader,
            compare: (a, b) => a[pkHeader].localeCompare(b[pkHeader]),
            // Show Refresh button on last column
            renderHeaderCell: () =>
              index >= columnHeaders.partitionKeyHeaders.length - 1 ? (
                <>
                  <span>{`/${pkHeader}`}</span>
                  <Button
                    appearance="transparent"
                    aria-label="Refresh"
                    size="small"
                    icon={<ArrowClockwise16Filled />}
                    style={{ position: "absolute", right: 0 }}
                    onClick={onRefreshClicked}
                  />
                </>
              ) : (
                `/${pkHeader}`
              ),
            renderCell: (item) => {
              return <TableCellLayout truncate>{item[pkHeader]}</TableCellLayout>;
            },
          }),
        ),
      ),
    [columnHeaders.partitionKeyHeaders, onRefreshClicked],
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
            onClick={(/* e */) => setSelectedRows(new Set<TableRowId>([index]))}
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
        onSelectionChange: (e, data) => setSelectedRows(data.selectedItems),
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

  const tableProps = {
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
          {/** Scrollbar alignment for the header: TODO: This does not work */}
          <div role="columnheader" className="fui-TableHeaderCell" style={{ width: scrollbarWidth, height: 32 }} />
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
