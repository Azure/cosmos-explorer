import { DatabaseAccount } from "Contracts/DataModels";
import { useCallback, useState } from "react";
import { useCopyJobContext } from "../../../../Context/CopyJobContext";

interface UseManagedIdentityUpdaterParams {
    updateIdentityFn: (
        subscriptionId: string,
        resourceGroup?: string,
        accountName?: string
    ) => Promise<DatabaseAccount | undefined>;
}

interface UseManagedIdentityUpdaterReturn {
    loading: boolean;
    handleAddSystemIdentity: () => Promise<void>;
}

const useManagedIdentity = (
    updateIdentityFn: UseManagedIdentityUpdaterParams["updateIdentityFn"]
): UseManagedIdentityUpdaterReturn => {
    const { copyJobState, setCopyJobState } = useCopyJobContext();
    const [loading, setLoading] = useState<boolean>(false);

    const handleAddSystemIdentity = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const { target } = copyJobState;
            const updatedAccount = await updateIdentityFn(
                target.subscriptionId,
                target.account?.resourceGroup,
                target.account?.name
            );
            if (updatedAccount) {
                setCopyJobState((prevState) => ({
                    ...prevState,
                    target: { ...prevState.target, account: updatedAccount }
                }));
            }
        } catch (error) {
            console.error("Error enabling system-assigned managed identity:", error);
        } finally {
            setLoading(false);
        }
    }, [copyJobState, updateIdentityFn, setCopyJobState]);

    return { loading, handleAddSystemIdentity };
};

export default useManagedIdentity;