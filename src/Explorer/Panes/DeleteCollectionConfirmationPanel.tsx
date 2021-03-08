import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import * as React from "react";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { PanelFooterComponent } from "./PanelFooterComponent";
import { Collection } from "../../Contracts/ViewModels";
import { Text, TextField } from "office-ui-fabric-react";
import { userContext } from "../../UserContext";
import { Areas } from "../../Common/Constants";
import { deleteCollection } from "../../Common/dataAccess/deleteCollection";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { PanelErrorComponent, PanelErrorProps } from "./PanelErrorComponent";
import DeleteFeedback from "../../Common/DeleteFeedback";
import Explorer from "../Explorer";
import LoadingIndicator_3Squares from "../../../images/LoadingIndicator_3Squares.gif";

export interface DeleteCollectionConfirmationPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
}

export interface DeleteCollectionConfirmationPanelState {
  formError: string;
  isExecuting: boolean;
}

export class DeleteCollectionConfirmationPanel extends React.Component<
  DeleteCollectionConfirmationPanelProps,
  DeleteCollectionConfirmationPanelState
> {
  private inputCollectionName: string;
  private deleteCollectionFeedback: string;

  constructor(props: DeleteCollectionConfirmationPanelProps) {
    super(props);

    this.state = {
      formError: "",
      isExecuting: false,
    };
  }

  render(): JSX.Element {
    return (
      <div className="panelContentContainer">
        <PanelErrorComponent {...this.getPanelErrorProps()} />
        <div className="panelMainContent">
          <div className="confirmDeleteInput">
            <span className="mandatoryStar">* </span>
            <Text variant="small">Confirm by typing the collection id</Text>
            <TextField
              id="confirmCollectionId"
              autoFocus
              styles={{ fieldGroup: { width: 300 } }}
              onChange={(event, newInput?: string) => {
                this.inputCollectionName = newInput;
              }}
            />
          </div>
          {this.shouldRecordFeedback() && (
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
                rows={3}
                onChange={(event, newInput?: string) => {
                  this.deleteCollectionFeedback = newInput;
                }}
              />
            </div>
          )}
        </div>
        <PanelFooterComponent buttonLabel="OK" onOKButtonClicked={() => this.submit()} />
        <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer" hidden={!this.state.isExecuting}>
          <img className="dataExplorerLoader" src={LoadingIndicator_3Squares} />
        </div>
      </div>
    );
  }

  private getPanelErrorProps(): PanelErrorProps {
    if (this.state.formError) {
      return {
        isWarning: false,
        message: this.state.formError,
        showErrorDetails: true,
        openNotificationConsole: this.props.openNotificationConsole,
      };
    }

    return {
      isWarning: true,
      showErrorDetails: false,
      message:
        "Warning! The action you are about to take cannot be undone. Continuing will permanently delete this resource and all of its children resources.",
    };
  }

  private shouldRecordFeedback(): boolean {
    return this.props.explorer.isLastCollection() && !this.props.explorer.isSelectedDatabaseShared();
  }

  public async submit(): Promise<void> {
    const collection = this.props.explorer.findSelectedCollection();

    if (!collection || this.inputCollectionName !== collection.id()) {
      const errorMessage = "Input collection name does not match the selected collection";
      this.setState({ formError: errorMessage });
      NotificationConsoleUtils.logConsoleError(`Error while deleting collection ${collection.id()}: ${errorMessage}`);
      return;
    }

    this.setState({ formError: "", isExecuting: true });

    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteCollection, {
      collectionId: collection.id(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: "Delete Collection",
    });

    try {
      await deleteCollection(collection.databaseId, collection.id());

      this.setState({ isExecuting: false });
      this.props.explorer.selectedNode(collection.database);
      this.props.explorer.tabsManager?.closeTabsByComparator(
        (tab) => tab.node?.id() === collection.id() && (tab.node as Collection).databaseId === collection.databaseId
      );
      this.props.explorer.refreshAllDatabases();

      TelemetryProcessor.traceSuccess(
        Action.DeleteCollection,
        {
          collectionId: collection.id(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: "Delete Collection",
        },
        startKey
      );

      if (this.shouldRecordFeedback()) {
        const deleteFeedback = new DeleteFeedback(
          userContext.databaseAccount?.id,
          userContext.databaseAccount?.name,
          DefaultExperienceUtility.getApiKindFromDefaultExperience(userContext.defaultExperience),
          this.deleteCollectionFeedback
        );

        TelemetryProcessor.trace(Action.DeleteCollection, ActionModifiers.Mark, {
          message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
        });
      }

      this.props.closePanel();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.setState({ formError: errorMessage, isExecuting: false });
      TelemetryProcessor.traceFailure(
        Action.DeleteCollection,
        {
          collectionId: collection.id(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: "Delete Collection",
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
    }
  }
}
