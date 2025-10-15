import { Link, Stack, Text, Toggle } from "@fluentui/react";
import React, { useMemo } from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { buildResourceLink } from "../../../CopyJobUtils";
import InfoTooltip from "../Components/InfoTooltip";
import PopoverMessage from "../Components/PopoverContainer";
import useToggle from "./hooks/useToggle";

const managedIdentityTooltip = ContainerCopyMessages.addManagedIdentity.managedIdentityTooltip;
const userAssignedTooltip = ContainerCopyMessages.addManagedIdentity.userAssignedIdentityTooltip;

const textStyle = { display: "flex", alignItems: "center" };

const AddManagedIdentity: React.FC = () => {
    const { copyJobState } = useCopyJobContext();
    const [systemAssigned, onToggle] = useToggle(false);

    const manageIdentityLink = useMemo(() => {
        const { target } = copyJobState;
        const resourceUri = buildResourceLink(target.account);
        return target?.account?.id ? `${resourceUri}/ManagedIdentitiesBlade` : "#";
    }, [copyJobState]);

    return (
        <Stack className="addManagedIdentityContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
            <Toggle
                label={
                    <Text className="toggle-label" style={textStyle}>
                        {ContainerCopyMessages.addManagedIdentity.toggleLabel}&nbsp;<InfoTooltip content={managedIdentityTooltip} />
                    </Text>
                }
                checked={systemAssigned}
                onText={ContainerCopyMessages.toggleBtn.onText}
                offText={ContainerCopyMessages.toggleBtn.offText}
                onChange={onToggle}
            />
            <Text className="user-assigned-label" style={textStyle}>
                {ContainerCopyMessages.addManagedIdentity.userAssignedIdentityLabel}&nbsp;<InfoTooltip content={userAssignedTooltip} />
            </Text>
            <div style={{ marginTop: 8 }}>
                <Link href={manageIdentityLink} target="_blank" rel="noopener noreferrer">
                    {ContainerCopyMessages.addManagedIdentity.createUserAssignedIdentityLink}
                </Link>
            </div>
            <PopoverMessage
                visible={systemAssigned}
                title={ContainerCopyMessages.addManagedIdentity.enablementTitle}
                onCancel={() => onToggle(null, false)}
                onPrimary={() => console.log('Primary action taken')}
            >
                {ContainerCopyMessages.addManagedIdentity.enablementDescription(copyJobState.target?.account?.name)}
            </PopoverMessage>
        </Stack>
    );
};

export default AddManagedIdentity;
