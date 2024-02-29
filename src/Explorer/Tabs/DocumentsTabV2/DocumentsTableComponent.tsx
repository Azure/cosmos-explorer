import { Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Table, TableBody, TableCell, TableCellLayout, TableColumnDefinition, TableColumnSizingOptions, TableHeader, TableHeaderCell, TableRow, TableRowId, TableSelectionCell, createTableColumn, useArrowNavigationGroup, useTableColumnSizing_unstable, useTableFeatures, useTableSelection } from '@fluentui/react-components';
import React, { useEffect } from 'react';

export type DocumentsTableComponentItem = {
  id: string;
  type: string;
};

export interface IDocumentsTableComponentProps {
  items: DocumentsTableComponentItem[];
  onSelectedItem: (index: number) => void;
  style?: React.CSSProperties;
}

const columns: TableColumnDefinition<DocumentsTableComponentItem>[] = [
  createTableColumn<DocumentsTableComponentItem>({
    columnId: "id",
    compare: (a, b) => {
      return a.id.localeCompare(b.id);
    },
    renderHeaderCell: () => {
      return "id";
    },
    renderCell: (item) => {
      return (
        <TableCellLayout>{item.id}</TableCellLayout>
      );
    },
  }),
  createTableColumn<DocumentsTableComponentItem>({
    columnId: "type",
    compare: (a, b) => {
      return a.type.localeCompare(b.type);
    },
    renderHeaderCell: () => {
      return "/type";
    },
    renderCell: (item) => {
      return (
        <TableCellLayout>{item.type}</TableCellLayout>
      );
    },
  }),
];

export const DocumentsTableComponent: React.FC<IDocumentsTableComponentProps> = ({
  items, onSelectedItem, style,
}: IDocumentsTableComponentProps) => {
  const [activeItemIndex, setActiveItemIndex] = React.useState<number>(undefined);

  const [columnSizingOptions, setColumnSizingOptions] = React.useState<TableColumnSizingOptions>({
    id: {
      idealWidth: 280,
      minWidth: 273,
    },
    type: {
      minWidth: 110,
      defaultWidth: 120,
    },
  });

  const onColumnResize = React.useCallback((_, { columnId, width }) => {
    setColumnSizingOptions((state) => ({
      ...state,
      [columnId]: {
        ...state[columnId],
        idealWidth: width,
      },
    }));
  }, []);

  const [selectedRows, setSelectedRows] = React.useState<Set<TableRowId>>(
    () => new Set<TableRowId>([0])
  );

  const {
    getRows,
    columnSizing_unstable: columnSizing,
    tableRef,
    selection: {
      allRowsSelected,
      someRowsSelected,
      toggleAllRows,
      toggleRow,
      isRowSelected,
    },
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
    ]
  );

  const rows = getRows((row) => {
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
    [toggleAllRows]
  );

  // Load document depending on selection
  useEffect(() => {
    if (selectedRows.size === 1 && items.length > 0) {
      const newActiveItemIndex = selectedRows.values().next().value;
      if (newActiveItemIndex !== activeItemIndex) {
        onSelectedItem(newActiveItemIndex);
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
    <Table {...tableProps}>
      <TableHeader>
        <TableRow>
          <TableSelectionCell
            checked={
              allRowsSelected ? true : someRowsSelected ? "mixed" : false
            }
            onClick={toggleAllRows}
            onKeyDown={toggleAllKeydown}
            checkboxIndicator={{ "aria-label": "Select all rows " }}
          />
          {columns.map((column, index) => (
            <Menu openOnContext key={column.columnId}>
              <MenuTrigger>
                <TableHeaderCell
                  key={column.columnId}
                  {...columnSizing.getTableHeaderCellProps(column.columnId)}
                >
                  {column.renderHeaderCell()}
                </TableHeaderCell>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    onClick={columnSizing.enableKeyboardMode(
                      column.columnId
                    )}
                  >
                    Keyboard Column Resizing
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ item, selected, onClick, onKeyDown, appearance }, index: number) => (
          <TableRow
            key={item.id}
            // onClick={onClick}
            // onKeyDown={onKeyDown}
            aria-selected={selected}
            appearance={appearance}
          >
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
        ))}
      </TableBody>
    </Table>
  );
};
