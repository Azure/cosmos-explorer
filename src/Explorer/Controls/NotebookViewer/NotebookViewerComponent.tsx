/**
 * Wrapper around Notebook Viewer Read only content
 */
import { Icon, Link, ProgressIndicator } from "@fluentui/react";
import { Notebook } from "@nteract/commutable";
import { createContentRef } from "@nteract/core";
import * as React from "react";
import { contents } from "rx-jupyter";
import { getErrorMessage, getErrorStack, handleError } from "../../../Common/ErrorHandlingUtils";
import { IGalleryItem, JunoClient } from "../../../Juno/JunoClient";
import { SessionStorageUtility } from "../../../Shared/StorageUtility";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
import Explorer from "../../Explorer";
import { NotebookClientV2 } from "../../Notebook/NotebookClientV2";
import { NotebookComponentBootstrapper } from "../../Notebook/NotebookComponent/NotebookComponentBootstrapper";
import NotebookReadOnlyRenderer from "../../Notebook/NotebookRenderer/NotebookReadOnlyRenderer";
import { useNotebook } from "../../Notebook/useNotebook";
import { NotebookMetadataComponent } from "./NotebookMetadataComponent";
import "./NotebookViewerComponent.less";

export interface NotebookViewerComponentProps {
  container?: Explorer;
  junoClient?: JunoClient;
  notebookUrl: string;
  galleryItem?: IGalleryItem;
  isFavorite?: boolean;
  backNavigationText: string;
  hideInputs?: boolean;
  hidePrompts?: boolean;
  onBackClick: () => void;
  onTagClick: (tag: string) => void;
}

interface NotebookViewerComponentState {
  content: Notebook;
  galleryItem?: IGalleryItem;
  isFavorite?: boolean;
  showProgressBar: boolean;
}

export class NotebookViewerComponent extends React.Component<
  NotebookViewerComponentProps,
  NotebookViewerComponentState
> {
  private clientManager: NotebookClientV2;
  private notebookComponentBootstrapper: NotebookComponentBootstrapper;

  constructor(props: NotebookViewerComponentProps) {
    super(props);

    this.clientManager = new NotebookClientV2({
      connectionInfo: { authToken: undefined, notebookServerEndpoint: undefined, forwardingId: undefined },
      databaseAccountName: undefined,
      defaultExperience: "NotebookViewer",
      isReadOnly: true,
      cellEditorType: "codemirror",
      autoSaveInterval: 365 * 24 * 3600 * 1000, // There is no way to turn off auto-save, set to 1 year
      contentProvider: contents.JupyterContentProvider, // NotebookViewer only knows how to talk to Jupyter contents API
    });

    this.notebookComponentBootstrapper = new NotebookComponentBootstrapper({
      notebookClient: this.clientManager,
      contentRef: createContentRef(),
    });

    this.state = {
      content: undefined,
      galleryItem: props.galleryItem,
      isFavorite: props.isFavorite,
      showProgressBar: true,
    };

    this.loadNotebookContent();
  }

  private async loadNotebookContent(): Promise<void> {
    const startKey = traceStart(Action.NotebooksGalleryViewNotebook, {
      notebookUrl: this.props.notebookUrl,
      notebookId: this.props.galleryItem?.id,
      isSample: this.props.galleryItem?.isSample,
    });

    try {
      const response = await fetch(this.props.notebookUrl);
      if (!response.ok) {
        this.setState({ showProgressBar: false });
        throw new Error(`Received HTTP ${response.status} while fetching ${this.props.notebookUrl}`);
      }

      traceSuccess(
        Action.NotebooksGalleryViewNotebook,
        {
          notebookUrl: this.props.notebookUrl,
          notebookId: this.props.galleryItem?.id,
          isSample: this.props.galleryItem?.isSample,
        },
        startKey,
      );

      const notebook: Notebook = await response.json();
      this.notebookComponentBootstrapper.setContent("json", notebook);
      this.setState({ content: notebook, showProgressBar: false });

      if (this.props.galleryItem && !SessionStorageUtility.getEntry(this.props.galleryItem.id)) {
        const response = await this.props.junoClient.increaseNotebookViews(this.props.galleryItem.id);
        if (!response.data) {
          throw new Error(`Received HTTP ${response.status} while increasing notebook views`);
        }
        this.setState({ galleryItem: response.data });
        SessionStorageUtility.setEntry(this.props.galleryItem?.id, "true");
      }
    } catch (error) {
      traceFailure(
        Action.NotebooksGalleryViewNotebook,
        {
          notebookUrl: this.props.notebookUrl,
          notebookId: this.props.galleryItem?.id,
          isSample: this.props.galleryItem?.isSample,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey,
      );

      this.setState({ showProgressBar: false });
      handleError(error, "NotebookViewerComponent/loadNotebookContent", "Failed to load notebook content");
    }
  }

  public render(): JSX.Element {
    return (
      <div className="notebookViewerContainer">
        {this.props.backNavigationText !== undefined ? (
          <Link onClick={this.props.onBackClick}>
            <Icon iconName="Back" /> {this.props.backNavigationText}
          </Link>
        ) : (
          <></>
        )}

        {this.state.galleryItem ? (
          <div style={{ margin: 10 }}>
            <NotebookMetadataComponent
              data={this.state.galleryItem}
              isFavorite={this.state.isFavorite}
              downloadButtonText={this.props.container && `Download to ${useNotebook.getState().notebookFolderName}`}
              onTagClick={this.props.onTagClick}
            />
          </div>
        ) : (
          <></>
        )}

        {this.state.showProgressBar && <ProgressIndicator />}

        {this.notebookComponentBootstrapper.renderComponent(NotebookReadOnlyRenderer, {
          hideInputs: this.props.hideInputs,
          hidePrompts: this.props.hidePrompts,
        })}
      </div>
    );
  }

  public static getDerivedStateFromProps(
    props: NotebookViewerComponentProps,
    state: NotebookViewerComponentState,
  ): Partial<NotebookViewerComponentState> {
    let galleryItem = props.galleryItem;
    let isFavorite = props.isFavorite;

    if (state.galleryItem !== undefined) {
      galleryItem = state.galleryItem;
    }

    if (state.isFavorite !== undefined) {
      isFavorite = state.isFavorite;
    }

    return {
      galleryItem,
      isFavorite,
    };
  }
}
