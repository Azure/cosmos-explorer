import { Text, TextField } from "office-ui-fabric-react";
import React, { FormEvent, FunctionComponent, useState } from "react";
import { Areas } from "../../../Common/Constants";
import { deleteCollection } from "../../../Common/dataAccess/deleteCollection";
import DeleteFeedback from "../../../Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { Collection } from "../../../Contracts/ViewModels";
import { DefaultAccountExperienceType } from "../../../DefaultAccountExperienceType";
import { DefaultExperienceUtility } from "../../../Shared/DefaultExperienceUtility";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent, PanelInfoErrorProps } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";
export interface DeleteCollectionConfirmationPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
}

export const DeleteCollectionConfirmationPanel: FunctionComponent<DeleteCollectionConfirmationPanelProps> = ({
  explorer,
  closePanel,
  openNotificationConsole,
}: DeleteCollectionConfirmationPanelProps) => {
  const [deleteCollectionFeedback, setDeleteCollectionFeedback] = useState<string>("");
  const [inputCollectionName, setInputCollectionName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);

  const getCollectionName = (): string => {
    switch (userContext.defaultExperience) {
      case DefaultAccountExperienceType.DocumentDB:
        return "Container";
      case DefaultAccountExperienceType.MongoDB:
        return "Collection";
      case DefaultAccountExperienceType.Cassandra:
      case DefaultAccountExperienceType.Table:
        return "Table";
      case DefaultAccountExperienceType.Graph:
        return "Graph";
      default:
        throw new Error(`Unsupported default experience type: ${userContext.defaultExperience}`);
    }
  };
  const storageType: string = getCollectionName();

  const getPanelErrorProps = (): PanelInfoErrorProps => {
    if (formError) {
      return {
        messageType: "error",
        message: formError,
        showErrorDetails: true,
        openNotificationConsole,
      };
    }

    return {
      messageType: "warning",
      showErrorDetails: false,
      message:
        "Warning! The action you are about to take cannot be undone. Continuing will permanently delete this resource and all of its children resources.",
    };
  };

  const shouldRecordFeedback = (): boolean => {
    return explorer.isLastCollection() && !explorer.isSelectedDatabaseShared();
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const collection = explorer.findSelectedCollection();
    if (!collection || inputCollectionName !== collection.id()) {
      const errorMessage = "Input collection name does not match the selected collection";
      setFormError(errorMessage);
      NotificationConsoleUtils.logConsoleError(`Error while deleting collection ${collection.id()}: ${errorMessage}`);
      return;
    }

    setFormError("");
    setIsExecuting(true);

    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteCollection, {
      collectionId: collection.id(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: "Delete " + storageType,
    });

    try {
      await deleteCollection(collection.databaseId, collection.id());

      setIsExecuting(false);
      explorer.selectedNode(collection.database);
      explorer.tabsManager?.closeTabsByComparator(
        (tab) => tab.node?.id() === collection.id() && (tab.node as Collection).databaseId === collection.databaseId
      );
      explorer.refreshAllDatabases();

      TelemetryProcessor.traceSuccess(
        Action.DeleteCollection,
        {
          collectionId: collection.id(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: "Delete " + storageType,
        },
        startKey
      );

      if (shouldRecordFeedback()) {
        const deleteFeedback = new DeleteFeedback(
          userContext.databaseAccount?.id,
          userContext.databaseAccount?.name,
          DefaultExperienceUtility.getApiKindFromDefaultExperience(userContext.defaultExperience),
          deleteCollectionFeedback
        );

        TelemetryProcessor.trace(Action.DeleteCollection, ActionModifiers.Mark, {
          message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
        });
      }

      closePanel();
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      setFormError(errorMessage);
      setIsExecuting(false);

      TelemetryProcessor.traceFailure(
        Action.DeleteCollection,
        {
          collectionId: collection.id(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: "Delete " + storageType,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
    }
  };

  return (
    <form className="panelFormWrapper" onSubmit={submit}>
      <PanelInfoErrorComponent {...getPanelErrorProps()} />
      <div className="panelMainContent">
        <div className="confirmDeleteInput">
          <span className="mandatoryStar">* </span>
          <Text variant="small">Confirm by typing the {storageType.toLowerCase()} id</Text>
          <TextField
            id="confirmCollectionId"
            autoFocus
            value={inputCollectionName}
            styles={{ fieldGroup: { width: 300 } }}
            onChange={(event, newInput?: string) => {
              setInputCollectionName(newInput);
            }}
          />
        </div>
        {shouldRecordFeedback() && (
          <div className="deleteCollectionFeedback">
            <Text variant="small" block>
              Help us improve Azure Cosmos DB!
            </Text>
            <Text variant="small" block>
              What is the reason why you are deleting this container?
            </Text>
            <TextField
              id="deleteCollectionFeedbackInput"
              styles={{ fieldGroup: { width: 300 } }}
              multiline
              value={deleteCollectionFeedback}
              rows={3}
              onChange={(event, newInput?: string) => {
                setDeleteCollectionFeedback(newInput);
              }}
            />
          </div>
        )}
      </div>
      <PanelFooterComponent buttonLabel="OK" />
      {isExecuting && <PanelLoadingScreen />}
    </form>
  );
};
