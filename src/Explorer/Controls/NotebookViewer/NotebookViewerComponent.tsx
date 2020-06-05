/**
 * Wrapper around Notebook Viewer Read only content
 */

import * as React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { NotebookClientV2 } from "../../Notebook/NotebookClientV2";
import { NotebookComponentBootstrapper } from "../../Notebook/NotebookComponent/NotebookComponentBootstrapper";
import { createContentRef } from "@nteract/core";
import NotebookReadOnlyRenderer from "../../Notebook/NotebookRenderer/NotebookReadOnlyRenderer";
import { contents } from "rx-jupyter";
import { NotebookMetadata } from "../../../Contracts/DataModels";
import { NotebookMetadataComponent } from "./NotebookMetadataComponent";
import "./NotebookViewerComponent.less";

export interface NotebookViewerComponentProps {
  notebookName: string;
  notebookUrl: string;
  container?: ViewModels.Explorer;
  notebookMetadata: NotebookMetadata;
  onNotebookMetadataChange?: (newNotebookMetadata: NotebookMetadata) => Promise<void>;
  isLikedNotebook?: boolean;
  hideInputs?: boolean;
}

interface NotebookViewerComponentState {
  content: any;
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

    this.state = { content: undefined };
  }

  private async getJsonNotebookContent(): Promise<any> {
    const response: Response = await fetch(this.props.notebookUrl);
    if (response.ok) {
      return await response.json();
    } else {
      return undefined;
    }
  }

  componentDidMount() {
    this.getJsonNotebookContent().then((jsonContent: any) => {
      this.notebookComponentBootstrapper.setContent("json", jsonContent);
      this.setState({ content: jsonContent });
    });
  }

  public render(): JSX.Element {
    return (
      <div className="notebookViewerContainer">
        <NotebookMetadataComponent
          notebookMetadata={this.props.notebookMetadata}
          notebookName={this.props.notebookName}
          container={this.props.container}
          notebookContent={this.state.content}
          onNotebookMetadataChange={this.props.onNotebookMetadataChange}
          isLikedNotebook={this.props.isLikedNotebook}
        />
        {this.notebookComponentBootstrapper.renderComponent(NotebookReadOnlyRenderer, {
          hideInputs: this.props.hideInputs
        })}
      </div>
    );
  }
}
