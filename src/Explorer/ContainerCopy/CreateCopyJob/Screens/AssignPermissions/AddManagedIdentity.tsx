import { Link, Stack, Text, Toggle } from "@fluentui/react";
import React, { useMemo } from "react";
import { updateSystemIdentity } from "../../../../../Utils/arm/identityUtils";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { buildResourceLink } from "../../../CopyJobUtils";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import useManagedIdentity from "./hooks/useManagedIdentity";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useToggle from "./hooks/useToggle";

const userAssignedTooltip = ContainerCopyMessages.addManagedIdentity.userAssignedIdentityTooltip;

const textStyle = { display: "flex", alignItems: "center" };

type AddManagedIdentityProps = Partial<PermissionSectionConfig>;

const AddManagedIdentity: React.FC<AddManagedIdentityProps> = () => {
  const { copyJobState } = useCopyJobContext();
  const [systemAssigned, onToggle] = useToggle(false);
  const { loading, handleAddSystemIdentity } = useManagedIdentity(updateSystemIdentity);

  const manageIdentityLink = useMemo(() => {
    const { target } = copyJobState;
    const resourceUri = buildResourceLink(target.account);
    return target?.account?.id ? `${resourceUri}/ManagedIdentitiesBlade` : "#";
  }, [copyJobState]);

  return (
    <Stack className="addManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <Text>
        {ContainerCopyMessages.addManagedIdentity.description}&ensp;
        <Link href={ContainerCopyMessages.addManagedIdentity.descriptionHref} target="_blank" rel="noopener noreferrer">
          {ContainerCopyMessages.addManagedIdentity.descriptionHrefText}
        </Link>
      </Text>
      <Toggle
        checked={systemAssigned}
        onText={ContainerCopyMessages.toggleBtn.onText}
        offText={ContainerCopyMessages.toggleBtn.offText}
        onChange={onToggle}
      />
      <Text className="user-assigned-label" style={textStyle}>
        {ContainerCopyMessages.addManagedIdentity.userAssignedIdentityLabel}&nbsp;
        <InfoTooltip content={userAssignedTooltip} />
      </Text>
      <div style={{ marginTop: 8 }}>
        <Link href={manageIdentityLink} target="_blank" rel="noopener noreferrer">
          {ContainerCopyMessages.addManagedIdentity.createUserAssignedIdentityLink}
        </Link>
      </div>
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
