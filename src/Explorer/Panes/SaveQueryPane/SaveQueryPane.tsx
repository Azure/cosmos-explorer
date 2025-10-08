import { Text, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { FunctionComponent, useState } from "react";
import { Areas, SavedQueries } from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { Query } from "../../../Contracts/DataModels";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
import { logConsoleError } from "../../../Utils/NotificationConsoleUtils";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { useTabs } from "../../../hooks/useTabs";
import Explorer from "../../Explorer";
import { NewQueryTab } from "../../Tabs/QueryTab/QueryTab";
import { useDatabases } from "../../useDatabases";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

interface SaveQueryPaneProps {
  explorer: Explorer;
  queryToSave?: string;
}

export const SaveQueryPane: FunctionComponent<SaveQueryPaneProps> = ({
  explorer,
  queryToSave,
}: SaveQueryPaneProps): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [formError, setFormError] = useState<string>("");
  const [queryName, setQueryName] = useState<string>("");

  const setupSaveQueriesText = `For compliance reasons, we save queries in a container in your Azure Cosmos account, in a separate database called “${SavedQueries.DatabaseName}”. To proceed, we need to create a container in your account, estimated additional cost is $0.77 daily.`;
  const title = "Save Query";
  const isSaveQueryEnabled = useDatabases((state) => state.isSaveQueryEnabled);

  const submit = async (): Promise<void> => {
    setFormError("");
    if (!isSaveQueryEnabled()) {
      setFormError("Cannot save query");
      logConsoleError("Failed to save query: account not setup to save queries");
    }

    const queryTab = useTabs.getState().activeTab as NewQueryTab;
    const query: string = queryToSave || queryTab?.iTabAccessor.onSaveClickEvent();

    if (!queryName || queryName.length === 0) {
      setFormError("No query name specified");
      logConsoleError("Could not save query -- No query name specified. Please specify a query name.");
      return;
    } else if (!query || query.length === 0) {
      setFormError("Invalid query content specified");
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
      queryTab?.tabTitle(queryParam.queryName);
      queryTab?.tabPath(`${queryTab.collection.databaseId}>${queryTab.collection.id()}>${queryParam.queryName}`);
      traceSuccess(
        Action.SaveQuery,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: title,
        },
        startKey,
      );
      closeSidePanel();
    } catch (error) {
      setLoadingFalse();
      const errorMessage = getErrorMessage(error);
      setFormError("Failed to save query");
      logConsoleError(`Failed to save query: ${errorMessage}`);
      traceFailure(
        Action.SaveQuery,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: title,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey,
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
        startKey,
      );
      closeSidePanel();
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
        startKey,
      );
      setFormError("Failed to setup a container for saved queries");
      logConsoleError(`Failed to setup a container for saved queries: ${errorMessage}`);
    } finally {
      setLoadingFalse();
    }
  };

  const props: RightPaneFormProps = {
    formError: formError,
    isExecuting: isLoading,
    submitButtonText: isSaveQueryEnabled() ? "Save" : "Complete setup",
    onSubmit: () => {
      isSaveQueryEnabled() ? submit() : setupQueries();
    },
    footerStyle: isSaveQueryEnabled() ? { flexGrow: 0 } : {},
  };
  return (
    <RightPaneForm {...props}>
      <div className="panelFormWrapper" style={{ flexGrow: 1 }}>
        <div className="panelMainContent">
          {!isSaveQueryEnabled() ? (
            <Text
              variant="small"
              styles={{
                root: {
                  color: "var(--colorNeutralForeground1)",
                },
              }}
            >
              {setupSaveQueriesText}
            </Text>
          ) : (
            <TextField
              id="saveQueryInput"
              label="Name"
              autoFocus
              styles={{ fieldGroup: { width: 300 } }}
              onChange={(event, newInput?: string) => {
                setQueryName(newInput);
              }}
            />
          )}
        </div>
      </div>
    </RightPaneForm>
  );
};
