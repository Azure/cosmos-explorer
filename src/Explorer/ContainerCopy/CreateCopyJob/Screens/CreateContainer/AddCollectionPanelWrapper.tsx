import { IDropdownOption, MessageBar, MessageBarType, Spinner, SpinnerSize, Stack, Text } from "@fluentui/react";
import { readDatabasesForAccount } from "Common/dataAccess/readDatabases";
import { AccountOverride } from "Contracts/DataModels";
import Explorer from "Explorer/Explorer";
import { useSidePanel } from "hooks/useSidePanel";
import { produce } from "immer";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AddCollectionPanel } from "../../../../Panes/AddCollectionPanel/AddCollectionPanel";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { getAccountDetailsFromResourceId } from "../../../CopyJobUtils";

type AddCollectionPanelWrapperProps = {
  explorer?: Explorer;
  goBack?: () => void;
};

const AddCollectionPanelWrapper: React.FunctionComponent<AddCollectionPanelWrapperProps> = ({ explorer, goBack }) => {
  const { setCopyJobState, copyJobState } = useCopyJobContext();
  const [destinationDatabases, setDestinationDatabases] = useState<IDropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const targetAccountOverride: AccountOverride | undefined = useMemo(() => {
    const accountId = copyJobState?.target?.account?.id;
    if (!accountId) {
      return undefined;
    }
    const details = getAccountDetailsFromResourceId(accountId);
    if (!details?.subscriptionId || !details?.resourceGroup || !details?.accountName) {
      return undefined;
    }
    return {
      subscriptionId: details.subscriptionId,
      resourceGroup: details.resourceGroup,
      accountName: details.accountName,
    };
  }, [copyJobState?.target?.account?.id]);

  useEffect(() => {
    const sidePanelStore = useSidePanel.getState();
    if (sidePanelStore.headerText !== ContainerCopyMessages.createContainerHeading) {
      sidePanelStore.setHeaderText(ContainerCopyMessages.createContainerHeading);
    }
    return () => {
      sidePanelStore.setHeaderText(ContainerCopyMessages.createCopyJobPanelTitle);
    };
  }, []);

  useEffect(() => {
    if (!targetAccountOverride) {
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    const fetchDatabases = async () => {
      setIsLoading(true);
      setPermissionError(null);
      try {
        const databases = await readDatabasesForAccount(
          targetAccountOverride.subscriptionId,
          targetAccountOverride.resourceGroup,
          targetAccountOverride.accountName,
        );
        if (!cancelled) {
          setDestinationDatabases(databases.map((db) => ({ key: db.id, text: db.id })));
        }
      } catch (error) {
        if (!cancelled) {
          const message = error?.message || String(error);
          if (message.includes("AuthorizationFailed") || message.includes("403")) {
            setPermissionError(
              `You do not have sufficient permissions to access the destination account "${targetAccountOverride.accountName}". ` +
                "Please ensure you have at least Contributor or Owner access to create databases and containers.",
            );
          } else {
            setPermissionError(
              `Failed to load databases from the destination account "${targetAccountOverride.accountName}": ${message}`,
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDatabases();
    return () => {
      cancelled = true;
    };
  }, [targetAccountOverride]);

  const handleAddCollectionSuccess = useCallback(
    (collectionData: { databaseId: string; collectionId: string }) => {
      setCopyJobState(
        produce((state) => {
          state.target.databaseId = collectionData.databaseId;
          state.target.containerId = collectionData.collectionId;
        }),
      );
      goBack?.();
    },
    [goBack],
  );

  if (isLoading) {
    return (
      <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { padding: 20 } }}>
        <Spinner size={SpinnerSize.large} label="Loading destination account databases..." />
      </Stack>
    );
  }

  if (permissionError) {
    return (
      <Stack styles={{ root: { padding: 20 } }}>
        <MessageBar messageBarType={MessageBarType.error}>{permissionError}</MessageBar>
      </Stack>
    );
  }

  return (
    <Stack className="addCollectionPanelWrapper">
      <Stack.Item className="addCollectionPanelHeader">
        <Text className="themeText">
          {ContainerCopyMessages.createNewContainerSubHeading(targetAccountOverride?.accountName)}
        </Text>
      </Stack.Item>
      <Stack.Item className="addCollectionPanelBody">
        <AddCollectionPanel
          explorer={explorer}
          isCopyJobFlow={true}
          onSubmitSuccess={handleAddCollectionSuccess}
          targetAccountOverride={targetAccountOverride}
          externalDatabaseOptions={destinationDatabases}
        />
      </Stack.Item>
    </Stack>
  );
};

export default AddCollectionPanelWrapper;
