import * as GitHubUtils from "../../Utils/GitHubUtils";
import * as React from "react";
import { IPinnedRepo } from "../../Juno/JunoClient";
import { ResourceTreeAdapter } from "../Tree/ResourceTreeAdapter";
import {
  Stack,
  Label,
  Text,
  Dropdown,
  IDropdownProps,
  IDropdownOption,
  SelectableOptionMenuItemType,
  IRenderFunction,
  ISelectableOption,
} from "@fluentui/react";

interface Location {
  type: "MyNotebooks" | "GitHub";

  // GitHub
  owner?: string;
  repo?: string;
  branch?: string;
}

export interface CopyNotebookPaneProps {
  name: string;
  pinnedRepos: IPinnedRepo[];
  onDropDownChange: (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => void;
}

export class CopyNotebookPaneComponent extends React.Component<CopyNotebookPaneProps> {
  private static readonly BranchNameWhiteSpace = "   ";

  public render(): JSX.Element {
    const dropDownProps: IDropdownProps = {
      label: "Location",
      ariaLabel: "Location",
      placeholder: "Select an option",
      onRenderTitle: this.onRenderDropDownTitle,
      onRenderOption: this.onRenderDropDownOption,
      options: this.getDropDownOptions(),
      onChange: this.props.onDropDownChange,
    };

    return (
      <div className="paneMainContent">
        <Stack tokens={{ childrenGap: 10 }}>
          <Stack.Item>
            <Label htmlFor="notebookName">Name</Label>
            <Text id="notebookName">{this.props.name}</Text>
          </Stack.Item>

          <Dropdown {...dropDownProps} />
        </Stack>
      </div>
    );
  }

  private onRenderDropDownTitle: IRenderFunction<IDropdownOption[]> = (options: IDropdownOption[]): JSX.Element => {
    return <span>{options.length && options[0].title}</span>;
  };

  private onRenderDropDownOption: IRenderFunction<ISelectableOption> = (option: ISelectableOption): JSX.Element => {
    return <span style={{ whiteSpace: "pre-wrap" }}>{option.text}</span>;
  };

  private getDropDownOptions = (): IDropdownOption[] => {
    const options: IDropdownOption[] = [];

    options.push({
      key: "MyNotebooks-Item",
      text: ResourceTreeAdapter.MyNotebooksTitle,
      title: ResourceTreeAdapter.MyNotebooksTitle,
      data: {
        type: "MyNotebooks",
      } as Location,
    });

    if (this.props.pinnedRepos && this.props.pinnedRepos.length > 0) {
      options.push({
        key: "GitHub-Header-Divider",
        text: undefined,
        itemType: SelectableOptionMenuItemType.Divider,
      });

      options.push({
        key: "GitHub-Header",
        text: ResourceTreeAdapter.GitHubReposTitle,
        itemType: SelectableOptionMenuItemType.Header,
      });

      this.props.pinnedRepos.forEach((pinnedRepo) => {
        const repoFullName = GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name);
        options.push({
          key: `GitHub-Repo-${repoFullName}`,
          text: repoFullName,
          disabled: true,
        });

        pinnedRepo.branches.forEach((branch) =>
          options.push({
            key: `GitHub-Repo-${repoFullName}-${branch.name}`,
            text: `${CopyNotebookPaneComponent.BranchNameWhiteSpace}${branch.name}`,
            title: `${repoFullName} - ${branch.name}`,
            data: {
              type: "GitHub",
              owner: pinnedRepo.owner,
              repo: pinnedRepo.name,
              branch: branch.name,
            } as Location,
          })
        );
      });
    }

    return options;
  };
}
