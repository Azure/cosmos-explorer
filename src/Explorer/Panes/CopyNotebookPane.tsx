import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { JunoClient, IPinnedRepo } from "../../Juno/JunoClient";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { GenericRightPaneComponent, GenericRightPaneProps } from "./GenericRightPaneComponent";
import { CopyNotebookPaneComponent, CopyNotebookPaneProps } from "./CopyNotebookPaneComponent";
import { IDropdownOption } from "office-ui-fabric-react";
import { GitHubOAuthService } from "../../GitHub/GitHubOAuthService";
import { HttpStatusCodes, Notebook } from "../../Common/Constants";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import { NotebookContentItemType, NotebookContentItem } from "../Notebook/NotebookContentItem";
import { handleError, getErrorMessage } from "../../Common/ErrorHandlingUtils";

interface Location {
  type: "MyNotebooks" | "GitHub";

  // GitHub
  owner?: string;
  repo?: string;
  branch?: string;
}

export class CopyNotebookPaneAdapter implements ReactAdapter {
  private static readonly BranchNameWhiteSpace = "   ";

  parameters: ko.Observable<number>;
  private isOpened: boolean;
  private isExecuting: boolean;
  private formError: string;
  private formErrorDetail: string;
  private name: string;
  private content: string;
  private pinnedRepos: IPinnedRepo[];
  private selectedLocation: Location;

  constructor(
    private container: Explorer,
    private junoClient: JunoClient,
    private gitHubOAuthService: GitHubOAuthService
  ) {
    this.parameters = ko.observable(Date.now());
    this.reset();
    this.triggerRender();
  }

  public renderComponent(): JSX.Element {
    if (!this.isOpened) {
      return undefined;
    }

    const genericPaneProps: GenericRightPaneProps = {
      container: this.container,
      formError: this.formError,
      formErrorDetail: this.formErrorDetail,
      id: "copynotebookpane",
      isExecuting: this.isExecuting,
      title: "Copy notebook",
      submitButtonText: "OK",
      onClose: () => this.close(),
      onSubmit: () => this.submit(),
    };

    const copyNotebookPaneProps: CopyNotebookPaneProps = {
      name: this.name,
      pinnedRepos: this.pinnedRepos,
      onDropDownChange: this.onDropDownChange,
    };

    return (
      <GenericRightPaneComponent {...genericPaneProps}>
        <CopyNotebookPaneComponent {...copyNotebookPaneProps} />
      </GenericRightPaneComponent>
    );
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  public async open(name: string, content: string): Promise<void> {
    this.name = name;
    this.content = content;

    this.isOpened = true;
    this.triggerRender();

    if (this.gitHubOAuthService.isLoggedIn()) {
      const response = await this.junoClient.getPinnedRepos(this.gitHubOAuthService.getTokenObservable()()?.scope);
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        handleError(`Received HTTP ${response.status} when fetching pinned repos`, "CopyNotebookPaneAdapter/submit");
      }

      if (response.data?.length > 0) {
        this.pinnedRepos = response.data;
        this.triggerRender();
      }
    }
  }

  public close(): void {
    this.reset();
    this.triggerRender();
  }

  public async submit(): Promise<void> {
    let destination: string = this.selectedLocation?.type;
    let clearMessage: () => void;
    this.isExecuting = true;
    this.triggerRender();

    try {
      if (!this.selectedLocation) {
        throw new Error(`No location selected`);
      }

      if (this.selectedLocation.type === "GitHub") {
        destination = `${destination} - ${GitHubUtils.toRepoFullName(
          this.selectedLocation.owner,
          this.selectedLocation.repo
        )} - ${this.selectedLocation.branch}`;
      }

      clearMessage = NotificationConsoleUtils.logConsoleProgress(`Copying ${this.name} to ${destination}`);

      const notebookContentItem = await this.copyNotebook(this.selectedLocation);
      if (!notebookContentItem) {
        throw new Error(`Failed to upload ${this.name}`);
      }

      NotificationConsoleUtils.logConsoleInfo(`Successfully copied ${this.name} to ${destination}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.formError = `Failed to copy ${this.name} to ${destination}`;
      this.formErrorDetail = `${errorMessage}`;
      handleError(errorMessage, "CopyNotebookPaneAdapter/submit", this.formError);
      return;
    } finally {
      clearMessage && clearMessage();
      this.isExecuting = false;
      this.triggerRender();
    }

    this.close();
  }

  private copyNotebook = async (location: Location): Promise<NotebookContentItem> => {
    let parent: NotebookContentItem;
    switch (location.type) {
      case "MyNotebooks":
        parent = {
          name: Notebook.MyNotebooksTitle,
          path: this.container.getNotebookBasePath(),
          type: NotebookContentItemType.Directory,
        };
        break;

      case "GitHub":
        parent = {
          name: Notebook.GitHubReposTitle,
          path: GitHubUtils.toContentUri(
            this.selectedLocation.owner,
            this.selectedLocation.repo,
            this.selectedLocation.branch,
            ""
          ),
          type: NotebookContentItemType.Directory,
        };
        break;

      default:
        throw new Error(`Unsupported location type ${location.type}`);
    }

    return this.container.uploadFile(this.name, this.content, parent);
  };

  private onDropDownChange = (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    this.selectedLocation = option?.data;
  };

  private reset = (): void => {
    this.isOpened = false;
    this.isExecuting = false;
    this.formError = undefined;
    this.formErrorDetail = undefined;
    this.name = undefined;
    this.content = undefined;
    this.pinnedRepos = undefined;
    this.selectedLocation = undefined;
  };
}
