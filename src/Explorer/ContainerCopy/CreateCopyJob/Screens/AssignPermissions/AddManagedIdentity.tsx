import { Link, Stack, Text, Toggle } from "@fluentui/react";
import { Keys, t } from "Localization";
import React from "react";
import { updateSystemIdentity } from "../../../../../Utils/arm/identityUtils";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import useManagedIdentity from "./hooks/useManagedIdentity";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useToggle from "./hooks/useToggle";

const managedIdentityTooltip = (
  <Text>
    {t(Keys.containerCopy.addManagedIdentity.tooltipContent)} &nbsp;
    <Link
      style={{ color: "var(--colorBrandForeground1)" }}
      href={t(Keys.containerCopy.addManagedIdentity.tooltipHref)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t(Keys.containerCopy.addManagedIdentity.tooltipHrefText)}
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
      <Text className="themeText">
        {t(Keys.containerCopy.addManagedIdentity.description)}&ensp;
        <Link href={t(Keys.containerCopy.addManagedIdentity.descriptionHref)} target="_blank" rel="noopener noreferrer">
          {t(Keys.containerCopy.addManagedIdentity.descriptionHrefText)}
        </Link>{" "}
        &nbsp;
        <InfoTooltip content={managedIdentityTooltip} />
      </Text>
      <Toggle data-test="btn-toggle" checked={systemAssigned} onText="On" offText="Off" onChange={onToggle} />
      <PopoverMessage
        isLoading={loading}
        visible={systemAssigned}
        title={t(Keys.containerCopy.addManagedIdentity.enablementTitle)}
        onCancel={() => onToggle(null, false)}
        onPrimary={handleAddSystemIdentity}
      >
        {copyJobState.target?.account?.name
          ? t(Keys.containerCopy.addManagedIdentity.enablementDescription, {
              accountName: copyJobState.target?.account?.name,
            })
          : ""}
      </PopoverMessage>
    </Stack>
  );
};

export default AddManagedIdentity;
