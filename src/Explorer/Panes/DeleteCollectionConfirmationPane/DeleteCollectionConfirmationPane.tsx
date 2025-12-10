import { Text, TextField } from "@fluentui/react";
import { Areas } from "Common/Constants";
import DeleteFeedback from "Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { deleteCollection } from "Common/dataAccess/deleteCollection";
import { Collection } from "Contracts/ViewModels";
import { DefaultExperienceUtility } from "Shared/DefaultExperienceUtility";
import { Action, ActionModifiers } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { getCollectionName } from "Utils/APITypeUtils";
import * as NotificationConsoleUtils from "Utils/NotificationConsoleUtils";
import { useSidePanel } from "hooks/useSidePanel";
import { useTabs } from "hooks/useTabs";
import React, { FunctionComponent, useState } from "react";
import { useDatabases } from "../../useDatabases";
import { useSelectedNode } from "../../useSelectedNode";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface DeleteCollectionConfirmationPaneProps {
  refreshDatabases: () => Promise<void>;
}

export const DeleteCollectionConfirmationPane: FunctionComponent<DeleteCollectionConfirmationPaneProps> = ({
  refreshDatabases,
}: DeleteCollectionConfirmationPaneProps) => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const [deleteCollectionFeedback, setDeleteCollectionFeedback] = useState<string>("");
  const [inputCollectionName, setInputCollectionName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);

  const shouldRecordFeedback = (): boolean =>
    useDatabases.getState().isLastCollection() && !useDatabases.getState().findSelectedDatabase()?.isDatabaseShared();

  const collectionName = getCollectionName().toLocaleLowerCase();
  const paneTitle = "Delete " + collectionName;

  const onSubmit = async (): Promise<void> => {
    const collection = useSelectedNode.getState().findSelectedCollection();
    if (!collection || inputCollectionName !== collection.id()) {
      const errorMessage = "Input id " + inputCollectionName + " does not match the selected " + collection.id();
      setFormError(errorMessage);
      NotificationConsoleUtils.logConsoleError(
        `Error while deleting ${collectionName} ${collection.id()}: ${errorMessage}`,
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
      useSelectedNode.getState().setSelectedNode(collection.database);
      useTabs
        .getState()
        .closeTabsByComparator(
          (tab) => tab.node?.id() === collection.id() && (tab.node as Collection).databaseId === collection.databaseId,
        );
      refreshDatabases();

      TelemetryProcessor.traceSuccess(Action.DeleteCollection, paneInfo, startKey);

      if (shouldRecordFeedback()) {
        const deleteFeedback = new DeleteFeedback(
          userContext.databaseAccount?.id,
          userContext.databaseAccount?.name,
          DefaultExperienceUtility.getApiKindFromDefaultExperience(userContext.apiType),
          deleteCollectionFeedback,
        );

        TelemetryProcessor.trace(Action.DeleteCollection, ActionModifiers.Mark, {
          message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
        });
      }

      closeSidePanel();
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
        startKey,
      );
    }
  };
  const props: RightPaneFormProps = {
    formError: formError,
    isExecuting,
    submitButtonText: "OK",
    onSubmit,
  };
  const confirmContainer = `Confirm by typing the ${collectionName.toLowerCase()} id`;
  const reasonInfo = `Help us improve Azure Cosmos DB! What is the reason why you are deleting this ${collectionName}?`;
  return (
    <RightPaneForm {...props}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          <div className="confirmDeleteInput">
            <span className="mandatoryStar">* </span>
            <Text variant="small">Confirm by typing the {collectionName.toLowerCase()} id</Text>
            <TextField
              id="confirmCollectionId"
              data-testid="DeleteCollectionConfirmationPane/ConfirmInput"
              autoFocus
              value={inputCollectionName}
              styles={{ fieldGroup: { width: 300 } }}
              onChange={(event, newInput?: string) => {
                setInputCollectionName(newInput);
              }}
              ariaLabel={confirmContainer}
              required
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
                ariaLabel={reasonInfo}
              />
            </div>
          )}
        </div>
      </div>
    </RightPaneForm>
  );
};
