import { PrimaryButton, Stack } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { buildResourceLink } from "../../../CopyJobUtils";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useWindowOpenMonitor from "./hooks/useWindowOpenMonitor";

type AddManagedIdentityProps = Partial<PermissionSectionConfig>;
const OnlineCopyEnabled: React.FC<AddManagedIdentityProps> = () => {
    const { copyJobState: { source } = {} } = useCopyJobContext();
    const sourceAccountLink = buildResourceLink(source?.account);
    const onlineCopyUrl = `${sourceAccountLink}/Features`;
    const onWindowClosed = () => {
        console.log('Online copy window closed');
    };
    const openWindowAndMonitor = useWindowOpenMonitor(onlineCopyUrl, onWindowClosed);

    return (
        <Stack className="onlineCopyContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
            <div className="toggle-label">
                {ContainerCopyMessages.onlineCopyEnabled.description}
            </div>
            <PrimaryButton
                text={ContainerCopyMessages.onlineCopyEnabled.buttonText}
                onClick={openWindowAndMonitor}
            />
        </Stack>
    );
};

export default OnlineCopyEnabled;
