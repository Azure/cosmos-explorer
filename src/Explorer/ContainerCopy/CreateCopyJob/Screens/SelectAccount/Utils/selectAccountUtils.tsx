import React from "react";
import { DatabaseAccount, Subscription } from "../../../../../../Contracts/DataModels";
import { CopyJobMigrationType } from "../../../../Enums/CopyJobEnums";
import { CopyJobContextProviderType, CopyJobContextState, DropdownOptionType } from "../../../../Types/CopyJobTypes";

export function useDropdownOptions(
  subscriptions: Subscription[],
  accounts: DatabaseAccount[],
): {
  subscriptionOptions: DropdownOptionType[];
  accountOptions: DropdownOptionType[];
} {
  const subscriptionOptions = React.useMemo(
    () =>
      subscriptions?.map((sub) => ({
        key: sub.subscriptionId,
        text: sub.displayName,
        data: sub,
      })) || [],
    [subscriptions],
  );

  const accountOptions = React.useMemo(
    () =>
      accounts?.map((account) => ({
        key: account.id,
        text: account.name,
        data: account,
      })) || [],
    [accounts],
  );

  return { subscriptionOptions, accountOptions };
}

type setCopyJobStateType = CopyJobContextProviderType["setCopyJobState"];

export function useEventHandlers(setCopyJobState: setCopyJobStateType) {
  const handleSelectSourceAccount = React.useCallback(
    (type: "subscription" | "account", data: (Subscription & DatabaseAccount) | undefined) => {
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
    },
    [setCopyJobState],
  );

  const handleMigrationTypeChange = React.useCallback(
    (_ev?: React.FormEvent<HTMLElement>, checked?: boolean) => {
      setCopyJobState((prevState: CopyJobContextState) => ({
        ...prevState,
        migrationType: checked ? CopyJobMigrationType.Offline : CopyJobMigrationType.Online,
      }));
    },
    [setCopyJobState],
  );

  return { handleSelectSourceAccount, handleMigrationTypeChange };
}
