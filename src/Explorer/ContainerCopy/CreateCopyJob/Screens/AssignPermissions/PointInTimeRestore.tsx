import { Link, PrimaryButton, Stack, Text } from "@fluentui/react";
import { DatabaseAccount } from "Contracts/DataModels";
import React, { useEffect, useRef, useState } from "react";
import { fetchDatabaseAccount } from "Utils/arm/databaseAccountUtils";
import LoadingOverlay from "../../../../../Common/LoadingOverlay";
import { logError } from "../../../../../Common/Logger";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { buildResourceLink, getAccountDetailsFromResourceId } from "../../../CopyJobUtils";
import { AccountValidatorFn } from "../../../Types/CopyJobTypes";
import InfoTooltip from "../Components/InfoTooltip";

const tooltipContent = (
  <Text>
    {ContainerCopyMessages.pointInTimeRestore.tooltip.content} &nbsp;
    <Link href={ContainerCopyMessages.pointInTimeRestore.tooltip.href} target="_blank" rel="noopener noreferrer">
      {ContainerCopyMessages.pointInTimeRestore.tooltip.hrefText}
    </Link>
  </Text>
);

const validatorFn: AccountValidatorFn = (prev: DatabaseAccount, next: DatabaseAccount) => {
  const prevBackupPolicy = prev?.properties?.backupPolicy?.type ?? "";
  const nextBackupPolicy = next?.properties?.backupPolicy?.type ?? "";

  return prevBackupPolicy !== nextBackupPolicy;
};

const PointInTimeRestore: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { copyJobState: { source } = {}, setCopyJobState } = useCopyJobContext();
  const sourceAccountLink = buildResourceLink(source?.account);
  const featureUrl = `${sourceAccountLink}/backupRestore`;
  const selectedSourceAccount = source?.account;
  const {
    subscriptionId: sourceSubscriptionId,
    resourceGroup: sourceResourceGroup,
    accountName: sourceAccountName,
  } = getAccountDetailsFromResourceId(selectedSourceAccount?.id);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleFetchAccount = async () => {
    try {
      const account = await fetchDatabaseAccount(sourceSubscriptionId, sourceResourceGroup, sourceAccountName);
      if (account && validatorFn(selectedSourceAccount, account)) {
        setCopyJobState((prevState) => ({
          ...prevState,
          source: { ...prevState.source, account: account },
        }));
        setLoading(false);
      }
    } catch (error) {
      const errorMessage =
        error.message || "Error fetching source account after Point-in-Time Restore. Please try again later.";
      logError(errorMessage, "CopyJob/PointInTimeRestore.handleFetchAccount");
      clearAccountFetchInterval();
    }
  };

  const clearAccountFetchInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setLoading(false);
  };

  const clearIntervalAndShowRefresh = () => {
    clearAccountFetchInterval();
    setShowRefreshButton(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await handleFetchAccount();
    setLoading(false);
  };

  const openWindowAndMonitor = () => {
    setLoading(true);
    setShowRefreshButton(false);
    window.open(featureUrl, "_blank");

    intervalRef.current = setInterval(() => {
      handleFetchAccount();
    }, 30 * 1000);

    timeoutRef.current = setTimeout(
      () => {
        clearIntervalAndShowRefresh();
      },
      10 * 60 * 1000,
    );
  };

  return (
    <Stack className="pointInTimeRestoreContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <LoadingOverlay isLoading={loading} label={ContainerCopyMessages.popoverOverlaySpinnerLabel} />
      <Stack.Item className="toggle-label">
        {ContainerCopyMessages.pointInTimeRestore.description(source.account?.name ?? "")}
        {tooltipContent && (
          <>
            {" "}
            <InfoTooltip content={tooltipContent} />
          </>
        )}
      </Stack.Item>
      <Stack.Item>
        {showRefreshButton ? (
          <PrimaryButton
            className="fullWidth"
            text={ContainerCopyMessages.refreshButtonLabel}
            iconProps={{ iconName: "Refresh" }}
            onClick={handleRefresh}
          />
        ) : (
          <PrimaryButton
            className="fullWidth"
            text={loading ? "" : ContainerCopyMessages.pointInTimeRestore.buttonText}
            {...(loading ? { iconProps: { iconName: "SyncStatusSolid" } } : {})}
            disabled={loading}
            onClick={openWindowAndMonitor}
          />
        )}
      </Stack.Item>
    </Stack>
  );
};

export default PointInTimeRestore;
