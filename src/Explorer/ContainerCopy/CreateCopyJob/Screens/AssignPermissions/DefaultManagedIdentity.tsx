import { Link, Stack, Text, Toggle } from "@fluentui/react";
import { Keys, t } from "Localization";
import React from "react";
import { updateDefaultIdentity } from "../../../../../Utils/arm/identityUtils";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import useManagedIdentity from "./hooks/useManagedIdentity";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useToggle from "./hooks/useToggle";

const managedIdentityTooltip = (
  <Text>
    {t(Keys.containerCopy.defaultManagedIdentity.tooltipContent)} &nbsp;
    <Link
      style={{ color: "var(--colorBrandForeground1)" }}
      href={t(Keys.containerCopy.defaultManagedIdentity.tooltipHref)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t(Keys.containerCopy.defaultManagedIdentity.tooltipHrefText)}
    </Link>
  </Text>
);
type AddManagedIdentityProps = Partial<PermissionSectionConfig>;

const DefaultManagedIdentity: React.FC<AddManagedIdentityProps> = () => {
  const { copyJobState } = useCopyJobContext();
  const [defaultSystemAssigned, onToggle] = useToggle(false);
  const { loading, handleAddSystemIdentity } = useManagedIdentity(updateDefaultIdentity);

  return (
    <Stack className="defaultManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <div className="toggle-label">
        {t(Keys.containerCopy.defaultManagedIdentity.description, { accountName: copyJobState?.target?.account?.name })}{" "}
        &nbsp;
        <InfoTooltip content={managedIdentityTooltip} />
      </div>
      <Toggle
        data-test="btn-toggle"
        checked={defaultSystemAssigned}
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
        visible={defaultSystemAssigned}
        title={t(Keys.containerCopy.defaultManagedIdentity.popoverTitle)}
        onCancel={() => onToggle(null, false)}
        onPrimary={handleAddSystemIdentity}
      >
        {t(Keys.containerCopy.defaultManagedIdentity.popoverDescription, {
          accountName: copyJobState?.target?.account?.name,
        })}
      </PopoverMessage>
    </Stack>
  );
};

export default DefaultManagedIdentity;
