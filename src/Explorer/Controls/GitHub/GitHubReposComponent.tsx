import { DefaultButton, IButtonProps, Link, PrimaryButton } from "@fluentui/react";
import * as React from "react";
import { IGitHubBranch, IGitHubRepo } from "../../../GitHub/GitHubClient";
import { AddRepoComponent, AddRepoComponentProps } from "./AddRepoComponent";
import { AuthorizeAccessComponent, AuthorizeAccessComponentProps } from "./AuthorizeAccessComponent";
import { ButtonsFooterStyle, ChildrenMargin, ContentFooterStyle } from "./GitHubStyleConstants";
import { ReposListComponent, ReposListComponentProps } from "./ReposListComponent";

export interface GitHubReposComponentProps {
  showAuthorizeAccess: boolean;
  authorizeAccessProps: AuthorizeAccessComponentProps;
  reposListProps: ReposListComponentProps;
  addRepoProps: AddRepoComponentProps;
  resetConnection: () => void;
  onOkClick: () => void;
  onCancelClick: () => void;
}

export interface RepoListItem {
  key: string;
  repo: IGitHubRepo;
  branches: IGitHubBranch[];
}

export class GitHubReposComponent extends React.Component<GitHubReposComponentProps> {
  private static readonly ManageGitHubRepoDescription =
    "Select your GitHub repos and branch(es) to pin to your notebooks workspace.";
  private static readonly ManageGitHubRepoResetConnection = "View or change your GitHub authorization settings.";
  private static readonly OKButtonText = "OK";
  private static readonly CancelButtonText = "Cancel";

  public render(): JSX.Element {
    const content: JSX.Element = this.props.showAuthorizeAccess ? (
      <AuthorizeAccessComponent {...this.props.authorizeAccessProps} />
    ) : (
      <>
        <p>{GitHubReposComponent.ManageGitHubRepoDescription}</p>
        <Link style={{ marginTop: ChildrenMargin }} onClick={this.props.resetConnection}>
          {GitHubReposComponent.ManageGitHubRepoResetConnection}
        </Link>
        <ReposListComponent {...this.props.reposListProps} />
      </>
    );

    const okProps: IButtonProps = {
      text: GitHubReposComponent.OKButtonText,
      ariaLabel: GitHubReposComponent.OKButtonText,
      onClick: this.props.onOkClick,
    };

    const cancelProps: IButtonProps = {
      text: GitHubReposComponent.CancelButtonText,
      ariaLabel: GitHubReposComponent.CancelButtonText,
      onClick: this.props.onCancelClick,
    };

    return (
      <>
        <div>{content}</div>
        {!this.props.showAuthorizeAccess && (
          <>
            <div className={"paneFooter"} style={ContentFooterStyle}>
              <AddRepoComponent {...this.props.addRepoProps} />
            </div>
            <div className={"paneFooter"} style={ButtonsFooterStyle}>
              <PrimaryButton {...okProps} />
              <DefaultButton style={{ marginLeft: ChildrenMargin }} {...cancelProps} />
            </div>
          </>
        )}
      </>
    );
  }
}
