import { useBoolean } from "@uifabric/react-hooks";
import { Text, TextField } from "office-ui-fabric-react";
import Q from "q";
import React, { FunctionComponent, useState } from 'react';
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
}

export const DeleteDatabaseConfirmationPanel: FunctionComponent<DeleteDatabaseConfirmationPanelProps> = (props: DeleteDatabaseConfirmationPanelProps): JSX.Element => {
  // For showing/hiding panel
  const [isHidden, { setTrue: setHiddenTrue, setFalse: setHiddenFalse }] = useBoolean(true);

  const [formError, setFormError] = useState<string>("");
  const [databaseInput, setDatabaseInput] = useState<string>("");
  const [databaseFeedbackInput, setDatabaseFeedbackInput] = useState<string>("")


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
  }

  const submit = (): Q.Promise<any> => {
    // Get selected db
    const selectedDatabase = props.explorer.findSelectedDatabase();
    if (!isValid()) {
      setFormError("Input database name does not match the selected database");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Error while deleting collection ${selectedDatabase && selectedDatabase.id()}`
      );
      return Q.resolve();
    }
    setFormError("");
    setHiddenFalse();

    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDatabase, {
      databaseId: selectedDatabase.id(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: "Delete Database",
    });

    return Q(
      deleteDatabase(selectedDatabase.id()).then(
        () => {
          setHiddenFalse();
          props.closePanel();
          props.explorer.refreshAllDatabases();
          props.explorer.tabsManager.closeTabsByComparator((tab) => tab.node?.id() === selectedDatabase.id());
          props.explorer.selectedNode(undefined);
          selectedDatabase
            .collections()
            .forEach((collection: ViewModels.Collection) =>
              props.explorer.tabsManager.closeTabsByComparator(
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
              props.explorer.databaseAccount().id,
              props.explorer.databaseAccount().name,
              DefaultExperienceUtility.getApiKindFromDefaultExperience(props.explorer.defaultExperience()),
              databaseFeedbackInput
            );

            TelemetryProcessor.trace(Action.DeleteDatabase, ActionModifiers.Mark, {
              message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
            });
            setDatabaseFeedbackInput("");
          }
        },
        (error: Error) => {
          setHiddenTrue();
          const errorMessage = getErrorMessage(error);
          setFormError(errorMessage);
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
      )
    );
  }

  const shouldRecordFeedback = (): boolean => {
    return (
      props.explorer.isLastNonEmptyDatabase() ||
      (props.explorer.isLastDatabase() && props.explorer.isSelectedDatabaseShared())
    );
  }

  const isValid = (): boolean => {
    const selectedDatabase = props.explorer.findSelectedDatabase();
    if (!selectedDatabase.id()) {
      return false;
    }
    return databaseInput === selectedDatabase.id();
  }

  return (
    <div className="panelContentContainer">
      <PanelErrorComponent {...getPanelErrorProps()} />
      <div className="panelMainContent">
        <div className="confirmDeleteInput">
          <span className="mandatoryStar">* </span>
          <Text variant="small">Confirm by typing the database id</Text>
          <TextField
            id="confirmCollectionId"
            autoFocus
            styles={{ fieldGroup: { width: 300 } }}
            onChange={(event, newInput?: string) => {
              setDatabaseInput(newInput)
            }}
          />
        </div>
        {shouldRecordFeedback() && (
          <div className="deleteCollectionFeedback">
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
      <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer" hidden={isHidden}>
        <img className="dataExplorerLoader" src={LoadingIndicator_3Squares} />
      </div>
    </div>
  )
}

