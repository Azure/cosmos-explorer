import { useBoolean } from "@uifabric/react-hooks";
import { Text, TextField } from "office-ui-fabric-react";
import React, { FunctionComponent, useState } from "react";
import LoadingIndicator_3Squares from "../../../images/LoadingIndicator_3Squares.gif";
import * as Constants from "../../Common/Constants";
import { deleteDatabase } from "../../Common/dataAccess/deleteDatabase";
import DeleteFeedback from "../../Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import * as ViewModels from "../../Contracts/ViewModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { PanelErrorComponent } from "./PanelErrorComponent";
import { PanelFooterComponent } from "./PanelFooterComponent";

interface DeleteDatabaseConfirmationPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
  selectedDatabase: {
    id: () => string;
    collections: () => Array<ViewModels.Collection>;
  };
}

export const DeleteDatabaseConfirmationPanel: FunctionComponent<DeleteDatabaseConfirmationPanelProps> = (
  props: DeleteDatabaseConfirmationPanelProps
): JSX.Element => {
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);

  const [formError, setFormError] = useState<string>("");
  const [databaseInput, setDatabaseInput] = useState<string>("");
  const [databaseFeedbackInput, setDatabaseFeedbackInput] = useState<string>("");

  const getPanelErrorProps = () => {
    if (formError) {
      return {
        isWarning: false,
        message: formError,
        showErrorDetails: true,
        openNotificationConsole: props.openNotificationConsole,
      };
    }

    return {
      isWarning: true,
      showErrorDetails: false,
      message:
        "Warning! The action you are about to take cannot be undone. Continuing will permanently delete this resource and all of its children resources.",
    };
  };

  const submit = async (): Promise<void> => {
    const { selectedDatabase, explorer } = props;
    if (!isValid()) {
      setFormError("Input database name does not match the selected database");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Error while deleting collection ${selectedDatabase && selectedDatabase.id()}`
      );
      return;
    }
    setFormError("");
    setLoadingTrue();

    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDatabase, {
      databaseId: selectedDatabase.id(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: "Delete Database",
    });

    try {
      await deleteDatabase(selectedDatabase.id());
      setLoadingFalse();
      props.closePanel();
      explorer.refreshAllDatabases();
      explorer.tabsManager.closeTabsByComparator((tab) => tab.node?.id() === selectedDatabase.id());
      explorer.selectedNode(undefined);
      selectedDatabase
        .collections()
        .forEach((collection: ViewModels.Collection) =>
          explorer.tabsManager.closeTabsByComparator(
            (tab) =>
              tab.node?.id() === collection.id() &&
              (tab.node as ViewModels.Collection).databaseId === collection.databaseId
          )
        );
      TelemetryProcessor.traceSuccess(
        Action.DeleteDatabase,
        {
          databaseId: selectedDatabase.id(),
          dataExplorerArea: Constants.Areas.ContextualPane,
          paneTitle: "Delete Database",
        },
        startKey
      );

      if (shouldRecordFeedback()) {
        const deleteFeedback = new DeleteFeedback(
          explorer.databaseAccount().id,
          explorer.databaseAccount().name,
          DefaultExperienceUtility.getApiKindFromDefaultExperience(explorer.defaultExperience()),
          databaseFeedbackInput
        );

        TelemetryProcessor.trace(Action.DeleteDatabase, ActionModifiers.Mark, {
          message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
        });
        setDatabaseFeedbackInput("");
      }
    } catch (error) {
      setLoadingFalse();
      setFormError(error);
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.DeleteDatabase,
        {
          databaseId: selectedDatabase.id(),
          dataExplorerArea: Constants.Areas.ContextualPane,
          paneTitle: "Delete Database",
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
    }
  };

  const shouldRecordFeedback = (): boolean => {
    const { explorer } = props;
    return explorer.isLastNonEmptyDatabase() || (explorer.isLastDatabase() && explorer.isSelectedDatabaseShared());
  };

  const isValid = (): boolean => {
    const { selectedDatabase } = props;
    if (!(selectedDatabase && selectedDatabase.id())) {
      return false;
    }
    return databaseInput === (selectedDatabase && selectedDatabase.id());
  };

  return (
    <div className="panelContentContainer">
      <PanelErrorComponent {...getPanelErrorProps()} />
      <div className="panelMainContent">
        <div className="confirmDeleteInput">
          <span className="mandatoryStar">* </span>
          <Text variant="small">Confirm by typing the database id</Text>
          <TextField
            id="confirmDatabaseId"
            autoFocus
            styles={{ fieldGroup: { width: 300 } }}
            onChange={(event, newInput?: string) => {
              setDatabaseInput(newInput);
            }}
          />
        </div>
        {shouldRecordFeedback() && (
          <div className="deleteDatabaseFeedback">
            <Text variant="small" block>
              Help us improve Azure Cosmos DB!
            </Text>
            <Text variant="small" block>
              What is the reason why you are deleting this database?
            </Text>
            <TextField
              id="deleteDatabaseFeedbackInput"
              styles={{ fieldGroup: { width: 300 } }}
              multiline
              rows={3}
              onChange={(event, newInput?: string) => {
                setDatabaseFeedbackInput(newInput);
              }}
            />
          </div>
        )}
      </div>
      <PanelFooterComponent buttonLabel="OK" onOKButtonClicked={() => submit()} />
      <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer" hidden={!isLoading}>
        <img className="dataExplorerLoader" src={LoadingIndicator_3Squares} />
      </div>
    </div>
  );
};
