import { Image, Stack, Text } from "@fluentui/react";
import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel
} from "@fluentui/react-components";
import React, { useEffect } from "react";
import CheckmarkIcon from "../../../../../../images/successfulPopup.svg";
import WarningIcon from "../../../../../../images/warning.svg";
import ShimmerTree, { IndentLevel } from "../../../../../Common/ShimmerTree";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../Enums";
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
    const { copyJobState } = useCopyJobContext();
    const permissionSections = usePermissionSections(copyJobState);
    const [openItems, setOpenItems] = React.useState<string[]>([]);

    const indentLevels = React.useMemo<IndentLevel[]>(
        () => Array(copyJobState.migrationType === CopyJobMigrationType.Online ? 5 : 3).fill({ level: 0, width: "100%" }),
        []
    );

    useEffect(() => {
        const firstIncompleteSection = permissionSections.find(section => !section.completed);
        const nextOpenItems = firstIncompleteSection ? [firstIncompleteSection.id] : [];
        if (JSON.stringify(openItems) !== JSON.stringify(nextOpenItems)) {
            setOpenItems(nextOpenItems);
        }
    }, [permissionSections]);

    return (
        <Stack className="assignPermissionsContainer" tokens={{ childrenGap: 15 }}>
            <span>
                {ContainerCopyMessages.assignPermissions.description}
            </span>
            {
                permissionSections?.length === 0 ? (
                    <ShimmerTree indentLevels={indentLevels} style={{ width: '100%' }} />
                ) : (
                    <Accordion
                        className="permissionsAccordion"
                        collapsible
                        openItems={openItems}
                    >
                        {
                            permissionSections.map(section => (
                                <PermissionSection key={section.id} {...section} />
                            ))
                        }
                    </Accordion>
                )
            }
        </Stack>
    );
};

export default AssignPermissions;