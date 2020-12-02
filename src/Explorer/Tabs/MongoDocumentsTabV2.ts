import * as Q from "q";
import NotebookTabBase, { NotebookTabBaseOptions } from "./NotebookTabBase";
import { MongoQueryComponentAdapter } from "../Notebook/MongoQueryComponent/MongoQueryComponentAdapter";

export default class MongoDocumentsTabV2 extends NotebookTabBase {
  private mongoQueryComponentAdapter: MongoQueryComponentAdapter;

  constructor(options: NotebookTabBaseOptions) {
    super(options);
    this.mongoQueryComponentAdapter = new MongoQueryComponentAdapter(
      {
        contentRef: undefined,
        notebookClient: NotebookTabBase.clientManager,
      },
      options.collection?.databaseId,
      options.collection?.id()
    );
  }

  public onCloseTabButtonClick(): Q.Promise<void> {
    super.onCloseTabButtonClick();

    // const cleanup = () => {
    //   this.notebookComponentAdapter.notebookShutdown();
    //   this.isActive(false);
    //   super.onCloseTabButtonClick();
    // };

    // if (this.notebookComponentAdapter.isContentDirty()) {
    //   this.container.showOkCancelModalDialog(
    //     "Close without saving?",
    //     `File has unsaved changes, close without saving?`,
    //     "Close",
    //     cleanup,
    //     "Cancel",
    //     undefined
    //   );
    //   return Q.resolve(null);
    // } else {
    //   cleanup();
    //   return Q.resolve(null);
    // }
    return undefined;
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }
}
