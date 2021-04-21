import { Text, TextField } from "office-ui-fabric-react";
import React, { FunctionComponent, useState } from "react";
import { Areas } from "../../../Common/Constants";
import { deleteCollection } from "../../../Common/dataAccess/deleteCollection";
import DeleteFeedback from "../../../Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { Collection } from "../../../Contracts/ViewModels";
import { DefaultExperienceUtility } from "../../../Shared/DefaultExperienceUtility";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "../GenericRightPaneComponent/GenericRightPaneComponent";
export interface DeleteCollectionConfirmationPaneProps {
  explorer: Explorer;
  collectionName: string;
  closePanel: () => void;
}

export const DeleteCollectionConfirmationPane: FunctionComponent<DeleteCollectionConfirmationPaneProps> = ({
  explorer,
  closePanel,
  collectionName,
}: DeleteCollectionConfirmationPaneProps) => {
  const [deleteCollectionFeedback, setDeleteCollectionFeedback] = useState<string>("");
  const [inputCollectionName, setInputCollectionName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);

  const shouldRecordFeedback = (): boolean => {
    return explorer.isLastCollection() && !explorer.isSelectedDatabaseShared();
  };
  const paneTitle = "Delete " + collectionName;
  const submit = async (): Promise<void> => {
    const collection = explorer.findSelectedCollection();
    if (!collection || inputCollectionName !== collection.id()) {
      const errorMessage = "Input " + collectionName + " name does not match the selected " + collectionName;
      setFormError(errorMessage);
      NotificationConsoleUtils.logConsoleError(
        `Error while deleting ${collectionName} ${collection.id()}: ${errorMessage}`
      );
      return;
    }

    const paneInfo = {
      collectionId: collection.id(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle,
    };

    setFormError("");
    setIsExecuting(true);

    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteCollection, paneInfo);

    try {
      await deleteCollection(collection.databaseId, collection.id());

      setIsExecuting(false);
      explorer.selectedNode(collection.database);
      explorer.tabsManager?.closeTabsByComparator(
        (tab) => tab.node?.id() === collection.id() && (tab.node as Collection).databaseId === collection.databaseId
      );
      explorer.refreshAllDatabases();

      TelemetryProcessor.traceSuccess(Action.DeleteCollection, paneInfo, startKey);

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
          ...paneInfo,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
    }
  };
  const genericPaneProps: GenericRightPaneProps = {
    container: explorer,
    formError: formError,
    formErrorDetail: formError,
    id: "deleteCollectionpane",
    isExecuting,
    title: paneTitle,
    submitButtonText: "OK",
    onClose: closePanel,
    onSubmit: submit,
  };
  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          <div className="confirmDeleteInput">
            <span className="mandatoryStar">* </span>
            <Text variant="small">Confirm by typing the {collectionName.toLowerCase()} id</Text>
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
                What is the reason why you are deleting this {collectionName}?
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
      </div>
    </GenericRightPaneComponent>
  );
};
