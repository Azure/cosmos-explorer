import { useCallback, useState } from "react";
import { fetchDatabaseAccount } from "../../../../../../Utils/arm/databaseAccountUtils";
import { useCopyJobContext } from "../../../../Context/CopyJobContext";
import { getAccountDetailsFromResourceId } from "../../../../CopyJobUtils";

const useFetchSourceAccountEventHandler = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { copyJobState: { source } = {}, setCopyJobState } = useCopyJobContext();
  const onWindowClosed = useCallback(async (errorMessage: string) => {
    try {
      const selectedSourceAccount = source?.account;
      const {
        subscriptionId: sourceSubscriptionId,
        resourceGroup: sourceResourceGroup,
        accountName: sourceAccountName,
      } = getAccountDetailsFromResourceId(selectedSourceAccount?.id);

      setLoading(true);
      const account = await fetchDatabaseAccount(sourceSubscriptionId, sourceResourceGroup, sourceAccountName);
      if (account) {
        setCopyJobState((prevState) => ({
          ...prevState,
          source: { ...prevState.source, account: account },
        }));
      }
    } catch (error) {
      console.error(errorMessage, error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, onWindowClosed };
};

export default useFetchSourceAccountEventHandler;
