import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import * as Logger from "../../Common/Logger";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import QueryTab from "../Tabs/QueryTab";

export class LoadQueryPane extends ContextualPaneBase {
  public selectedFilesTitle: ko.Observable<string>;
  public files: ko.Observable<FileList>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Load Query");
    this.resetData();

    this.selectedFilesTitle = ko.observable<string>("");
    this.files = ko.observable<FileList>();
    this.files.subscribe((newFiles: FileList) => this.updateSelectedFilesTitle(newFiles));
    const focusElement = document.getElementById("queryFileImportLink");
    focusElement && focusElement.focus();
  }

  public submit() {
    this.formErrors("");
    this.formErrorsDetails("");
    if (!this.files() || this.files().length === 0) {
      this.formErrors("No file specified");
      this.formErrorsDetails("No file specified. Please input a file.");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        "Could not load query -- No file specified. Please input a file."
      );
      return;
    }

    const file: File = this.files().item(0);
    const id: string = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Loading query from file ${file.name}`
    );
    this.isExecuting(true);
    this.loadQueryFromFile(this.files().item(0))
      .then(
        () => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully loaded query from file ${file.name}`
          );
          this.close();
        },
        (error: any) => {
          this.formErrors("Failed to load query");
          this.formErrorsDetails(`Failed to load query: ${error}`);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Failed to load query from file ${file.name}: ${error}`
          );
        }
      )
      .finally(() => {
        this.isExecuting(false);
        NotificationConsoleUtils.clearInProgressMessageWithId(id);
      });
  }

  public updateSelectedFiles(element: any, event: any): void {
    this.files(event.target.files);
  }

  public open() {
    super.open();
    const focusElement = document.getElementById("queryFileImportLink");
    focusElement && focusElement.focus();
  }

  public close() {
    super.close();
    this.resetData();
    this.files(undefined);
    this.resetFileInput();
  }

  public onImportLinkClick(source: any, event: MouseEvent): boolean {
    document.getElementById("importQueryInput").click();
    return false;
  }

  public onImportLinkKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.onImportLinkClick(source, null);
      return false;
    }
    return true;
  };

  public async loadQueryFromFile(file: File): Promise<void> {
    const selectedCollection: ViewModels.Collection = this.container && this.container.findSelectedCollection();
    if (!selectedCollection) {
      // should never get into this state
      Logger.logError("No collection was selected", "LoadQueryPane.loadQueryFromFile");
      throw new Error("No collection was selected");
    } else if (this.container.isPreferredApiMongoDB()) {
      selectedCollection.onNewMongoQueryClick(selectedCollection, null);
    } else {
      selectedCollection.onNewQueryClick(selectedCollection, null);
    }
    const reader = new FileReader();
    reader.onload = (evt: any): void => {
      const fileData: string = evt.target.result;
      const queryTab = this.container.tabsManager.activeTab() as QueryTab;
      queryTab.initialEditorContent(fileData);
      queryTab.sqlQueryEditorContent(fileData);
    };

    reader.onerror = (evt: ProgressEvent): void => {
      throw new Error((evt as any).error.message);
    };

    reader.readAsText(file);
  }

  private updateSelectedFilesTitle(fileList: FileList) {
    this.selectedFilesTitle("");

    if (!fileList || fileList.length === 0) {
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const originalTitle = this.selectedFilesTitle();
      this.selectedFilesTitle(originalTitle + `"${fileList.item(i).name}"`);
    }
  }

  private resetFileInput(): void {
    const inputElement = $("#importQueryInput");
    inputElement
      .wrap("<form>")
      .closest("form")
      .get(0)
      .reset();
    inputElement.unwrap();
  }
}
