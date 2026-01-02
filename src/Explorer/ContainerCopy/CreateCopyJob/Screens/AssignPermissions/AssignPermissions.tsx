import { Image, Stack, Text } from "@fluentui/react";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from "@fluentui/react-components";
import React, { useEffect } from "react";
import CheckmarkIcon from "../../../../../../images/successfulPopup.svg";
import WarningIcon from "../../../../../../images/warning.svg";
import ShimmerTree, { IndentLevel } from "../../../../../Common/ShimmerTree/ShimmerTree";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { isIntraAccountCopy } from "../../../CopyJobUtils";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import { useCopyJobPrerequisitesCache } from "../../Utils/useCopyJobPrerequisitesCache";
import usePermissionSections, { PermissionGroupConfig, PermissionSectionConfig } from "./hooks/usePermissionsSection";

const PermissionSection: React.FC<PermissionSectionConfig> = ({ id, title, Component, completed, disabled }) => (
  <AccordionItem key={id} value={id} disabled={disabled}>
    <AccordionHeader className="accordionHeader">
      <Text className="accordionHeaderText" variant="medium">
        {title}
      </Text>
      <Image
        className="statusIcon"
        src={completed ? CheckmarkIcon : WarningIcon}
        alt={completed ? "Checkmark icon" : "Warning icon"}
        width={completed ? 20 : 24}
        height={completed ? 20 : 24}
      />
    </AccordionHeader>
    <AccordionPanel aria-disabled={disabled} className="accordionPanel">
      <Component />
    </AccordionPanel>
  </AccordionItem>
);

const PermissionGroup: React.FC<PermissionGroupConfig> = ({ title, description, sections }) => {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  useEffect(() => {
    const firstIncompleteSection = sections.find((section) => !section.completed);
    const nextOpenItems = firstIncompleteSection ? [firstIncompleteSection.id] : [];
    if (JSON.stringify(openItems) !== JSON.stringify(nextOpenItems)) {
      setOpenItems(nextOpenItems);
    }
  }, [sections]);

  return (
    <Stack
      tokens={{ childrenGap: 15 }}
      styles={{
        root: {
          background: "var(--colorNeutralBackground2)",
          border: "1px solid var(--colorNeutralStroke1)",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Stack tokens={{ childrenGap: 5 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: "var(--colorNeutralForeground1)" }}>
          {title}
        </Text>
        {description && (
          <Text variant="small" styles={{ root: { color: "var(--colorNeutralForeground2)" } }}>
            {description}
          </Text>
        )}
      </Stack>

      <Accordion className="permissionsAccordion" collapsible openItems={openItems}>
        {sections.map((section) => (
          <PermissionSection key={section.id} {...section} />
        ))}
      </Accordion>
    </Stack>
  );
};

const AssignPermissions = () => {
  const { setValidationCache } = useCopyJobPrerequisitesCache();
  const { copyJobState } = useCopyJobContext();
  const permissionGroups = usePermissionSections(copyJobState);

  const totalSectionsCount = React.useMemo(
    () => permissionGroups.reduce((total, group) => total + group.sections.length, 0),
    [permissionGroups],
  );

  const indentLevels = React.useMemo<IndentLevel[]>(
    () => Array(copyJobState.migrationType === CopyJobMigrationType.Online ? 5 : 3).fill({ level: 0, width: "100%" }),
    [copyJobState.migrationType],
  );

  const isSameAccount = isIntraAccountCopy(copyJobState?.source?.account?.id, copyJobState?.target?.account?.id);

  useEffect(() => {
    return () => {
      setValidationCache(new Map<string, boolean>());
    };
  }, []);

  return (
    <Stack className="assignPermissionsContainer" tokens={{ childrenGap: 20 }}>
      <Text variant="medium" style={{ color: "var(--colorNeutralForeground1)" }}>
        {isSameAccount && copyJobState.migrationType === CopyJobMigrationType.Online
          ? ContainerCopyMessages.assignPermissions.intraAccountOnlineDescription(
              copyJobState?.source?.account?.name || "",
            )
          : ContainerCopyMessages.assignPermissions.crossAccountDescription}
      </Text>

      {totalSectionsCount === 0 ? (
        <ShimmerTree indentLevels={indentLevels} style={{ width: "100%" }} />
      ) : (
        <Stack tokens={{ childrenGap: 25 }}>
          {permissionGroups.map((group) => (
            <PermissionGroup key={group.id} {...group} />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default AssignPermissions;
