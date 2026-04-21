import { IconButton, Text, TextField } from "@fluentui/react";
import { Areas } from "Common/Constants";
import DeleteFeedback from "Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { deleteCollection } from "Common/dataAccess/deleteCollection";
import { Collection } from "Contracts/ViewModels";
import { Keys, t } from "Localization";
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

const themedTextFieldStyles = {
  fieldGroup: {
    width: 300,
    backgroundColor: "var(--colorNeutralBackground1)",
    borderColor: "var(--colorNeutralStroke1)",
    selectors: {
      ":hover": { borderColor: "var(--colorNeutralStroke1Hover)" },
    },
  },
  field: {
    color: "var(--colorNeutralForeground1)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  subComponentStyles: {
    label: { root: { color: "var(--colorNeutralForeground1)" } },
  },
};

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
  const paneTitle = t(Keys.panes.deleteCollection.panelTitle, { collectionName });
  const selectedCollection = useSelectedNode.getState().selectedNode
    ? useSelectedNode.getState().findSelectedCollection()
    : undefined;
  const selectedCollectionId = selectedCollection?.id() ?? "";

  const onSubmit = async (): Promise<void> => {
    const collection = useSelectedNode.getState().findSelectedCollection();
    if (!collection || inputCollectionName !== collection.id()) {
      const errorMessage = t(Keys.panes.deleteCollection.inputMismatch, {
        input: inputCollectionName,
        selectedId: collection.id(),
      });
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
    submitButtonText: t(Keys.common.ok),
    onSubmit,
  };
  const copyableIdLabel = t(Keys.panes.deleteCollection.copyableId, {
    collectionName: collectionName.toLowerCase(),
  });
  const confirmContainer = t(Keys.panes.deleteCollection.confirmPrompt, {
    collectionName: collectionName.toLowerCase(),
  });
  const reasonInfo =
    t(Keys.panes.deleteCollection.feedbackTitle) +
    " " +
    t(Keys.panes.deleteCollection.feedbackReason, { collectionName });
  return (
    <RightPaneForm {...props}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          <div className="confirmDeleteInput">
            <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
              {copyableIdLabel}
            </Text>
            <TextField
              id="copyableCollectionId"
              readOnly
              value={selectedCollectionId}
              styles={themedTextFieldStyles}
              onRenderSuffix={() => (
                <IconButton
                  iconProps={{ iconName: "Copy" }}
                  title={t(Keys.common.copy)}
                  ariaLabel={t(Keys.common.copy)}
                  onClick={() => navigator.clipboard.writeText(selectedCollectionId)}
                  styles={{ root: { height: "100%" } }}
                />
              )}
              ariaLabel={copyableIdLabel}
            />
            <span className="mandatoryStar">* </span>
            <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
              {confirmContainer}
            </Text>
            <TextField
              id="confirmCollectionId"
              autoFocus
              value={inputCollectionName}
              styles={themedTextFieldStyles}
              onChange={(event, newInput?: string) => {
                setInputCollectionName(newInput);
              }}
              ariaLabel={confirmContainer}
              required
            />
          </div>
          {shouldRecordFeedback() && (
            <div className="deleteCollectionFeedback">
              <Text variant="small" block style={{ color: "var(--colorNeutralForeground1)" }}>
                {t(Keys.panes.deleteCollection.feedbackTitle)}
              </Text>
              <Text variant="small" block style={{ color: "var(--colorNeutralForeground1)" }}>
                {t(Keys.panes.deleteCollection.feedbackReason, { collectionName })}
              </Text>
              <TextField
                id="deleteCollectionFeedbackInput"
                styles={themedTextFieldStyles}
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
