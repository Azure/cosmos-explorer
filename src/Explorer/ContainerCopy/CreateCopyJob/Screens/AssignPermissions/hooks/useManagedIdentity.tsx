import { DatabaseAccount } from "Contracts/DataModels";
import { useCallback, useState } from "react";
import { logError } from "../../../../../../Common/Logger";
import { useCopyJobContext } from "../../../../Context/CopyJobContext";
import { getAccountDetailsFromResourceId } from "../../../../CopyJobUtils";

interface UseManagedIdentityUpdaterParams {
  updateIdentityFn: (
    subscriptionId: string,
    resourceGroup?: string,
    accountName?: string,
  ) => Promise<DatabaseAccount | undefined>;
}

interface UseManagedIdentityUpdaterReturn {
  loading: boolean;
  handleAddSystemIdentity: () => Promise<void>;
}

const useManagedIdentity = (
  updateIdentityFn: UseManagedIdentityUpdaterParams["updateIdentityFn"],
): UseManagedIdentityUpdaterReturn => {
  const { copyJobState, setCopyJobState, setContextError } = useCopyJobContext();
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddSystemIdentity = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const selectedTargetAccount = copyJobState?.target?.account;
      const {
        subscriptionId: targetSubscriptionId,
        resourceGroup: targetResourceGroup,
        accountName: targetAccountName,
      } = getAccountDetailsFromResourceId(selectedTargetAccount?.id);

      const updatedAccount = await updateIdentityFn(targetSubscriptionId, targetResourceGroup, targetAccountName);
      if (updatedAccount) {
        setCopyJobState((prevState) => ({
          ...prevState,
          target: { ...prevState.target, account: updatedAccount },
        }));
      }
    } catch (error) {
      const errorMessage = error.message || "Error enabling system-assigned managed identity. Please try again later.";
      logError(errorMessage, "CopyJob/useManagedIdentity.handleAddSystemIdentity");
      setContextError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [updateIdentityFn]);

  return { loading, handleAddSystemIdentity };
};

export default useManagedIdentity;
