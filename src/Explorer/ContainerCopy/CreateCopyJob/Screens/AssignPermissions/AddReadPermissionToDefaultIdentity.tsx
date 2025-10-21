import { ITooltipHostStyles, Stack, Toggle } from "@fluentui/react";
import React, { useCallback } from "react";
import { assignRole } from "../../../../../Utils/arm/RbacUtils";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useToggle from "./hooks/useToggle";

const TooltipContent = ContainerCopyMessages.readPermissionAssigned.tooltip;
const hostStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };
type AddManagedIdentityProps = Partial<PermissionSectionConfig>;

const AddReadPermissionToDefaultIdentity: React.FC<AddManagedIdentityProps> = () => {
    const [loading, setLoading] = React.useState(false);
    const { copyJobState, setCopyJobState } = useCopyJobContext();
    const [readPermissionAssigned, onToggle] = useToggle(false);

    const handleAddReadPermission = useCallback(async () => {
        const { source, target } = copyJobState;
        try {
            setLoading(true);
            const assignedRole = await assignRole(
                source?.subscription?.subscriptionId,
                source?.account?.resourceGroup,
                source?.account?.name,
                target?.account?.identity?.principalId!,
            );
            if (assignedRole) {
                setCopyJobState((prevState) => ({
                    ...prevState,
                    sourceReadAccessFromTarget: true,
                }));
            }
        } catch (error) {
            console.error("Error assigning read permission to default identity:", error);
        } finally {
            setLoading(false);
        }
    }, [copyJobState]);

    return (
        <Stack className="defaultManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
            <div className="toggle-label">
                {ContainerCopyMessages.readPermissionAssigned.description} &nbsp;<InfoTooltip content={TooltipContent} />
            </div>
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
