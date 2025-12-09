import React from "react";
import { DatabaseAccount, Subscription } from "../../../../../../Contracts/DataModels";
import { CopyJobMigrationType } from "../../../../Enums/CopyJobEnums";
import { CopyJobContextProviderType, CopyJobContextState, DropdownOptionType } from "../../../../Types/CopyJobTypes";
import { useCopyJobPrerequisitesCache } from "../../../Utils/useCopyJobPrerequisitesCache";

export function useDropdownOptions(
  subscriptions: Subscription[],
  accounts: DatabaseAccount[],
): {
  subscriptionOptions: DropdownOptionType[];
  accountOptions: DropdownOptionType[];
} {
  const subscriptionOptions =
    subscriptions?.map((sub) => ({
      key: sub.subscriptionId,
      text: sub.displayName,
      data: sub,
    })) || [];

  const normalizeAccountId = (id: string) => {
    if (!id) {
      return id;
    }
    return id.replace(/\/Microsoft\.DocumentDb\//i, "/Microsoft.DocumentDB/");
  };

  const accountOptions =
    accounts?.map((account) => ({
      key: normalizeAccountId(account.id),
      text: account.name,
      data: account,
    })) || [];

  return { subscriptionOptions, accountOptions };
}

type setCopyJobStateType = CopyJobContextProviderType["setCopyJobState"];

export function useEventHandlers(setCopyJobState: setCopyJobStateType) {
  const { setValidationCache } = useCopyJobPrerequisitesCache();
  const handleSelectSourceAccount = (
    type: "subscription" | "account",
    data: (Subscription & DatabaseAccount) | undefined,
  ) => {
    setCopyJobState((prevState: CopyJobContextState) => {
      if (type === "subscription") {
        return {
          ...prevState,
          source: {
            ...prevState.source,
            subscription: data || null,
            account: null,
          },
        };
      }
      if (type === "account") {
        return {
          ...prevState,
          source: {
            ...prevState.source,
            account: data || null,
          },
        };
      }
      return prevState;
    });
    setValidationCache(new Map<string, boolean>());
  };

  const handleMigrationTypeChange = React.useCallback((_ev?: React.FormEvent<HTMLElement>, checked?: boolean) => {
    setCopyJobState((prevState: CopyJobContextState) => ({
      ...prevState,
      migrationType: checked ? CopyJobMigrationType.Offline : CopyJobMigrationType.Online,
    }));
    setValidationCache(new Map<string, boolean>());
  }, []);

  return { handleSelectSourceAccount, handleMigrationTypeChange };
}
