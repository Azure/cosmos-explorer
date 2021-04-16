import ko from "knockout";
import { IDropdownOption } from "office-ui-fabric-react";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { HttpStatusCodes } from "../../Common/Constants";
import { getErrorMessage, handleError } from "../../Common/ErrorHandlingUtils";
import { GitHubOAuthService } from "../../GitHub/GitHubOAuthService";
import { IPinnedRepo, JunoClient } from "../../Juno/JunoClient";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { NotebookContentItem, NotebookContentItemType } from "../Notebook/NotebookContentItem";
import { ResourceTreeAdapter } from "../Tree/ResourceTreeAdapter";
import { CopyNotebookPaneComponent, CopyNotebookPaneProps } from "./CopyNotebookPaneComponent";
import { RightPaneForm, RightPaneFormProps } from "./RightPaneForm/RightPaneForm";

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

    const genericPaneProps: RightPaneFormProps = {
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
      <RightPaneForm {...genericPaneProps}>
        <CopyNotebookPaneComponent {...copyNotebookPaneProps} />
      </RightPaneForm>
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
          name: ResourceTreeAdapter.MyNotebooksTitle,
          path: this.container.getNotebookBasePath(),
          type: NotebookContentItemType.Directory,
        };
        break;

      case "GitHub":
        parent = {
          name: ResourceTreeAdapter.GitHubReposTitle,
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
