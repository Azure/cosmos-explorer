import { Image, Stack, Text } from "@fluentui/react";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from "@fluentui/react-components";
import React from "react";
import WarningIcon from "../../../../../../images/warning.svg";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import usePermissionSections, { PermissionSectionConfig } from "./hooks/usePermissionsSection";

const PermissionSection: React.FC<PermissionSectionConfig> = ({ id, title, Component }) => (
    <AccordionItem key={id} value={id}>
        <AccordionHeader className="accordionHeader">
            <Text className="accordionHeaderText" variant="medium">{title}</Text>
            <Image className="statusIcon" src={WarningIcon} alt="Warning icon" width={24} height={24} />
        </AccordionHeader>
        <AccordionPanel>
            <Component />
        </AccordionPanel>
    </AccordionItem>
);

const AssignPermissions = () => {
    const { copyJobState } = useCopyJobContext();
    const permissionSections = usePermissionSections(copyJobState);
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