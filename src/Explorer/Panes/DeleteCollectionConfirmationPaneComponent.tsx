import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import * as React from "react";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { PanelFooterComponent } from "./PanelFooterComponent";
import { Collection } from "../../Contracts/ViewModels";
import { Text, TextField } from "office-ui-fabric-react";
import { userContext } from "../../UserContext";
import { Areas } from "../../Common/Constants";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { CassandraAPIDataClient } from "../Tables/TableDataClient";
import { deleteCollection } from "../../Common/dataAccess/deleteCollection";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { PanelErrorComponent, PanelErrorProps } from "./PanelErrorComponent";
import DeleteFeedback from "../../Common/DeleteFeedback";
import Explorer from "../Explorer";
import LoadingIndicator_3Squares from "../../../images/LoadingIndicator_3Squares.gif";

export interface DeleteCollectionConfirmationPaneProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
}

export interface DeleteCollectionConfirmationPaneState {
  formError: string;
  isExecuting: boolean;
}

export class DeleteCollectionConfirmationPaneComponent extends React.Component<
  DeleteCollectionConfirmationPaneProps,
  DeleteCollectionConfirmationPaneState
> {
  private inputCollectionName: string;
  private deleteCollectionFeedback: string;

  constructor(props: DeleteCollectionConfirmationPaneProps) {
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
        <div className="confirmDeleteInput">
          <div>
            <span className="mandatoryStar">* </span>
            <Text variant="small">Confirm by typing the collection id</Text>
          </div>
          <TextField
            styles={{ fieldGroup: { width: 300 } }}
            onChange={(event, newInput?: string) => {
              this.inputCollectionName = newInput;
            }}
          />
        </div>
        <div className="deleteCollectionFeedback contentBeforeFooter">
          <Text variant="small" block>
            Help us improve Azure Cosmos DB!
          </Text>
          <Text variant="small" block>
            What is the reason why you are deleting this container?
          </Text>
          <TextField
            styles={{ fieldGroup: { width: 300 } }}
            multiline
            rows={3}
            onChange={(event, newInput?: string) => {
              this.deleteCollectionFeedback = newInput;
            }}
          />
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

  private async submit(): Promise<void> {
    const collection = this.props.explorer.findSelectedCollection();

    if (!collection || this.inputCollectionName !== collection.id()) {
      const errorMessage = "Input collection name does not match the selected collection";
      this.setState({ formError: errorMessage });
      NotificationConsoleUtils.logConsoleError(`Error while deleting collection ${collection.id()}: ${errorMessage}`);
      return;
    }

    this.setState({ formError: "", isExecuting: true });

    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteCollection, {
      databaseAccountName: userContext.databaseAccount.name,
      defaultExperience: userContext.defaultExperience,
      collectionId: collection.id(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: "Delete Collection",
    });

    try {
      if (userContext.defaultExperience === DefaultAccountExperienceType.Cassandra) {
        const cassandraDataClient = this.props.explorer.tableDataClient as CassandraAPIDataClient;
        await cassandraDataClient.deleteTableOrKeyspace(
          userContext.databaseAccount.properties.cassandraEndpoint,
          userContext.databaseAccount.id,
          `DROP TABLE ${collection.databaseId}.${collection.id()};`
        );
      } else {
        await deleteCollection(collection.databaseId, collection.id());
      }

      this.setState({ isExecuting: false });

      this.props.explorer.selectedNode(collection.database);
      this.props.explorer.tabsManager?.closeTabsByComparator(
        (tab) => tab.node?.id() === collection.id() && (tab.node as Collection).databaseId === collection.databaseId
      );
      this.props.explorer.refreshAllDatabases();

      TelemetryProcessor.traceSuccess(
        Action.DeleteCollection,
        {
          databaseAccountName: userContext.databaseAccount.name,
          defaultExperience: userContext.defaultExperience,
          collectionId: collection.id(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: "Delete Collection",
        },
        startKey
      );

      if (this.props.explorer.isLastCollection() && !this.props.explorer.isSelectedDatabaseShared()) {
        const deleteFeedback = new DeleteFeedback(
          userContext.databaseAccount.id,
          userContext.databaseAccount.name,
          DefaultExperienceUtility.getApiKindFromDefaultExperience(this.props.explorer.defaultExperience()),
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
          databaseAccountName: userContext.databaseAccount.name,
          defaultExperience: userContext.defaultExperience,
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
