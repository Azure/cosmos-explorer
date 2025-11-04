import { Link, Stack } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";

const OnlineCopyEnabled: React.FC = () => {
  const { copyJobState } = useCopyJobContext();
  return (
    <Stack className="onlineCopyContainer" tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <Stack.Item className="info-message">
          {ContainerCopyMessages.onlineCopyEnabled.description(copyJobState?.source?.account?.name || "")}&ensp;
          <Link href={ContainerCopyMessages.onlineCopyEnabled.href} target="_blank" rel="noopener noreferrer">
            {ContainerCopyMessages.onlineCopyEnabled.hrefText}
          </Link>
      </Stack.Item>
      <Stack.Item>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
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
    </Stack>
  )
};

export default OnlineCopyEnabled;
