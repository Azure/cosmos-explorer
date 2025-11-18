import { Link, Stack, Text, Toggle } from "@fluentui/react";
import React, { useCallback } from "react";
import { assignRole } from "../../../../../Utils/arm/RbacUtils";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { getAccountDetailsFromResourceId } from "../../../CopyJobUtils";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useToggle from "./hooks/useToggle";

const TooltipContent = (
  <Text>
    {ContainerCopyMessages.readPermissionAssigned.tooltip.content} &nbsp;
    <Link href={ContainerCopyMessages.readPermissionAssigned.tooltip.href} target="_blank" rel="noopener noreferrer">
      {ContainerCopyMessages.readPermissionAssigned.tooltip.hrefText}
    </Link>
  </Text>
);
type AddReadPermissionToDefaultIdentityProps = Partial<PermissionSectionConfig>;

const AddReadPermissionToDefaultIdentity: React.FC<AddReadPermissionToDefaultIdentityProps> = () => {
  const [loading, setLoading] = React.useState(false);
  const { copyJobState, setCopyJobState, setContextError } = useCopyJobContext();
  const [readPermissionAssigned, onToggle] = useToggle(false);

  const handleAddReadPermission = useCallback(async () => {
    const { source, target } = copyJobState;
    const selectedSourceAccount = source?.account;
    try {
      const {
        subscriptionId: sourceSubscriptionId,
        resourceGroup: sourceResourceGroup,
        accountName: sourceAccountName,
      } = getAccountDetailsFromResourceId(selectedSourceAccount?.id);

      setLoading(true);
      const assignedRole = await assignRole(
        sourceSubscriptionId,
        sourceResourceGroup,
        sourceAccountName,
        target?.account?.identity?.principalId ?? "",
      );
      if (assignedRole) {
        setCopyJobState((prevState) => ({
          ...prevState,
          sourceReadAccessFromTarget: true,
        }));
      }
    } catch (error) {
      console.error("Error assigning read permission to default identity:", error);
      setContextError(error.message || "Error assigning read permission to default identity. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [copyJobState, setCopyJobState, setContextError]);

  return (
    <Stack className="defaultManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <Text className="toggle-label">
        {ContainerCopyMessages.readPermissionAssigned.description}&ensp;
        <InfoTooltip content={TooltipContent} />
      </Text>
      <Toggle
        checked={readPermissionAssigned}
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
        visible={readPermissionAssigned}
        title={ContainerCopyMessages.readPermissionAssigned.popoverTitle}
        onCancel={() => onToggle(null, false)}
        onPrimary={handleAddReadPermission}
      >
        {ContainerCopyMessages.readPermissionAssigned.popoverDescription}
      </PopoverMessage>
    </Stack>
  );
};

export default AddReadPermissionToDefaultIdentity;
