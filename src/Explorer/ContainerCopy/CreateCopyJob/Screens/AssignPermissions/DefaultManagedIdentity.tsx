import { Stack, Toggle } from "@fluentui/react";
import React from "react";
import { updateDefaultIdentity } from "../../../../../Utils/arm/identityUtils";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import useManagedIdentity from "./hooks/useManagedIdentity";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useToggle from "./hooks/useToggle";

const managedIdentityTooltip = ContainerCopyMessages.defaultManagedIdentity.tooltip;
type AddManagedIdentityProps = Partial<PermissionSectionConfig>;

const DefaultManagedIdentity: React.FC<AddManagedIdentityProps> = () => {
  const [defaultSystemAssigned, onToggle] = useToggle(false);
  const { loading, handleAddSystemIdentity } = useManagedIdentity(updateDefaultIdentity);

  return (
    <Stack className="defaultManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <div className="toggle-label">
        {ContainerCopyMessages.defaultManagedIdentity.description} &nbsp;
        <InfoTooltip content={managedIdentityTooltip} />
      </div>
      <Toggle
        checked={defaultSystemAssigned}
        onText={ContainerCopyMessages.toggleBtn.onText}
        offText={ContainerCopyMessages.toggleBtn.offText}
        onChange={onToggle}
        inlineLabel
        styles={{
          root: { marginTop: 8, marginBottom: 12 },
          label: { display: "none" },
        }}
      />
      <PopoverMessage
        isLoading={loading}
        visible={defaultSystemAssigned}
        title={ContainerCopyMessages.defaultManagedIdentity.popoverTitle}
        onCancel={() => onToggle(null, false)}
        onPrimary={handleAddSystemIdentity}
      >
        {ContainerCopyMessages.defaultManagedIdentity.popoverDescription}
      </PopoverMessage>
    </Stack>
  );
};

export default DefaultManagedIdentity;
