import { PrimaryButton, Stack } from "@fluentui/react";
import React, { useCallback, useState } from "react";
import { fetchDatabaseAccount } from "Utils/arm/databaseAccountUtils";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { buildResourceLink, getAccountDetailsFromResourceId } from "../../../CopyJobUtils";
import { PermissionSectionConfig } from "./hooks/usePermissionsSection";
import useWindowOpenMonitor from "./hooks/useWindowOpenMonitor";

type AddManagedIdentityProps = Partial<PermissionSectionConfig>;
const PointInTimeRestore: React.FC<AddManagedIdentityProps> = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const { copyJobState: { source } = {}, setCopyJobState } = useCopyJobContext();
    const sourceAccountLink = buildResourceLink(source?.account);
    const pitrUrl = `${sourceAccountLink}/backupRestore`;

    const onWindowClosed = useCallback(async () => {
        try {
            const selectedSourceAccount = source?.account;
            const {
                subscriptionId: sourceSubscriptionId,
                resourceGroup: sourceResourceGroup,
                accountName: sourceAccountName
            } = getAccountDetailsFromResourceId(selectedSourceAccount?.id);

            setLoading(true);
            const account = await fetchDatabaseAccount(
                sourceSubscriptionId,
                sourceResourceGroup,
                sourceAccountName
            );
            if (account) {
                setCopyJobState((prevState) => ({
                    ...prevState,
                    source: { ...prevState.source, account: account }
                }));
            }
        } catch (error) {
            console.error("Error fetching database account after PITR window closed:", error);
        } finally {
            setLoading(false);
        }
    }, [])
    const openWindowAndMonitor = useWindowOpenMonitor(pitrUrl, onWindowClosed);

    return (
        <Stack className="pointInTimeRestoreContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
            <div className="toggle-label">
                {ContainerCopyMessages.pointInTimeRestore.description}
            </div>
            <PrimaryButton
                text={loading ? "" : ContainerCopyMessages.pointInTimeRestore.buttonText}
                {...(loading ? { iconProps: { iconName: "SyncStatusSolid" } } : {})}
                disabled={loading}
                onClick={openWindowAndMonitor}
            />
        </Stack>
    );
};

export default PointInTimeRestore;
