import { getAccountDetailsFromResourceId } from "../../../CopyJobUtils";
import { CopyJobContextState, DatabaseParams, DataContainerParams } from "../../../Types/CopyJobTypes";

export function useSourceAndTargetData(copyJobState: CopyJobContextState) {
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

  const sourceDbParams = [sourceSubscriptionId, sourceResourceGroup, sourceAccountName, "SQL"] as DatabaseParams;
  const sourceContainerParams = [
    sourceSubscriptionId,
    sourceResourceGroup,
    sourceAccountName,
    source?.databaseId,
    "SQL",
  ] as DataContainerParams;
  const targetDbParams = [targetSubscriptionId, targetResourceGroup, targetAccountName, "SQL"] as DatabaseParams;
  const targetContainerParams = [
    targetSubscriptionId,
    targetResourceGroup,
    targetAccountName,
    target?.databaseId,
    "SQL",
  ] as DataContainerParams;

  return { source, target, sourceDbParams, sourceContainerParams, targetDbParams, targetContainerParams };
}
