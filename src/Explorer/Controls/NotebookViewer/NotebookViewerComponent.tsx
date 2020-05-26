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
  container: ViewModels.Explorer;
  notebookMetadata: NotebookMetadata;
}

interface NotebookViewerComponentState {
  element: JSX.Element;
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

    this.state = { element: undefined, content: undefined };
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
      const notebookReadonlyComponent = this.notebookComponentBootstrapper.renderComponent(NotebookReadOnlyRenderer);
      this.setState({ element: notebookReadonlyComponent, content: jsonContent });
    });
  }

  public render(): JSX.Element {
    return this.state != null ? (
      <div className="notebookViewerContainer">
        <NotebookMetadataComponent
          notebookMetadata={this.props.notebookMetadata}
          notebookName={this.props.notebookName}
          container={this.props.container}
          notebookContent={this.state.content}
        />
        {this.state.element}
      </div>
    ) : (
      <></>
    );
  }
}
