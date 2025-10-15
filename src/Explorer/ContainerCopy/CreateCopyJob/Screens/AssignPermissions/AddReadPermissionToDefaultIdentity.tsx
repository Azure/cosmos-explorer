import { ITooltipHostStyles, Stack, Toggle } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import useToggle from "./hooks/useToggle";

const TooltipContent = ContainerCopyMessages.readPermissionAssigned.tooltip;
const hostStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };

const AddReadPermissionToDefaultIdentity: React.FC = () => {
    const [readPermissionAssigned, onToggle] = useToggle(false);

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
                visible={readPermissionAssigned}
                title={ContainerCopyMessages.readPermissionAssigned.popoverTitle}
                onCancel={() => onToggle(null, false)}
                onPrimary={() => console.log('Primary action taken')}
            >
                {ContainerCopyMessages.readPermissionAssigned.popoverDescription}
            </PopoverMessage>
        </Stack>
    );
};

export default AddReadPermissionToDefaultIdentity;
