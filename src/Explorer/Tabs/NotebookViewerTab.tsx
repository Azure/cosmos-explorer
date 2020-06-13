import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../Contracts/ViewModels";
import {
  NotebookViewerComponent,
  NotebookViewerComponentProps
} from "../Controls/NotebookViewer/NotebookViewerComponent";
import TabsBase from "./TabsBase";

/**
 * Notebook Viewer tab
 */
class NotebookViewerComponentAdapter implements ReactAdapter {
  // parameters: true: show, false: hide
  public parameters: ko.Computed<boolean>;
  constructor(private notebookUrl: string) {}

  public renderComponent(): JSX.Element {
    const props: NotebookViewerComponentProps = {
      notebookUrl: this.notebookUrl,
      backNavigationText: undefined,
      onBackClick: undefined,
      onTagClick: undefined
    };

    return this.parameters() ? <NotebookViewerComponent {...props} /> : <></>;
  }
}

export default class NotebookViewerTab extends TabsBase implements ViewModels.Tab {
  private container: ViewModels.Explorer;
  public notebookUrl: string;

  public notebookViewerComponentAdapter: NotebookViewerComponentAdapter;

  constructor(options: ViewModels.NotebookViewerTabOptions) {
    super(options);
    this.container = options.container;
    this.notebookUrl = options.notebookUrl;

    this.notebookViewerComponentAdapter = new NotebookViewerComponentAdapter(options.notebookUrl);

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
