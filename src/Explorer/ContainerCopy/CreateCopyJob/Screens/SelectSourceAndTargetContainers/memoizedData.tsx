import React from "react";
import { getAccountDetailsFromResourceId } from "../../../CopyJobUtils";
import { CopyJobContextState, DatabaseParams, DataContainerParams } from "../../../Types/CopyJobTypes";

export function useMemoizedSourceAndTargetData(copyJobState: CopyJobContextState) {
  const { source, target } = copyJobState ?? {};
  const selectedSourceAccount = source?.account;
  const selectedTargetAccount = target?.account;
  const {
    subscriptionId: sourceSubscriptionId,
    resourceGroup: sourceResourceGroup,
    accountName: sourceAccountName,
  } = getAccountDetailsFromResourceId(selectedSourceAccount?.id);
  const {
    subscriptionId: targetSubscriptionId,
    resourceGroup: targetResourceGroup,
    accountName: targetAccountName,
  } = getAccountDetailsFromResourceId(selectedTargetAccount?.id);

  const sourceDbParams = React.useMemo(
    () => [sourceSubscriptionId, sourceResourceGroup, sourceAccountName, "SQL"] as DatabaseParams,
    [sourceSubscriptionId, sourceResourceGroup, sourceAccountName],
  );

  const sourceContainerParams = React.useMemo(
    () =>
      [sourceSubscriptionId, sourceResourceGroup, sourceAccountName, source?.databaseId, "SQL"] as DataContainerParams,
    [sourceSubscriptionId, sourceResourceGroup, sourceAccountName, source?.databaseId],
  );

  const targetDbParams = React.useMemo(
    () => [targetSubscriptionId, targetResourceGroup, targetAccountName, "SQL"] as DatabaseParams,
    [targetSubscriptionId, targetResourceGroup, targetAccountName],
  );

  const targetContainerParams = React.useMemo(
    () =>
      [targetSubscriptionId, targetResourceGroup, targetAccountName, target?.databaseId, "SQL"] as DataContainerParams,
    [targetSubscriptionId, targetResourceGroup, targetAccountName, target?.databaseId],
  );

  return { source, target, sourceDbParams, sourceContainerParams, targetDbParams, targetContainerParams };
}
