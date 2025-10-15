import { Image, Stack, Text } from "@fluentui/react";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from "@fluentui/react-components";
import React from "react";
import CheckmarkIcon from "../../../../../../images/successfulPopup.svg";
import WarningIcon from "../../../../../../images/warning.svg";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import usePermissionSections, { PermissionSectionConfig } from "./hooks/usePermissionsSection";

const PermissionSection: React.FC<PermissionSectionConfig> = ({
    id,
    title,
    Component,
    completed,
    disabled
}) => (
    <AccordionItem key={id} value={id} disabled={disabled}>
        <AccordionHeader className="accordionHeader">
            <Text className="accordionHeaderText" variant="medium">{title}</Text>
            <Image
                className="statusIcon"
                src={completed ? CheckmarkIcon : WarningIcon}
                alt={completed ? "Checkmark icon" : "Warning icon"}
                width={completed ? 20 : 24}
                height={completed ? 20 : 24}
            />
        </AccordionHeader>
        <AccordionPanel aria-disabled={disabled} className="accordionPanel" >
            <Component />
        </AccordionPanel>
    </AccordionItem>
);

const AssignPermissions = () => {
    const { armToken, principalId, copyJobState } = useCopyJobContext();
    const permissionSections = usePermissionSections(copyJobState, armToken, principalId);
    return (
        <Stack className="assignPermissionsContainer" tokens={{ childrenGap: 15 }}>
            <span>
                {ContainerCopyMessages.assignPermissions.description}
            </span>
            <Accordion className="permissionsAccordion" collapsible>
                {
                    permissionSections.map(section => (
                        <PermissionSection key={section.id} {...section} />
                    ))
                }
            </Accordion>
        </Stack>
    );
};

export default AssignPermissions;