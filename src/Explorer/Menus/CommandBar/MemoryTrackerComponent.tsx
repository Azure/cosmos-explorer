import React, { FunctionComponent } from "react";
import useSWR from "swr";
import { ProgressIndicator } from "office-ui-fabric-react/lib/ProgressIndicator";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";
import { Stack } from "office-ui-fabric-react/lib/Stack";
import { listConnectionInfo } from "../../../Utils/arm/generatedClients/2020-04-01-notebook/notebookWorkspaces";
import { NotebookWorkspaceConnectionInfoResult } from "../../../Utils/arm/generatedClients/2020-04-01-notebook/types";
import { userContext } from "../../../UserContext";

export interface MemoryUsageInfo {
  total: number;
  free: number;
}

const kbInGB = 1048576;

const fetchMemoryInfo = async (_key: unknown, connectionInfo: NotebookWorkspaceConnectionInfoResult) => {
  const response = await fetch(`${connectionInfo.notebookServerEndpoint}/api/metrics/memory`, {
    method: "GET",
    headers: {
      Authorization: `Token ${connectionInfo.authToken}`,
      "content-type": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const memoryUsageInfo = (await response.json()) as MemoryUsageInfo;
  return {
    totalKB: memoryUsageInfo.total,
    freeKB: memoryUsageInfo.free
  };
};

export const MemoryTrackerComponent: FunctionComponent = () => {
  const { data: connectionInfo } = useSWR(
    [
      "notebooksConnectionInfo",
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      "default"
    ],
    (_key, subscriptionId, resourceGroup, accountName, workspace) =>
      listConnectionInfo(subscriptionId, resourceGroup, accountName, workspace)
  );
  const { data } = useSWR(connectionInfo ? ["memoryUsage", connectionInfo] : null, fetchMemoryInfo, {
    refreshInterval: 2000
  });

  if (!data) {
    return (
      <Stack className="memoryTrackerContainer" horizontal>
        <span>Memory</span>
        <Spinner size={SpinnerSize.medium} />
      </Stack>
    );
  }
  const totalGB = data.totalKB / kbInGB;
  const usedGB = totalGB - data.freeKB / kbInGB;
  return (
    <Stack className="memoryTrackerContainer" horizontal>
      <span>Memory</span>
      <ProgressIndicator
        className={usedGB / totalGB > 0.8 ? "lowMemory" : ""}
        description={usedGB.toFixed(1) + " of " + totalGB.toFixed(1) + " GB"}
        percentComplete={usedGB / totalGB}
      />
    </Stack>
  );
};
