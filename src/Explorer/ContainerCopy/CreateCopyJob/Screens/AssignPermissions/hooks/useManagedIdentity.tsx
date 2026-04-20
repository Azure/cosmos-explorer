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
      const selectedSourceAccount = copyJobState?.source?.account;
      const {
        subscriptionId: sourceSubscriptionId,
        resourceGroup: sourceResourceGroup,
        accountName: sourceAccountName,
      } = getAccountDetailsFromResourceId(selectedSourceAccount?.id) || {};

      const updatedAccount = await updateIdentityFn(sourceSubscriptionId, sourceResourceGroup, sourceAccountName);
      if (updatedAccount) {
        setCopyJobState((prevState) => ({
          ...prevState,
          source: { ...prevState.source, account: updatedAccount },
        }));
      }
    } catch (error) {
      const errorMessage = error.message || "Error enabling system-assigned managed identity. Please try again later.";
      logError(errorMessage, "CopyJob/useManagedIdentity.handleAddSystemIdentity");
      setContextError(errorMessage);
      setLoading(false);
    }
  }, [copyJobState?.source?.account?.id, updateIdentityFn, setCopyJobState]);

  return { loading, handleAddSystemIdentity };
};

export default useManagedIdentity;
