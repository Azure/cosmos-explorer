import { Link, Stack, Text, Toggle } from "@fluentui/react";
import React from "react";
import { updateSystemIdentity } from "../../../../../Utils/arm/identityUtils";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import useManagedIdentity from "./hooks/useManagedIdentity";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useToggle from "./hooks/useToggle";

const managedIdentityTooltip = (
  <Text>
    {ContainerCopyMessages.addManagedIdentity.tooltip.content} &nbsp;
    <Link href={ContainerCopyMessages.addManagedIdentity.tooltip.href} target="_blank" rel="noopener noreferrer">
      {ContainerCopyMessages.addManagedIdentity.tooltip.hrefText}
    </Link>
  </Text>
);
type AddManagedIdentityProps = Partial<PermissionSectionConfig>;

const AddManagedIdentity: React.FC<AddManagedIdentityProps> = () => {
  const { copyJobState } = useCopyJobContext();
  const [systemAssigned, onToggle] = useToggle(false);
  const { loading, handleAddSystemIdentity } = useManagedIdentity(updateSystemIdentity);

  return (
    <Stack className="addManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <Text>
        {ContainerCopyMessages.addManagedIdentity.description}&ensp;
        <Link href={ContainerCopyMessages.addManagedIdentity.descriptionHref} target="_blank" rel="noopener noreferrer">
          {ContainerCopyMessages.addManagedIdentity.descriptionHrefText}
        </Link>{" "}
        &nbsp;
        <InfoTooltip content={managedIdentityTooltip} />
      </Text>
      <Toggle
        checked={systemAssigned}
        onText={ContainerCopyMessages.toggleBtn.onText}
        offText={ContainerCopyMessages.toggleBtn.offText}
        onChange={onToggle}
      />
      <PopoverMessage
        isLoading={loading}
        visible={systemAssigned}
        title={ContainerCopyMessages.addManagedIdentity.enablementTitle}
        onCancel={() => onToggle(null, false)}
        onPrimary={handleAddSystemIdentity}
      >
        {ContainerCopyMessages.addManagedIdentity.enablementDescription(copyJobState.target?.account?.name)}
      </PopoverMessage>
    </Stack>
  );
};

export default AddManagedIdentity;
