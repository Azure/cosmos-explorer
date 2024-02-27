import { Table, TableBody, TableCell, TableCellLayout, TableColumnDefinition, TableHeader, TableHeaderCell, TableRow, TableRowId, TableSelectionCell, createTableColumn, useArrowNavigationGroup, useTableFeatures, useTableSelection } from '@fluentui/react-components';
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

export const DocumentsTableComponent: React.FC<IDocumentsTableComponentProps> = ({
  items, onSelectedItem, style,
}: IDocumentsTableComponentProps) => {
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

  // const [columnSizingOptions] = React.useState<TableColumnSizingOptions>({
  //   id: {
  //     idealWidth: 300,
  //     minWidth: 150,
  //   },
  //   type: {
  //     minWidth: 110,
  //     defaultWidth: 250,
  //   },
  // });

  const [selectedRows, setSelectedRows] = React.useState<Set<TableRowId>>(
    () => new Set<TableRowId>([0])
  );

  const {
    getRows,
    // columnSizing_unstable,
    // tableRef,
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
      // useTableColumnSizing_unstable({ columnSizingOptions }),
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
      onSelectedItem(selectedRows.values().next().value);
    }
  }, [selectedRows, items]);

  // Cell keyboard navigation
  const keyboardNavAttr = useArrowNavigationGroup({ axis: "grid" });

  const tableProps = {
    "aria-label": "Filtered documents table",
    role: "grid",
    ...keyboardNavAttr,
    // ...columnSizing_unstable.getTableProps(),
    size: "extra-small",
    // ref: tableRef,
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
          <TableHeaderCell>id</TableHeaderCell>
          <TableHeaderCell>/type</TableHeaderCell>
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
            <TableCell onClick={(/* e */) => setSelectedRows(new Set<TableRowId>([index]))} onKeyDown={onKeyDown}>
              <TableCellLayout>{item.id}</TableCellLayout>
            </TableCell>
            <TableCell>
              <TableCellLayout>{item.type}</TableCellLayout>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
