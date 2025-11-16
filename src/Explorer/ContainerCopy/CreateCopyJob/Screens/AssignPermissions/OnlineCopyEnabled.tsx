import { Link, PrimaryButton, Stack } from "@fluentui/react";
import { CapabilityNames } from "Common/Constants";
import { DatabaseAccount } from "Contracts/DataModels";
import React from "react";
import { fetchDatabaseAccount } from "Utils/arm/databaseAccountUtils";
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
  const [showRefreshButton, setShowRefreshButton] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { copyJobState: { source } = {}, setCopyJobState } = useCopyJobContext();
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
      console.error("Error fetching source account after enabling online copy:", error);
      setLoading(false);
    }
  };

  const clearIntervalAndShowRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setShowRefreshButton(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    handleFetchAccount();
  };

  const handleOnlineCopyEnable = async () => {
    setLoading(true);
    setShowRefreshButton(false);

    await updateDatabaseAccount(sourceSubscriptionId, sourceResourceGroup, sourceAccountName, {
      properties: {
        enableAllVersionsAndDeletesChangeFeed: true,
      },
    });

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
      15 * 60 * 1000,
    );
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
