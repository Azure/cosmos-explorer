import { Checkbox } from "@fluentui/react";
import {
  Button,
  FluentProvider,
  InputOnChangeData,
  SearchBox,
  SearchBoxChangeEvent,
  Text,
} from "@fluentui/react-components";
import { configContext } from "ConfigContext";
import { ColumnDefinition } from "Explorer/Tabs/DocumentsTabV2/DocumentsTableComponent";
import { getPlatformTheme } from "Explorer/Theme/ThemeUtil";
import React from "react";
import { useSidePanel } from "../../../hooks/useSidePanel";
import "./TableColumnSelectionPane.less";

export interface TableColumnSelectionPaneProps {
  columnDefinitions: ColumnDefinition[];
  selectedColumnIds: string[];
  onSelectionChange: (newSelectedColumnIds: string[]) => void;
}

export const TableColumnSelectionPane: React.FC<TableColumnSelectionPaneProps> = ({
  columnDefinitions,
  selectedColumnIds,
  onSelectionChange,
}: TableColumnSelectionPaneProps): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const originalSelectedColumnIds = React.useMemo(() => selectedColumnIds, []);
  const [columnSearchText, setColumnSearchText] = React.useState<string>("");
  const [newSelectedColumnIds, setNewSelectedColumnIds] = React.useState<string[]>(originalSelectedColumnIds);

  const selectedColumnIdsSet = new Set(newSelectedColumnIds);
  const onCheckedValueChange = (id: string, checked?: boolean): void => {
    if (checked) {
      selectedColumnIdsSet.add(id);
    } else {
      if (selectedColumnIdsSet.size === 1 && selectedColumnIdsSet.has(id)) {
        // Don't allow unchecking the last column
        return;
      }
      selectedColumnIdsSet.delete(id);
    }
    setNewSelectedColumnIds([...selectedColumnIdsSet]);
  };

  const onSave = (): void => {
    onSelectionChange(newSelectedColumnIds);
    closeSidePanel();
  };

  const onSearchChange: (event: SearchBoxChangeEvent, data: InputOnChangeData) => void = (_, data) =>
    // eslint-disable-next-line react/prop-types
    setColumnSearchText(data.value);

  const theme = getPlatformTheme(configContext.platform);

  // Filter and move partition keys to the top
  const columnDefinitionList = columnDefinitions
    .filter((def) => !columnSearchText || def.label.toLowerCase().includes(columnSearchText.toLowerCase()))
    .sort((a, b) => {
      const ID = "id";
      // "id" always at the top, then partition keys, then everything else sorted
      if (a.id === ID) {
        return b.id === ID ? 0 : -1;
      } else if (b.id === ID) {
        return a.id === ID ? 0 : 1;
      } else if (a.isPartitionKey && !b.isPartitionKey) {
        return -1;
      } else if (b.isPartitionKey && !a.isPartitionKey) {
        return 1;
      } else {
        return a.label.localeCompare(b.label);
      }
    });

  return (
    <FluentProvider theme={theme} style={{ height: "100%" }}>
      <div className="panelFormWrapper">
        <div className="panelMainContent" style={{ display: "flex", flexDirection: "column" }}>
          <Text>Select which columns to display in your view of items in your container.</Text>
          <div /* Wrap <SearchBox> to avoid margin-bottom set by panelMainContent css */>
            <SearchBox
              value={columnSearchText}
              onChange={onSearchChange}
              style={{ width: "100%" }}
              placeholder="Search fields"
            />
          </div>

          {columnDefinitionList.map((columnDefinition) => (
            <Checkbox
              className="tableColumnSelectionCheckbox"
              key={columnDefinition.id}
              label={columnDefinition.label}
              checked={selectedColumnIdsSet.has(columnDefinition.id)}
              onChange={(_, checked) => onCheckedValueChange(columnDefinition.id, checked)}
            />
          ))}
        </div>
        <div className="panelFooter" style={{ display: "flex", gap: theme.spacingHorizontalS }}>
          <Button appearance="primary" onClick={onSave}>
            Save
          </Button>
          <Button appearance="secondary" onClick={closeSidePanel}>
            Cancel
          </Button>
        </div>
      </div>
    </FluentProvider>
  );
};
