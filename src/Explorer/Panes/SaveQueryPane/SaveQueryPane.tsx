import { useBoolean } from "@uifabric/react-hooks";
import { Text, TextField } from "office-ui-fabric-react";
import React, { FunctionComponent, useState } from "react";
import { Areas, SavedQueries } from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { Query } from "../../../Contracts/DataModels";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
import { logConsoleError } from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import QueryTab from "../../Tabs/QueryTab";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "../GenericRightPaneComponent/GenericRightPaneComponent";

interface SaveQueryPaneProps {
  explorer: Explorer;
  closePanel: () => void;
}

export const SaveQueryPane: FunctionComponent<SaveQueryPaneProps> = ({
  explorer,
  closePanel,
}: SaveQueryPaneProps): JSX.Element => {
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [formError, setFormError] = useState<string>("");
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  const [queryName, setQueryName] = useState<string>("");

  const setupSaveQueriesText = `For compliance reasons, we save queries in a container in your Azure Cosmos account, in a separate database called “${SavedQueries.DatabaseName}”. To proceed, we need to create a container in your account, estimated additional cost is $0.77 daily.`;
  const title = "Save Query";
  const { canSaveQueries } = explorer;
  const genericPaneProps: GenericRightPaneProps = {
    expandConsole: () => explorer.expandConsole(),
    formError: formError,
    formErrorDetail: formErrorsDetails,
    id: "saveQueryPane",
    isExecuting: isLoading,
    title,
    submitButtonText: canSaveQueries() ? "Save" : "Complete setup",
    onClose: () => closePanel(),
    onSubmit: () => {
      canSaveQueries() ? submit() : setupQueries();
    },
  };

  const submit = async (): Promise<void> => {
    setFormError("");
    setFormErrorsDetails("");
    if (!canSaveQueries()) {
      setFormError("Cannot save query");
      setFormErrorsDetails("Failed to save query: account not set up to save queries");
      logConsoleError("Failed to save query: account not setup to save queries");
    }

    const queryTab = explorer && (explorer.tabsManager.activeTab() as QueryTab);
    const query: string = queryTab && queryTab.sqlQueryEditorContent();
    if (!queryName || queryName.length === 0) {
      setFormError("No query name specified");
      setFormErrorsDetails("No query name specified. Please specify a query name.");
      logConsoleError("Could not save query -- No query name specified. Please specify a query name.");
      return;
    } else if (!query || query.length === 0) {
      setFormError("Invalid query content specified");
      setFormErrorsDetails("Invalid query content specified. Please enter query content.");
      logConsoleError("Could not save query -- Invalid query content specified. Please enter query content.");
      return;
    }

    const queryParam: Query = {
      id: queryName,
      resourceId: explorer.queriesClient.getResourceId(),
      queryName: queryName,
      query: query,
    };
    const startKey: number = traceStart(Action.SaveQuery, {
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: title,
    });
    setLoadingTrue();
    try {
      await explorer.queriesClient.saveQuery(queryParam);
      setLoadingFalse();
      queryTab.tabTitle(queryParam.queryName);
      queryTab.tabPath(`${queryTab.collection.databaseId}>${queryTab.collection.id()}>${queryParam.queryName}`);
      traceSuccess(
        Action.SaveQuery,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: title,
        },
        startKey
      );
      closePanel();
    } catch (error) {
      setLoadingFalse();
      const errorMessage = getErrorMessage(error);
      setFormError("Failed to save query");
      setFormErrorsDetails(`Failed to save query: ${errorMessage}`);
      traceFailure(
        Action.SaveQuery,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: title,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
    }
  };

  const setupQueries = async (): Promise<void> => {
    const startKey: number = traceStart(Action.SetupSavedQueries, {
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: title,
    });

    try {
      setLoadingTrue();
      await explorer.queriesClient.setupQueriesCollection();
      explorer.refreshAllDatabases();
      traceSuccess(
        Action.SetupSavedQueries,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: title,
        },
        startKey
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      traceFailure(
        Action.SetupSavedQueries,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: title,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
      setFormError("Failed to setup a container for saved queries");
      setFormErrorsDetails(`Failed to setup a container for saved queries: ${errorMessage}`);
    } finally {
      setLoadingFalse();
    }
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          {!canSaveQueries() ? (
            <Text variant="small">{setupSaveQueriesText}</Text>
          ) : (
            <TextField
              id="saveQueryInput"
              label="Name"
              styles={{ fieldGroup: { width: 300 } }}
              onChange={(event, newInput?: string) => {
                setQueryName(newInput);
              }}
            />
          )}
        </div>
      </div>
    </GenericRightPaneComponent>
  );
};
