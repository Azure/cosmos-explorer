/**
 * Wrapper around Notebook Viewer Read only content
 */
import { Notebook } from "@nteract/commutable";
import { createContentRef } from "@nteract/core";
import { Icon, Link, ProgressIndicator } from "office-ui-fabric-react";
import * as React from "react";
import { contents } from "rx-jupyter";
import * as Logger from "../../../Common/Logger";
import * as ViewModels from "../../../Contracts/ViewModels";
import { IGalleryItem, JunoClient } from "../../../Juno/JunoClient";
import * as GalleryUtils from "../../../Utils/GalleryUtils";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../../Menus/NotificationConsole/NotificationConsoleComponent";
import { NotebookClientV2 } from "../../Notebook/NotebookClientV2";
import { NotebookComponentBootstrapper } from "../../Notebook/NotebookComponent/NotebookComponentBootstrapper";
import NotebookReadOnlyRenderer from "../../Notebook/NotebookRenderer/NotebookReadOnlyRenderer";
import { DialogComponent, DialogProps } from "../DialogReactComponent/DialogComponent";
import { NotebookMetadataComponent } from "./NotebookMetadataComponent";
import "./NotebookViewerComponent.less";
import Explorer from "../../Explorer";
import { NotebookV4 } from "@nteract/commutable/lib/v4";
import { SessionStorageUtility } from "../../../Shared/StorageUtility";

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
  dialogProps: DialogProps;
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
      connectionInfo: { authToken: undefined, notebookServerEndpoint: undefined },
      databaseAccountName: undefined,
      defaultExperience: "NotebookViewer",
      isReadOnly: true,
      cellEditorType: "codemirror",
      autoSaveInterval: 365 * 24 * 3600 * 1000, // There is no way to turn off auto-save, set to 1 year
      contentProvider: contents.JupyterContentProvider // NotebookViewer only knows how to talk to Jupyter contents API
    });

    this.notebookComponentBootstrapper = new NotebookComponentBootstrapper({
      notebookClient: this.clientManager,
      contentRef: createContentRef()
    });

    this.state = {
      content: undefined,
      galleryItem: props.galleryItem,
      isFavorite: props.isFavorite,
      dialogProps: undefined,
      showProgressBar: true
    };

    this.loadNotebookContent();
  }

  private async loadNotebookContent(): Promise<void> {
    try {
      const response = await fetch(this.props.notebookUrl);
      if (!response.ok) {
        this.setState({ showProgressBar: false });
        throw new Error(`Received HTTP ${response.status} while fetching ${this.props.notebookUrl}`);
      }

      const notebook: Notebook = await response.json();
      this.removeNotebookViewerLink(notebook, this.props.galleryItem?.newCellId);
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
      this.setState({ showProgressBar: false });
      const message = `Failed to load notebook content: ${error}`;
      Logger.logError(message, "NotebookViewerComponent/loadNotebookContent");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }
  }

  private removeNotebookViewerLink = (notebook: Notebook, newCellId: string): void => {
    if (!newCellId) {
      return;
    }
    const notebookV4 = notebook as NotebookV4;
    if (notebookV4 && notebookV4.cells[0].source[0].search(newCellId)) {
      delete notebookV4.cells[0];
      notebook = notebookV4;
    }
  };

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
              downloadButtonText={this.props.container && "Download to my notebooks"}
              onTagClick={this.props.onTagClick}
              onFavoriteClick={this.favoriteItem}
              onUnfavoriteClick={this.unfavoriteItem}
              onDownloadClick={this.downloadItem}
            />
          </div>
        ) : (
          <></>
        )}

        {this.state.showProgressBar && <ProgressIndicator />}

        {this.notebookComponentBootstrapper.renderComponent(NotebookReadOnlyRenderer, {
          hideInputs: this.props.hideInputs,
          hidePrompts: this.props.hidePrompts
        })}

        {this.state.dialogProps && <DialogComponent {...this.state.dialogProps} />}
      </div>
    );
  }

  public static getDerivedStateFromProps(
    props: NotebookViewerComponentProps,
    state: NotebookViewerComponentState
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
      isFavorite
    };
  }

  private favoriteItem = async (): Promise<void> => {
    GalleryUtils.favoriteItem(this.props.container, this.props.junoClient, this.state.galleryItem, item =>
      this.setState({ galleryItem: item, isFavorite: true })
    );
  };

  private unfavoriteItem = async (): Promise<void> => {
    GalleryUtils.unfavoriteItem(this.props.container, this.props.junoClient, this.state.galleryItem, item =>
      this.setState({ galleryItem: item, isFavorite: false })
    );
  };

  private downloadItem = async (): Promise<void> => {
    GalleryUtils.downloadItem(this.props.container, this.props.junoClient, this.state.galleryItem, item =>
      this.setState({ galleryItem: item })
    );
  };
}
