import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as Logger from "../../Common/Logger";
import { JunoClient, IPinnedRepo } from "../../Juno/JunoClient";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { GenericRightPaneComponent, GenericRightPaneProps } from "./GenericRightPaneComponent";
import {
  Stack,
  Label,
  Text,
  Dropdown,
  IDropdownProps,
  IDropdownOption,
  SelectableOptionMenuItemType,
  IRenderFunction,
  ISelectableOption
} from "office-ui-fabric-react";
import { GitHubOAuthService } from "../../GitHub/GitHubOAuthService";
import { HttpStatusCodes, Notebook } from "../../Common/Constants";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import { NotebookContentItemType, NotebookContentItem } from "../Notebook/NotebookContentItem";

interface Location {
  type: "My Notebooks" | "GitHub";

  // GitHub
  owner?: string;
  repo?: string;
  branch?: string;
}

export class CopyNotebookPaneAdapter implements ReactAdapter {
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

    const props: GenericRightPaneProps = {
      container: this.container,
      content: this.createContent(),
      formError: this.formError,
      formErrorDetail: this.formErrorDetail,
      id: "copynotebookpane",
      isExecuting: this.isExecuting,
      title: "Copy notebook",
      submitButtonText: "OK",
      onClose: () => this.close(),
      onSubmit: () => this.submit()
    };

    return <GenericRightPaneComponent {...props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  public async open(name: string, content: string) {
    this.name = name;
    this.content = content;

    this.isOpened = true;
    this.triggerRender();

    if (this.gitHubOAuthService.isLoggedIn()) {
      const response = await this.junoClient.getPinnedRepos(this.gitHubOAuthService.getTokenObservable()()?.scope);
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        const message = `Received HTTP ${response.status} when fetching pinned repos`;
        Logger.logError(message, "CopyNotebookPaneAdapter/submit");
        NotificationConsoleUtils.logConsoleError(message);
      }

      if (response.data && response.data.length > 0) {
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
      this.formError = `Failed to copy ${this.name} to ${destination}`;
      this.formErrorDetail = `${error}`;

      const message = `${this.formError}: ${this.formErrorDetail}`;
      Logger.logError(message, "CopyNotebookPaneAdapter/submit");
      NotificationConsoleUtils.logConsoleError(message);
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
      case "My Notebooks":
        parent = {
          name: "My Notebooks",
          path: this.container.getNotebookBasePath(),
          type: NotebookContentItemType.Directory
        };
        break;

      case "GitHub":
        parent = {
          name: "GitHub repos",
          path: GitHubUtils.toContentUri(
            this.selectedLocation.owner,
            this.selectedLocation.repo,
            this.selectedLocation.branch,
            ""
          ),
          type: NotebookContentItemType.Directory
        };
        break;

      default:
        throw new Error(`Unsupported location type ${location.type}`);
    }

    return this.container.uploadFile(this.name, this.content, parent);
  };

  private createContent = (): JSX.Element => {
    const dropDownProps: IDropdownProps = {
      label: "Location",
      ariaLabel: "Location",
      placeholder: "Select an option",
      onRenderTitle: this.onRenderDropDownTitle,
      onRenderOption: this.onRenderDropDownOption,
      options: this.getDropDownOptions(),
      onChange: this.onDropDownChange
    };

    return (
      <div className="paneMainContent">
        <Stack tokens={{ childrenGap: 10 }}>
          <div>
            <Label htmlFor="notebookName">Name</Label>
            <Text id="notebookName">{this.name}</Text>
          </div>

          <Dropdown {...dropDownProps} />
        </Stack>
      </div>
    );
  };

  private onRenderDropDownTitle: IRenderFunction<IDropdownOption[]> = (options: IDropdownOption[]): JSX.Element => {
    return <span>{options[0].title}</span>;
  };

  private onRenderDropDownOption: IRenderFunction<ISelectableOption> = (option: ISelectableOption): JSX.Element => {
    return <span style={{ whiteSpace: "pre-wrap" }}>{option.text}</span>;
  };

  private getDropDownOptions = (): IDropdownOption[] => {
    const options: IDropdownOption[] = [];

    options.push({
      key: "My Notebooks",
      text: "My Notebooks",
      title: "My Notebooks",
      data: {
        type: "My Notebooks"
      } as Location
    });

    if (this.pinnedRepos && this.pinnedRepos.length > 0) {
      options.push({
        key: "GitHub-Header-Divider",
        text: undefined,
        itemType: SelectableOptionMenuItemType.Divider
      });

      options.push({
        key: "GitHub-Header",
        text: "GitHub repos",
        itemType: SelectableOptionMenuItemType.Header
      });

      this.pinnedRepos.forEach(pinnedRepo => {
        const repoFullName = GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name);
        options.push({
          key: `GitHub-Repo-${repoFullName}`,
          text: repoFullName,
          disabled: true
        });

        pinnedRepo.branches.forEach(branch =>
          options.push({
            key: `GitHub-Repo-${repoFullName}-${branch.name}`,
            text: `   ${branch.name}`,
            title: `${repoFullName} - ${branch.name}`,
            data: {
              type: "GitHub",
              owner: pinnedRepo.owner,
              repo: pinnedRepo.name,
              branch: branch.name
            } as Location
          })
        );
      });
    }

    return options;
  };

  private onDropDownChange = (
    event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption,
    index?: number
  ): void => {
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
