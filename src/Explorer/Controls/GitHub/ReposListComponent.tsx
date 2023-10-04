import {
  Checkbox,
  DetailsList,
  DetailsRow,
  Dropdown,
  ICheckboxProps,
  IDetailsFooterProps,
  IDetailsListProps,
  IDetailsRowBaseProps,
  IDropdown,
  IDropdownOption,
  IDropdownProps,
  ILinkProps,
  ISelectableDroppableTextProps,
  Link,
  ResponsiveMode,
  SelectionMode,
  Text,
} from "@fluentui/react";
import * as React from "react";
import { IGitHubBranch, IGitHubPageInfo } from "../../../GitHub/GitHubClient";
import * as GitHubUtils from "../../../Utils/GitHubUtils";
import { RepoListItem } from "./GitHubReposComponent";
import {
  BranchesDropdownCheckboxStyles,
  BranchesDropdownOptionContainerStyle,
  BranchesDropdownStyles,
  BranchesDropdownWidth,
  ReposListBranchesColumnWidth,
  ReposListCheckboxStyles,
  ReposListRepoColumnMinWidth,
} from "./GitHubStyleConstants";

export interface ReposListComponentProps {
  branchesProps: Record<string, BranchesProps>; // key'd by repo key
  pinnedReposProps: PinnedReposProps;
  unpinnedReposProps: UnpinnedReposProps;
  pinRepo: (repo: RepoListItem) => void;
  unpinRepo: (repo: RepoListItem) => void;
}

export interface BranchesProps {
  branches: IGitHubBranch[];
  lastPageInfo?: IGitHubPageInfo;
  hasMore: boolean;
  isLoading: boolean;
  defaultBranchName: string;
  loadMore: () => void;
}

export interface PinnedReposProps {
  repos: RepoListItem[];
}

export interface UnpinnedReposProps {
  repos: RepoListItem[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
}

export class ReposListComponent extends React.Component<ReposListComponentProps> {
  private static readonly PinnedReposColumnName = "Pinned repos";
  private static readonly UnpinnedReposColumnName = "Unpinned repos";
  private static readonly BranchesColumnName = "Branches";
  private static readonly LoadingText = "Loading...";
  private static readonly LoadMoreText = "Load more";
  private static readonly DefaultBranchNames = "master/main";
  private static readonly FooterIndex = -1;

  public render(): JSX.Element {
    const pinnedReposListProps: IDetailsListProps = {
      styles: {
        contentWrapper: {
          height: this.props.pinnedReposProps.repos.length ? undefined : 0,
        },
      },
      items: this.props.pinnedReposProps.repos,
      getKey: ReposListComponent.getKey,
      selectionMode: SelectionMode.none,
      compact: true,
      columns: [
        {
          key: ReposListComponent.PinnedReposColumnName,
          name: ReposListComponent.PinnedReposColumnName,
          ariaLabel: ReposListComponent.PinnedReposColumnName,
          minWidth: ReposListRepoColumnMinWidth,
          onRender: this.onRenderPinnedReposColumnItem,
        },
        {
          key: ReposListComponent.BranchesColumnName,
          name: ReposListComponent.BranchesColumnName,
          ariaLabel: ReposListComponent.BranchesColumnName,
          minWidth: ReposListBranchesColumnWidth,
          maxWidth: ReposListBranchesColumnWidth,
          onRender: this.onRenderPinnedReposBranchesColumnItem,
        },
      ],
      onRenderDetailsFooter: this.props.pinnedReposProps.repos.length ? undefined : this.onRenderReposFooter,
    };

    const unpinnedReposListProps: IDetailsListProps = {
      items: this.props.unpinnedReposProps.repos,
      getKey: ReposListComponent.getKey,
      selectionMode: SelectionMode.none,
      compact: true,
      columns: [
        {
          key: ReposListComponent.UnpinnedReposColumnName,
          name: ReposListComponent.UnpinnedReposColumnName,
          ariaLabel: ReposListComponent.UnpinnedReposColumnName,
          minWidth: ReposListRepoColumnMinWidth,
          onRender: this.onRenderUnpinnedReposColumnItem,
        },
        {
          key: ReposListComponent.BranchesColumnName,
          name: ReposListComponent.BranchesColumnName,
          ariaLabel: ReposListComponent.BranchesColumnName,
          minWidth: ReposListBranchesColumnWidth,
          maxWidth: ReposListBranchesColumnWidth,
          onRender: this.onRenderUnpinnedReposBranchesColumnItem,
        },
      ],
      onRenderDetailsFooter:
        this.props.unpinnedReposProps.isLoading || this.props.unpinnedReposProps.hasMore
          ? this.onRenderReposFooter
          : undefined,
    };

    return (
      <>
        <DetailsList {...pinnedReposListProps} />
        <DetailsList {...unpinnedReposListProps} />
      </>
    );
  }

  private onRenderPinnedReposColumnItem = (item: RepoListItem, index: number): JSX.Element => {
    if (index === ReposListComponent.FooterIndex) {
      return <Text>None</Text>;
    }

    const checkboxProps: ICheckboxProps = {
      ...ReposListComponent.getCheckboxPropsForLabel(GitHubUtils.toRepoFullName(item.repo.owner, item.repo.name)),
      styles: ReposListCheckboxStyles,
      defaultChecked: true,
      onChange: () => this.props.unpinRepo(item),
    };

    return <Checkbox {...checkboxProps} />;
  };

  private onRenderPinnedReposBranchesColumnItem = (item: RepoListItem, index: number): JSX.Element => {
    if (index === ReposListComponent.FooterIndex) {
      return <></>;
    }

    const branchesProps = this.props.branchesProps[GitHubUtils.toRepoFullName(item.repo.owner, item.repo.name)];
    if (item.branches.length === 0 && branchesProps.defaultBranchName) {
      item.branches = [{ name: branchesProps.defaultBranchName }];
    }

    const options: IDropdownOption[] = branchesProps.branches.map((branch) => ({
      key: branch.name,
      text: branch.name,
      data: item,
      disabled: item.branches.length === 1 && branch.name === item.branches[0].name,
      selected: item.branches.findIndex((element) => element.name === branch.name) !== -1,
    }));

    if (branchesProps.hasMore || branchesProps.isLoading) {
      const text = branchesProps.isLoading ? ReposListComponent.LoadingText : ReposListComponent.LoadMoreText;
      options.push({
        key: text,
        text,
        data: item,
        index: ReposListComponent.FooterIndex,
      });
    }

    const dropdownProps: IDropdownProps = {
      styles: BranchesDropdownStyles,
      dropdownWidth: BranchesDropdownWidth,
      responsiveMode: ResponsiveMode.large,
      options,
      onRenderList: this.onRenderBranchesDropdownList,
    };

    if (item.branches.length === 1) {
      dropdownProps.placeholder = item.branches[0].name;
    } else if (item.branches.length > 1) {
      dropdownProps.placeholder = `${item.branches.length} branches`;
    }

    return <Dropdown {...dropdownProps} />;
  };

  private onRenderUnpinnedReposBranchesColumnItem = (item: RepoListItem, index: number): JSX.Element => {
    if (index === ReposListComponent.FooterIndex) {
      return <></>;
    }

    const dropdownProps: IDropdownProps = {
      styles: BranchesDropdownStyles,
      options: [],
      placeholder: ReposListComponent.DefaultBranchNames,
      disabled: true,
    };

    return <Dropdown {...dropdownProps} />;
  };

  private onRenderBranchesDropdownList = (
    props: ISelectableDroppableTextProps<IDropdown, HTMLDivElement>,
  ): JSX.Element => {
    const renderedList: JSX.Element[] = [];
    props.options.forEach((option: IDropdownOption) => {
      const item = (
        <div key={option.key} style={BranchesDropdownOptionContainerStyle}>
          {this.onRenderPinnedReposBranchesDropdownOption(option)}
        </div>
      );
      renderedList.push(item);
    });

    return <>{renderedList}</>;
  };

  private onRenderPinnedReposBranchesDropdownOption(option: IDropdownOption): JSX.Element {
    const item: RepoListItem = option.data;
    const branchesProps = this.props.branchesProps[GitHubUtils.toRepoFullName(item.repo.owner, item.repo.name)];

    if (option.index === ReposListComponent.FooterIndex) {
      const linkProps: ILinkProps = {
        disabled: branchesProps.isLoading,
        onClick: branchesProps.loadMore,
      };

      return <Link {...linkProps}>{option.text}</Link>;
    }

    const checkboxProps: ICheckboxProps = {
      ...ReposListComponent.getCheckboxPropsForLabel(option.text),
      styles: BranchesDropdownCheckboxStyles,
      defaultChecked: option.selected,
      disabled: option.disabled,
      onChange: (event, checked) => {
        const repoListItem = { ...item };
        const branch: IGitHubBranch = { name: option.text };
        repoListItem.branches = repoListItem.branches.filter((element) => element.name !== branch.name);
        if (checked) {
          repoListItem.branches.push(branch);
        }

        this.props.pinRepo(repoListItem);
      },
    };

    return <Checkbox {...checkboxProps} />;
  }

  private onRenderUnpinnedReposColumnItem = (item: RepoListItem, index: number): JSX.Element => {
    if (index === ReposListComponent.FooterIndex) {
      const linkProps: ILinkProps = {
        disabled: this.props.unpinnedReposProps.isLoading,
        onClick: this.props.unpinnedReposProps.loadMore,
      };

      const linkText = this.props.unpinnedReposProps.isLoading
        ? ReposListComponent.LoadingText
        : ReposListComponent.LoadMoreText;
      return <Link {...linkProps}>{linkText}</Link>;
    }

    const checkboxProps: ICheckboxProps = {
      ...ReposListComponent.getCheckboxPropsForLabel(GitHubUtils.toRepoFullName(item.repo.owner, item.repo.name)),
      styles: ReposListCheckboxStyles,
      onChange: () => {
        const repoListItem = { ...item };
        repoListItem.branches = [];
        this.props.pinRepo(repoListItem);
      },
    };

    return <Checkbox {...checkboxProps} />;
  };

  private onRenderReposFooter = (detailsFooterProps: IDetailsFooterProps): JSX.Element => {
    const props: IDetailsRowBaseProps = {
      ...detailsFooterProps,
      item: {},
      itemIndex: ReposListComponent.FooterIndex,
    };

    return <DetailsRow {...props} />;
  };

  private static getCheckboxPropsForLabel(label: string): ICheckboxProps {
    return {
      label,
      title: label,
      ariaLabel: label,
    };
  }

  private static getKey(item: RepoListItem): string {
    return item.key;
  }
}
