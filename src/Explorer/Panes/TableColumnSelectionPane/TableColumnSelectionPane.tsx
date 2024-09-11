import {
  Button,
  Checkbox,
  CheckboxOnChangeData,
  InputOnChangeData,
  makeStyles,
  SearchBox,
  SearchBoxChangeEvent,
  Text,
} from "@fluentui/react-components";
import { configContext } from "ConfigContext";
import { ColumnDefinition } from "Explorer/Tabs/DocumentsTabV2/DocumentsTableComponent";
import { CosmosFluentProvider, getPlatformTheme } from "Explorer/Theme/ThemeUtil";
import React from "react";
import { useSidePanel } from "../../../hooks/useSidePanel";

const useColumnSelectionStyles = makeStyles({
  paneContainer: {
    height: "100%",
    display: "flex",
  },
  searchBox: {
    width: "100%",
  },
  checkboxContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  checkboxLabel: {
    padding: "4px 8px",
    marginBottom: "0px",
  },
});
export interface TableColumnSelectionPaneProps {
  columnDefinitions: ColumnDefinition[];
  selectedColumnIds: string[];
  onSelectionChange: (newSelectedColumnIds: string[]) => void;
  defaultSelection: string[];
}

export const TableColumnSelectionPane: React.FC<TableColumnSelectionPaneProps> = ({
  columnDefinitions,
  selectedColumnIds,
  onSelectionChange,
  defaultSelection,
}: TableColumnSelectionPaneProps): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const originalSelectedColumnIds = React.useMemo(() => selectedColumnIds, []);
  const [columnSearchText, setColumnSearchText] = React.useState<string>("");
  const [newSelectedColumnIds, setNewSelectedColumnIds] = React.useState<string[]>(originalSelectedColumnIds);
  const styles = useColumnSelectionStyles();

  const selectedColumnIdsSet = new Set(newSelectedColumnIds);
  const onCheckedValueChange = (id: string, checkedData?: CheckboxOnChangeData): void => {
    const checked = checkedData?.checked;
    if (checked === "mixed" || checked === undefined) {
      return;
    }

    if (checked) {
      selectedColumnIdsSet.add(id);
    } else {
      /* selectedColumnIds may contain ids that are not in columnDefinitions, because the selected
       * ids may have been loaded from persistence, but don't exist in the current retrieved documents.
       */

      if (
        Array.from(selectedColumnIdsSet).filter((id) => columnDefinitions.find((def) => def.id === id) !== undefined)
          .length === 1 &&
        selectedColumnIdsSet.has(id)
      ) {
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
    <div className={styles.paneContainer}>
      <CosmosFluentProvider>
        <div className="panelFormWrapper">
          <div className="panelMainContent" style={{ display: "flex", flexDirection: "column" }}>
            <Text>Select which columns to display in your view of items in your container.</Text>
            <div /* Wrap <SearchBox> to avoid margin-bottom set by panelMainContent css */>
              <SearchBox
                className={styles.searchBox}
                value={columnSearchText}
                onChange={onSearchChange}
                placeholder="Search fields"
              />
            </div>

            <div className={styles.checkboxContainer}>
              {columnDefinitionList.map((columnDefinition) => (
                <Checkbox
                  style={{ marginBottom: 0 }}
                  key={columnDefinition.id}
                  label={{
                    className: styles.checkboxLabel,
                    children: `${columnDefinition.label}${columnDefinition.isPartitionKey ? " (partition key)" : ""}`,
                  }}
                  checked={selectedColumnIdsSet.has(columnDefinition.id)}
                  onChange={(_, data) => onCheckedValueChange(columnDefinition.id, data)}
                />
              ))}
            </div>
            <Button appearance="secondary" size="small" onClick={() => setNewSelectedColumnIds(defaultSelection)}>
              Reset
            </Button>
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
      </CosmosFluentProvider>
    </div>
  );
};
