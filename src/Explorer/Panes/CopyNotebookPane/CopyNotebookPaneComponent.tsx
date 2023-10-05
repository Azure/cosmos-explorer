import {
  Dropdown,
  IDropdownOption,
  IDropdownProps,
  IRenderFunction,
  ISelectableOption,
  Label,
  SelectableOptionMenuItemType,
  Stack,
  Text,
} from "@fluentui/react";
import { GitHubReposTitle } from "Explorer/Tree/ResourceTree";
import React, { FormEvent, FunctionComponent } from "react";
import { IPinnedRepo } from "../../../Juno/JunoClient";
import * as GitHubUtils from "../../../Utils/GitHubUtils";
import { useNotebook } from "../../Notebook/useNotebook";

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
  onDropDownChange: (_: FormEvent<HTMLDivElement>, option?: IDropdownOption) => void;
}

export const CopyNotebookPaneComponent: FunctionComponent<CopyNotebookPaneProps> = ({
  name,
  pinnedRepos,
  onDropDownChange,
}: CopyNotebookPaneProps) => {
  const BranchNameWhiteSpace = "   ";

  const onRenderDropDownTitle: IRenderFunction<IDropdownOption[]> = (options: IDropdownOption[]): JSX.Element => {
    return <span>{options.length && options[0].title}</span>;
  };

  const onRenderDropDownOption: IRenderFunction<ISelectableOption> = (option: ISelectableOption): JSX.Element => {
    return <span style={{ whiteSpace: "pre-wrap" }}>{option.text}</span>;
  };

  const getDropDownOptions = (): IDropdownOption[] => {
    const options: IDropdownOption[] = [];
    options.push({
      key: "MyNotebooks-Item",
      text: useNotebook.getState().notebookFolderName,
      title: useNotebook.getState().notebookFolderName,
      data: {
        type: "MyNotebooks",
      } as Location,
    });

    if (pinnedRepos && pinnedRepos.length > 0) {
      options.push({
        key: "GitHub-Header-Divider",
        text: undefined,
        itemType: SelectableOptionMenuItemType.Divider,
      });

      options.push({
        key: "GitHub-Header",
        text: GitHubReposTitle,
        itemType: SelectableOptionMenuItemType.Header,
      });

      pinnedRepos.forEach((pinnedRepo) => {
        const repoFullName = GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name);
        options.push({
          key: `GitHub-Repo-${repoFullName}`,
          text: repoFullName,
          disabled: true,
        });

        pinnedRepo.branches.forEach((branch) =>
          options.push({
            key: `GitHub-Repo-${repoFullName}-${branch.name}`,
            text: `${BranchNameWhiteSpace}${branch.name}`,
            title: `${repoFullName} - ${branch.name}`,
            data: {
              type: "GitHub",
              owner: pinnedRepo.owner,
              repo: pinnedRepo.name,
              branch: branch.name,
            } as Location,
          }),
        );
      });
    }

    return options;
  };
  const dropDownProps: IDropdownProps = {
    label: "Location",
    ariaLabel: "Location",
    placeholder: "Select an option",
    onRenderTitle: onRenderDropDownTitle,
    onRenderOption: onRenderDropDownOption,
    options: getDropDownOptions(),
    onChange: onDropDownChange,
  };

  return (
    <div className="paneMainContent">
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack.Item>
          <Label htmlFor="notebookName">Name</Label>
          <Text id="notebookName">{name}</Text>
        </Stack.Item>

        <Dropdown {...dropDownProps} />
      </Stack>
    </div>
  );
};
