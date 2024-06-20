import {
  Button,
  InputOnChangeData,
  Menu,
  MenuCheckedValueChangeData,
  MenuCheckedValueChangeEvent,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItem,
  MenuItemCheckbox,
  MenuList,
  MenuPopover,
  MenuProps,
  MenuTrigger,
  PositioningImperativeRef,
  TableRowData as RowStateBase,
  SearchBox,
  SearchBoxChangeEvent,
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
  useRestoreFocusTarget,
  useTableColumnSizing_unstable,
  useTableFeatures,
  useTableSelection,
} from "@fluentui/react-components";
import { Add16Regular, Subtract12Regular } from "@fluentui/react-icons";
import { NormalizedEventKey } from "Common/Constants";
import { selectionHelper } from "Explorer/Tabs/DocumentsTabV2/SelectionHelper";
import { isEnvironmentCtrlPressed, isEnvironmentShiftPressed } from "Utils/KeyboardUtils";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

export type DocumentsTableComponentItem = {
  id: string;
} & Record<string, string>;

export type ColumnDefinition = {
  id: string;
  label: string;
  defaultWidthPx?: number;
  group: string | undefined;
};
export interface IDocumentsTableComponentProps {
  items: DocumentsTableComponentItem[];
  onItemClicked: (index: number) => void;
  onSelectedRowsChange: (selectedItemsIndices: Set<TableRowId>) => void;
  selectedRows: Set<TableRowId>;
  size: { height: number; width: number };
  selectedColumnIds: string[];
  columnDefinitions: ColumnDefinition[];
  style?: React.CSSProperties;
  isSelectionDisabled?: boolean;
  onColumnResize?: (columnId: string, width: number) => void;
  onColumnSelectionChange?: (newSelectedColumnIds: string[]) => void;
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

const DEFAULT_COLUMN_WIDTH_PX = 200;
const MIN_COLUMN_WIDTH_PX = 20;
const COLUMNS_MENU_NAME = "columnsMenu";

export const DocumentsTableComponent: React.FC<IDocumentsTableComponentProps> = ({
  items,
  onSelectedRowsChange,
  selectedRows,
  style,
  size,
  selectedColumnIds,
  columnDefinitions,
  isSelectionDisabled,
  onColumnResize: _onColumnResize,
  onColumnSelectionChange,
}: IDocumentsTableComponentProps) => {
  const initialSizingOptions: TableColumnSizingOptions = {};
  columnDefinitions.forEach((column) => {
    initialSizingOptions[column.id] = {
      idealWidth: column.defaultWidthPx || DEFAULT_COLUMN_WIDTH_PX, // 0 is not a valid width
      minWidth: MIN_COLUMN_WIDTH_PX,
    };
  });

  const [columnSizingOptions, setColumnSizingOptions] = React.useState<TableColumnSizingOptions>(initialSizingOptions);

  // This is for the menu to select columns
  const [columnSearchText, setColumnSearchText] = useState<string>("");
  const [isColumnSelectionMenuOpen, setIsColumnSelectionMenuOpen] = useState<boolean>(false);
  const columnSelectionMenuButtonRef = useRef<HTMLButtonElement>(null);
  const columnSelectionMenuPositionRef = useRef<HTMLDivElement>(null);
  const positioningRef = React.useRef<PositioningImperativeRef>(null);
  const onColumnSelectionMenuOpenChange: MenuProps["onOpenChange"] = (e, data) => {
    // do not close menu as an outside click if clicking on the custom trigger/target
    // this prevents it from closing & immediately re-opening when clicking custom triggers
    if (
      data.type === "clickOutside" &&
      (e.target === columnSelectionMenuButtonRef.current || e.target === columnSelectionMenuPositionRef.current)
    ) {
      return;
    }

    setIsColumnSelectionMenuOpen(data.open);
  };

  useEffect(() => {
    if (columnSelectionMenuPositionRef.current) {
      positioningRef.current?.setTarget(columnSelectionMenuPositionRef.current);
    }
  }, [columnSelectionMenuPositionRef, positioningRef]);

  const restoreFocusTargetAttribute = useRestoreFocusTarget();

  const onColumnResize = React.useCallback(
    (_, { columnId, width }) => {
      setColumnSizingOptions((state) => ({
        ...state,
        [columnId]: {
          ...state[columnId],
          idealWidth: width,
        },
      }));
      _onColumnResize(columnId, width);
    },
    [_onColumnResize],
  );

  // Columns must be a static object and cannot change on re-renders otherwise React will complain about too many refreshes
  const columns: TableColumnDefinition<DocumentsTableComponentItem>[] = useMemo(
    () =>
      columnDefinitions
        .filter((column) => selectedColumnIds.includes(column.id))
        .map((column) => ({
          columnId: column.id,
          compare: (a, b) => a[column.id].localeCompare(b[column.id]),
          renderHeaderCell: () => (
            <>
              <span title={column.label}>{column.label}</span>
              <Button
                appearance="transparent"
                aria-label="De-select column"
                size="small"
                icon={<Subtract12Regular />}
                style={{ position: "absolute", right: -8 }}
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
              />
            </>
          ),
          renderCell: (item) => (
            <TableCellLayout truncate title={item[column.id]}>
              {item[column.id]}
            </TableCellLayout>
          ),
        })),
    [columnDefinitions, selectedColumnIds],
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

  const checkedValues: { [COLUMNS_MENU_NAME]: string[] } = {
    [COLUMNS_MENU_NAME]: [],
  };
  columnDefinitions.forEach(
    (columnDefinition) =>
      selectedColumnIds.includes(columnDefinition.id) && checkedValues[COLUMNS_MENU_NAME].push(columnDefinition.id),
  );

  const onCheckedValueChange = (_: MenuCheckedValueChangeEvent, data: MenuCheckedValueChangeData) => {
    // TODO this is expensive
    // eslint-disable-next-line react/prop-types
    onColumnSelectionChange(data.checkedItems);
  };

  const onSearchChange: (event: SearchBoxChangeEvent, data: InputOnChangeData) => void = (_, data) =>
    setColumnSearchText(data.value);

  const getMenuList = (columnDefinitions: ColumnDefinition[]): JSX.Element => {
    // Group by group. Unnamed group first
    const unnamedGroup: ColumnDefinition[] = [];
    const groupMap = new Map<string, ColumnDefinition[]>();
    columnDefinitions.forEach((column) => {
      if (column.group) {
        if (!groupMap.has(column.group)) {
          groupMap.set(column.group, []);
        }
        groupMap.get(column.group).push(column);
      } else {
        unnamedGroup.push(column);
      }
    });

    const menuList: JSX.Element[] = [];
    menuList.push(<SearchBox key="search" size="small" value={columnSearchText} onChange={onSearchChange} />);
    if (unnamedGroup.length > 0) {
      menuList.push(
        ...unnamedGroup
          .filter((def) => !columnSearchText || def.label.toLowerCase().includes(columnSearchText.toLowerCase()))
          .map((column) => (
            <MenuItemCheckbox key={column.id} name={COLUMNS_MENU_NAME} value={column.id}>
              {column.label}
            </MenuItemCheckbox>
          )),
      );
    }
    groupMap.forEach((columns, group) => {
      menuList.push(<MenuDivider key={`divider${group}`} />);
      menuList.push(
        <MenuGroup key={group}>
          <MenuGroupHeader>{group}</MenuGroupHeader>
          {...columns.map((column) => (
            <MenuItemCheckbox key={column.id} name={COLUMNS_MENU_NAME} value={column.id}>
              {column.label}
            </MenuItemCheckbox>
          ))}
        </MenuGroup>,
      );
    });

    return <>{menuList}</>;
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
          {columns.map((column) => (
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
                    Enable Left/Right Arrow keys to resize
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          ))}
          <Button
            {...restoreFocusTargetAttribute}
            appearance="transparent"
            aria-label="Select column"
            size="small"
            icon={<Add16Regular />}
            style={{ position: "absolute", right: 25 }}
            onClick={() => setIsColumnSelectionMenuOpen((s) => !s)}
          />
          <div
            {...restoreFocusTargetAttribute}
            ref={columnSelectionMenuPositionRef}
            style={{ height: 0, position: "absolute", right: 20, top: 0 }}
          />
          <Menu
            checkedValues={checkedValues}
            onCheckedValueChange={onCheckedValueChange}
            open={isColumnSelectionMenuOpen}
            onOpenChange={onColumnSelectionMenuOpenChange}
            positioning={{ positioningRef }}
          >
            <MenuPopover>
              <MenuList style={{ maxHeight: size?.height, overflowY: "auto", overflowX: "hidden" }}>
                {getMenuList(columnDefinitions)}
              </MenuList>
            </MenuPopover>
          </Menu>
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
