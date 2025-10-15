import { PrimaryButton, Stack } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { buildResourceLink } from "../../../CopyJobUtils";
import useWindowOpenMonitor from "./hooks/useWindowOpenMonitor";

const PointInTimeRestore: React.FC = () => {
    const { copyJobState: { source } = {} } = useCopyJobContext();
    const sourceAccountLink = buildResourceLink(source?.account);
    const pitrUrl = `${sourceAccountLink}/backupRestore`;

    const onWindowClosed = () => {
        console.log('Point-in-time restore window closed');
    };
    const openWindowAndMonitor = useWindowOpenMonitor(pitrUrl, onWindowClosed);

    return (
        <Stack className="pointInTimeRestoreContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
            <div className="toggle-label">
                {ContainerCopyMessages.pointInTimeRestore.description}
            </div>
            <PrimaryButton
                text={ContainerCopyMessages.pointInTimeRestore.buttonText}
                onClick={openWindowAndMonitor}
            />
        </Stack>
    );
};

export default PointInTimeRestore;
