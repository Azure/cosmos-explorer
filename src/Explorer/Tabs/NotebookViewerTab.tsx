import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../Contracts/ViewModels";
import {
  NotebookViewerComponent,
  NotebookViewerComponentProps,
} from "../Controls/NotebookViewer/NotebookViewerComponent";
import TabsBase from "./TabsBase";
import Explorer from "../Explorer";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";

interface NotebookViewerTabOptions extends ViewModels.TabOptions {
  account: DatabaseAccount;
  container: Explorer;
  notebookUrl: string;
}

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
      onTagClick: undefined,
    };

    return this.parameters() ? <NotebookViewerComponent {...props} /> : <></>;
  }
}

export default class NotebookViewerTab extends TabsBase {
  private container: Explorer;
  public notebookUrl: string;

  public notebookViewerComponentAdapter: NotebookViewerComponentAdapter;

  constructor(options: NotebookViewerTabOptions) {
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

  protected getContainer(): Explorer {
    return this.container;
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    return [];
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }
}
