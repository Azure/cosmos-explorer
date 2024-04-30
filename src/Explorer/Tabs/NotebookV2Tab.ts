import * as ko from "knockout";
import * as Q from "q";
import * as NotebookConfigurationUtils from "../../Utils/NotebookConfigurationUtils";
import { logConsoleInfo } from "../../Utils/NotificationConsoleUtils";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { useDialog } from "../Controls/Dialog";
import { NotebookComponentAdapter } from "../Notebook/NotebookComponent/NotebookComponentAdapter";
import { NotebookContentItem } from "../Notebook/NotebookContentItem";
import { useNotebook } from "../Notebook/useNotebook";
import NotebookTabBase, { NotebookTabBaseOptions } from "./NotebookTabBase";

export interface NotebookTabOptions extends NotebookTabBaseOptions {
  notebookContentItem: NotebookContentItem;
}

export default class NotebookTabV2 extends NotebookTabBase {
  public readonly html = '<div data-bind="react:notebookComponentAdapter" style="height: 100%"></div>';
  public notebookPath: ko.Observable<string>;
  private notebookComponentAdapter: NotebookComponentAdapter;

  constructor(options: NotebookTabOptions) {
    super(options);

    this.container = options.container;
    this.notebookPath = ko.observable(options.notebookContentItem.path);
    useNotebook.subscribe(
      () => logConsoleInfo("New notebook server info received."),
      (state) => state.notebookServerInfo,
    );
    this.notebookComponentAdapter = new NotebookComponentAdapter({
      contentItem: options.notebookContentItem,
      notebooksBasePath: useNotebook.getState().notebookBasePath,
      notebookClient: NotebookTabBase.clientManager,
      onUpdateKernelInfo: this.onKernelUpdate,
    });
  }
  /*
   * Hard cleaning the workspace(Closing tabs connected with old container connection) when new container got allocated.
   */
  public onCloseTabButtonClick(hardClose = false): Q.Promise<any> {
    const cleanup = () => {
      this.notebookComponentAdapter.notebookShutdown();
      super.onCloseTabButtonClick();
    };

    if (this.notebookComponentAdapter.isContentDirty() && hardClose === false) {
      useDialog
        .getState()
        .showOkCancelModalDialog(
          "Close without saving?",
          `File has unsaved changes, close without saving?`,
          "Close",
          cleanup,
          "Cancel",
          undefined,
        );
      return Q.resolve(null);
    } else {
      cleanup();
      return Q.resolve(null);
    }
  }

  public async reconfigureServiceEndpoints() {
    if (!this.notebookComponentAdapter) {
      return;
    }

    return await this.configureServiceEndpoints(this.notebookComponentAdapter.getCurrentKernelName());
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    return [];
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }

  private onKernelUpdate = async () => {
    await this.configureServiceEndpoints(this.notebookComponentAdapter.getCurrentKernelName()).catch((reason) => {
      /* Erroring is ok here */
    });
    this.updateNavbarWithTabsButtons();
  };

  private async configureServiceEndpoints(kernelName: string) {
    const notebookConnectionInfo = useNotebook.getState().notebookServerInfo;
    const sparkClusterConnectionInfo = useNotebook.getState().sparkClusterConnectionInfo;
    await NotebookConfigurationUtils.configureServiceEndpoints(
      this.notebookPath(),
      notebookConnectionInfo,
      kernelName,
      sparkClusterConnectionInfo,
    );
  }
}
