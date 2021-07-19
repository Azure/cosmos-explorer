import { ChoiceGroup, Panel, PanelType } from "@fluentui/react";
import * as React from "react";
import { useDirectories } from "../../../hooks/useDirectories";

interface Props {
  isOpen: boolean;
  dismissPanel: () => void;
  tenantId: string;
  armToken: string;
  switchTenant: (tenantId: string | undefined) => void;
}

export const DirectoryPickerPanel: React.FunctionComponent<Props> = ({
  isOpen,
  dismissPanel,
  armToken,
  tenantId,
  switchTenant,
}: Props) => {
  const directories = useDirectories(armToken);
  return (
    <Panel
      type={PanelType.medium}
      headerText="Select Directory"
      isOpen={isOpen}
      onDismiss={dismissPanel}
      closeButtonAriaLabel="Close"
    >
      <ChoiceGroup
        options={directories.map((dir) => ({ key: dir.tenantId, text: `${dir.displayName} (${dir.tenantId})` }))}
        selectedKey={tenantId}
        onChange={(_event, option) => {
          switchTenant(option?.key);
          dismissPanel();
        }}
      />
    </Panel>
  );
};
