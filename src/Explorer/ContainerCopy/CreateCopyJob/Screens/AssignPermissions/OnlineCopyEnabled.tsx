import { Link, PrimaryButton, Stack } from "@fluentui/react";
import { DatabaseAccount } from "Contracts/DataModels";
import React from "react";
import { fetchDatabaseAccount } from "Utils/arm/databaseAccountUtils";
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

  React.useEffect(() => {
    intervalRef.current = setInterval(() => {
      handleFetchAccount();
    }, 30 * 1000);

    timeoutRef.current = setTimeout(
      () => {
        clearIntervalAndShowRefresh();
      },
      15 * 60 * 1000,
    );

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
        <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
          <code>
            {`# Set shell variables
$resourceGroupName = <azure_resource_group>
$accountName = <azure_cosmos_db_account_name>
$EnableOnlineContainerCopy = "EnableOnlineContainerCopy"

# List down existing capabilities of your account
$cosmosdb = az cosmosdb show --resource-group $resourceGroupName --name $accountName

$capabilities = (($cosmosdb | ConvertFrom-Json).capabilities)

# Append EnableOnlineContainerCopy capability in the list of capabilities
$capabilitiesToAdd = @()
foreach ($item in $capabilities) {
  $capabilitiesToAdd += $item.name
}
$capabilitiesToAdd += $EnableOnlineContainerCopy

# Update Cosmos DB account
az cosmosdb update --capabilities $capabilitiesToAdd -n $accountName -g $resourceGroupName`}
          </code>
        </pre>
      </Stack.Item>
      {showRefreshButton && (
        <Stack.Item>
          <PrimaryButton
            className="fullWidth"
            text={ContainerCopyMessages.refreshButtonLabel}
            iconProps={{ iconName: "Refresh" }}
            onClick={handleRefresh}
            disabled={loading}
          />
        </Stack.Item>
      )}
    </Stack>
  );
};

export default OnlineCopyEnabled;
