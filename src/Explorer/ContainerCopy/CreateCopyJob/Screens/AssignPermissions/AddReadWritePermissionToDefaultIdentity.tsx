import { Link, Stack, Text, Toggle } from "@fluentui/react";
import React from "react";
import { logError } from "../../../../../Common/Logger";
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
    {ContainerCopyMessages.readWritePermissionAssigned.tooltip.content} &nbsp;
    <Link
      style={{ color: "var(--colorBrandForeground1)" }}
      href={ContainerCopyMessages.readWritePermissionAssigned.tooltip.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {ContainerCopyMessages.readWritePermissionAssigned.tooltip.hrefText}
    </Link>
  </Text>
);

type AddReadWritePermissionToDefaultIdentityProps = Partial<PermissionSectionConfig>;

const AddReadWritePermissionToDefaultIdentity: React.FC<AddReadWritePermissionToDefaultIdentityProps> = () => {
  const [loading, setLoading] = React.useState(false);
  const { copyJobState, setCopyJobState, setContextError } = useCopyJobContext();
  const [readWritePermissionAssigned, onToggle] = useToggle(copyJobState.sourceReadWriteAccessFromTarget ?? false);

  const handleAddReadWritePermission = async () => {
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
          sourceReadWriteAccessFromTarget: true,
        }));
      }
    } catch (error) {
      const errorMessage =
        error.message || "Error assigning read-write permission to default identity. Please try again later.";
      logError(errorMessage, "CopyJob/AddReadWritePermissionToDefaultIdentity.handleAddReadWritePermission");
      setContextError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack className="defaultManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <Text className="toggle-label">
        {ContainerCopyMessages.readWritePermissionAssigned.description}&ensp;
        <InfoTooltip content={TooltipContent} />
      </Text>
      <Toggle
        data-test="btn-toggle"
        checked={readWritePermissionAssigned}
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
        visible={readWritePermissionAssigned}
        title={ContainerCopyMessages.readWritePermissionAssigned.popoverTitle}
        onCancel={() => onToggle(null, false)}
        onPrimary={handleAddReadWritePermission}
      >
        {ContainerCopyMessages.readWritePermissionAssigned.popoverDescription}
      </PopoverMessage>
    </Stack>
  );
};

export default AddReadWritePermissionToDefaultIdentity;
