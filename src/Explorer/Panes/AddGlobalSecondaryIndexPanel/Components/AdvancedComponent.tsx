import { Checkbox, Icon, Link, Stack, Text } from "@fluentui/react";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { scrollToSection } from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import React from "react";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";

export interface AdvancedComponentProps {
  useHashV1: boolean;
  setUseHashV1: React.Dispatch<React.SetStateAction<boolean>>;
  setSubPartitionKeys: React.Dispatch<React.SetStateAction<string[]>>;
}
export const AdvancedComponent = (props: AdvancedComponentProps): JSX.Element => {
  const { useHashV1, setUseHashV1, setSubPartitionKeys } = props;

  const useHashV1CheckboxOnChange = (isChecked: boolean): void => {
    setUseHashV1(isChecked);
    setSubPartitionKeys([]);
  };

  return (
    <CollapsibleSectionComponent
      title="Advanced"
      isExpandedByDefault={false}
      onExpand={() => {
        TelemetryProcessor.traceOpen(Action.ExpandAddGlobalSecondaryIndexPaneAdvancedSection);
        scrollToSection("collapsibleAdvancedSectionContent");
      }}
    >
      <Stack className="panelGroupSpacing" id="collapsibleAdvancedSectionContent">
        <Checkbox
          label="My application uses an older Cosmos .NET or Java SDK version (.NET V1 or Java V2)"
          checked={useHashV1}
          styles={{
            text: { fontSize: 12, color: "var(--colorNeutralForeground1)" },
            checkbox: { width: 12, height: 12 },
            label: { padding: 0, alignItems: "center", wordWrap: "break-word", whiteSpace: "break-spaces" },
            root: {
              selectors: {
                ":hover .ms-Checkbox-text": { color: "var(--colorNeutralForeground1)" },
              },
            },
          }}
          onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) => {
            useHashV1CheckboxOnChange(isChecked);
          }}
        />
        <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
          <Icon iconName="InfoSolid" className="removeIcon" /> To ensure compatibility with older SDKs, the created
          container will use a legacy partitioning scheme that supports partition key values of size only up to 101
          bytes. If this is enabled, you will not be able to use hierarchical partition keys.{" "}
          <Link href="https://aka.ms/cosmos-large-pk" target="_blank">
            Learn more
          </Link>
        </Text>
      </Stack>
    </CollapsibleSectionComponent>
  );
};
