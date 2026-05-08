import { Link, Stack, Text, Toggle } from "@fluentui/react";
import { Keys, t } from "Localization";
import React from "react";
import { logError } from "../../../../../Common/Logger";
import { assignRole } from "../../../../../Utils/arm/RbacUtils";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { getAccountDetailsFromResourceId } from "../../../CopyJobUtils";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useToggle from "./hooks/useToggle";

const TooltipContent = (
  <Text>
    {t(Keys.containerCopy.readWritePermissionAssigned.tooltipContent)} &nbsp;
    <Link
      style={{ color: "var(--colorBrandForeground1)" }}
      href={t(Keys.containerCopy.readWritePermissionAssigned.tooltipHref)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t(Keys.containerCopy.readWritePermissionAssigned.tooltipHrefText)}
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
    const selectedTargetAccount = target?.account;

    try {
      const {
        subscriptionId: targetSubscriptionId,
        resourceGroup: targetResourceGroup,
        accountName: targetAccountName,
      } = getAccountDetailsFromResourceId(selectedTargetAccount?.id);

      setLoading(true);
      const assignedRole = await assignRole(
        targetSubscriptionId,
        targetResourceGroup,
        targetAccountName,
        source?.account?.identity?.principalId ?? "",
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
        {t(Keys.containerCopy.readWritePermissionAssigned.description)}&ensp;
        <InfoTooltip content={TooltipContent} />
      </Text>
      <Toggle
        data-test="btn-toggle"
        checked={readWritePermissionAssigned}
        onText={t(Keys.common.on)}
        offText={t(Keys.common.off)}
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
        title={t(Keys.containerCopy.readWritePermissionAssigned.popoverTitle)}
        onCancel={() => onToggle(null, false)}
        onPrimary={handleAddReadWritePermission}
      >
        {t(Keys.containerCopy.readWritePermissionAssigned.popoverDescription)}
      </PopoverMessage>
    </Stack>
  );
};

export default AddReadWritePermissionToDefaultIdentity;
