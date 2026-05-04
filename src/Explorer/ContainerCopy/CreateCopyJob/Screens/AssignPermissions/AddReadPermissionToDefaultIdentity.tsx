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
    {t(Keys.containerCopy.readPermissionAssigned.tooltipContent)} &nbsp;
    <Link
      style={{ color: "var(--colorBrandForeground1)" }}
      href={t(Keys.containerCopy.readPermissionAssigned.tooltipHref)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t(Keys.containerCopy.readPermissionAssigned.tooltipHrefText)}
    </Link>
  </Text>
);
type AddReadPermissionToDefaultIdentityProps = Partial<PermissionSectionConfig>;

const AddReadPermissionToDefaultIdentity: React.FC<AddReadPermissionToDefaultIdentityProps> = () => {
  const [loading, setLoading] = React.useState(false);
  const { copyJobState, setCopyJobState, setContextError } = useCopyJobContext();
  const [readPermissionAssigned, onToggle] = useToggle(false);

  const handleAddReadPermission = async () => {
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
      const errorMessage =
        error.message || "Error assigning read permission to default identity. Please try again later.";
      logError(errorMessage, "CopyJob/AddReadPermissionToDefaultIdentity.handleAddReadPermission");
      setContextError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack className="defaultManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <Text className="toggle-label">
        {t(Keys.containerCopy.readPermissionAssigned.description)}&ensp;
        <InfoTooltip content={TooltipContent} />
      </Text>
      <Toggle
        data-test="btn-toggle"
        checked={readPermissionAssigned}
        onText="On"
        offText="Off"
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
        title={t(Keys.containerCopy.readPermissionAssigned.popoverTitle)}
        onCancel={() => onToggle(null, false)}
        onPrimary={handleAddReadPermission}
      >
        {t(Keys.containerCopy.readPermissionAssigned.popoverDescription)}
      </PopoverMessage>
    </Stack>
  );
};

export default AddReadPermissionToDefaultIdentity;
