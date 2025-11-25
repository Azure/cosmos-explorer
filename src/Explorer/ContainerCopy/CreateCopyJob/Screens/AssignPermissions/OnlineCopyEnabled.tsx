import { Link, PrimaryButton, Stack } from "@fluentui/react";
import { DatabaseAccount } from "Contracts/DataModels";
import React from "react";
import { fetchDatabaseAccount } from "Utils/arm/databaseAccountUtils";
import { CapabilityNames } from "../../../../../Common/Constants";
import LoadingOverlay from "../../../../../Common/LoadingOverlay";
import { logError } from "../../../../../Common/Logger";
import { update as updateDatabaseAccount } from "../../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { getAccountDetailsFromResourceId } from "../../../CopyJobUtils";
import { AccountValidatorFn } from "../../../Types/CopyJobTypes";

const validatorFn: AccountValidatorFn = (prev: DatabaseAccount, next: DatabaseAccount) => {
  const prevCapabilities = prev?.properties?.capabilities ?? [];
  const nextCapabilities = next?.properties?.capabilities ?? [];

  return JSON.stringify(prevCapabilities) !== JSON.stringify(nextCapabilities);
};

const OnlineCopyEnabled: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [loaderMessage, setLoaderMessage] = React.useState("");
  const [showRefreshButton, setShowRefreshButton] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { setContextError, copyJobState: { source } = {}, setCopyJobState } = useCopyJobContext();
  const selectedSourceAccount = source?.account;
  const sourceAccountCapabilities = selectedSourceAccount?.properties?.capabilities ?? [];

  const {
    subscriptionId: sourceSubscriptionId,
    resourceGroup: sourceResourceGroup,
    accountName: sourceAccountName,
  } = getAccountDetailsFromResourceId(selectedSourceAccount?.id);

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
        error.message || "Error fetching source account after enabling online copy. Please try again later.";
      logError(errorMessage, "CopyJob/OnlineCopyEnabled.handleFetchAccount");
      setContextError(errorMessage);
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

  const handleRefresh = () => {
    setLoading(true);
    handleFetchAccount();
  };

  const handleOnlineCopyEnable = async () => {
    setLoading(true);
    setShowRefreshButton(false);

    try {
      setLoaderMessage(ContainerCopyMessages.onlineCopyEnabled.validateAllVersionsAndDeletesChangeFeedSpinnerLabel);
      const sourAccountBeforeUpdate = await fetchDatabaseAccount(
        sourceSubscriptionId,
        sourceResourceGroup,
        sourceAccountName,
      );
      if (!sourAccountBeforeUpdate?.properties.enableAllVersionsAndDeletesChangeFeed) {
        setLoaderMessage(ContainerCopyMessages.onlineCopyEnabled.enablingAllVersionsAndDeletesChangeFeedSpinnerLabel);
        await updateDatabaseAccount(sourceSubscriptionId, sourceResourceGroup, sourceAccountName, {
          properties: {
            enableAllVersionsAndDeletesChangeFeed: true,
          },
        });
      }
      setLoaderMessage(ContainerCopyMessages.onlineCopyEnabled.enablingOnlineCopySpinnerLabel(sourceAccountName));
      await updateDatabaseAccount(sourceSubscriptionId, sourceResourceGroup, sourceAccountName, {
        properties: {
          capabilities: [...sourceAccountCapabilities, { name: CapabilityNames.EnableOnlineCopyFeature }],
        },
      });

      intervalRef.current = setInterval(() => {
        handleFetchAccount();
      }, 30 * 1000);

      timeoutRef.current = setTimeout(
        () => {
          clearIntervalAndShowRefresh();
        },
        10 * 60 * 1000,
      );
    } catch (error) {
      const errorMessage = error.message || "Failed to enable online copy feature. Please try again later.";
      logError(errorMessage, "CopyJob/OnlineCopyEnabled.handleOnlineCopyEnable");
      setContextError(errorMessage);
      setLoading(false);
    }
  };

  React.useEffect(() => {
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

  return (
    <Stack className="onlineCopyContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <LoadingOverlay isLoading={loading} label={loaderMessage} />
      <Stack.Item className="info-message">
        {ContainerCopyMessages.onlineCopyEnabled.description(source?.account?.name || "")}&ensp;
        <Link href={ContainerCopyMessages.onlineCopyEnabled.href} target="_blank" rel="noopener noreferrer">
          {ContainerCopyMessages.onlineCopyEnabled.hrefText}
        </Link>
      </Stack.Item>
      <Stack.Item>
        {showRefreshButton ? (
          <PrimaryButton
            className="fullWidth"
            text={ContainerCopyMessages.refreshButtonLabel}
            iconProps={{ iconName: "Refresh" }}
            onClick={handleRefresh}
            disabled={loading}
          />
        ) : (
          <PrimaryButton
            className="fullWidth"
            text={loading ? "" : ContainerCopyMessages.onlineCopyEnabled.buttonText}
            {...(loading ? { iconProps: { iconName: "SyncStatusSolid" } } : {})}
            disabled={loading}
            onClick={handleOnlineCopyEnable}
          />
        )}
      </Stack.Item>
    </Stack>
  );
};

export default OnlineCopyEnabled;
