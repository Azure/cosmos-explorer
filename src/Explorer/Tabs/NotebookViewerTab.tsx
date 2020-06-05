import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import * as DataModels from "../../Contracts/DataModels";
import TabsBase from "./TabsBase";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { NotebookViewerComponent } from "../Controls/NotebookViewer/NotebookViewerComponent";

/**
 * Notebook Viewer tab
 */
class NotebookViewerComponentAdapter implements ReactAdapter {
  // parameters: true: show, false: hide
  public parameters: ko.Computed<boolean>;
  constructor(
    private notebookUrl: string,
    private notebookName: string,
    private container: ViewModels.Explorer,
    private notebookMetadata: DataModels.NotebookMetadata,
    private onNotebookMetadataChange: (newNotebookMetadata: DataModels.NotebookMetadata) => Promise<void>,
    private isLikedNotebook: boolean
  ) {}

  public renderComponent(): JSX.Element {
    return this.parameters() ? (
      <NotebookViewerComponent
        notebookUrl={this.notebookUrl}
        notebookMetadata={this.notebookMetadata}
        notebookName={this.notebookName}
        container={this.container}
        onNotebookMetadataChange={this.onNotebookMetadataChange}
        isLikedNotebook={this.isLikedNotebook}
      />
    ) : (
      <></>
    );
  }
}

export default class NotebookViewerTab extends TabsBase implements ViewModels.Tab {
  private container: ViewModels.Explorer;
  public notebookViewerComponentAdapter: NotebookViewerComponentAdapter;
  public notebookUrl: string;

  constructor(options: ViewModels.NotebookViewerTabOptions) {
    super(options);
    this.container = options.container;
    this.notebookUrl = options.notebookUrl;
    this.notebookViewerComponentAdapter = new NotebookViewerComponentAdapter(
      options.notebookUrl,
      options.notebookName,
      options.container,
      options.notebookMetadata,
      options.onNotebookMetadataChange,
      options.isLikedNotebook
    );

    this.notebookViewerComponentAdapter.parameters = ko.computed<boolean>(() => {
      if (this.isTemplateReady() && this.container.isNotebookEnabled()) {
        return true;
      }
      return false;
    });
  }

  protected getContainer(): ViewModels.Explorer {
    return this.container;
  }

  protected getTabsButtons(): ViewModels.NavbarButtonConfig[] {
    return [];
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }
}
