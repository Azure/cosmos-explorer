import { DefaultButton, IButtonProps, ITextFieldProps, TextField } from "office-ui-fabric-react";
import * as React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import * as Constants from "../../../Common/Constants";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import { Areas } from "../../../Common/Constants";
import { RepoListItem } from "./GitHubReposComponent";
import { ChildrenMargin } from "./GitHubStyleConstants";
import { GitHubUtils } from "../../../Utils/GitHubUtils";
import { IGitHubRepo } from "../../../GitHub/GitHubClient";
import TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";

export interface AddRepoComponentProps {
  container: ViewModels.Explorer;
  getRepo: (owner: string, repo: string) => Promise<IGitHubRepo>;
  pinRepo: (item: RepoListItem) => void;
}

interface AddRepoComponentState {
  textFieldValue: string;
  textFieldErrorMessage: string;
}

export class AddRepoComponent extends React.Component<AddRepoComponentProps, AddRepoComponentState> {
  private static readonly DescriptionText =
    "Don't see what you're looking for? Add your repo/branch, or any public repo (read-access only) by entering the URL: ";
  private static readonly ButtonText = "Add";
  private static readonly TextFieldPlaceholder = "https://github.com/owner/repo/tree/branch";
  private static readonly TextFieldErrorMessage = "Invalid url";
  private static readonly DefaultBranchName = "master";

  constructor(props: AddRepoComponentProps) {
    super(props);

    this.state = {
      textFieldValue: "",
      textFieldErrorMessage: undefined
    };
  }

  public render(): JSX.Element {
    const textFieldProps: ITextFieldProps = {
      placeholder: AddRepoComponent.TextFieldPlaceholder,
      autoFocus: true,
      value: this.state.textFieldValue,
      errorMessage: this.state.textFieldErrorMessage,
      onChange: this.onTextFieldChange
    };

    const buttonProps: IButtonProps = {
      text: AddRepoComponent.ButtonText,
      ariaLabel: AddRepoComponent.ButtonText,
      onClick: this.onAddRepoButtonClick
    };

    return (
      <>
        <p style={{ marginBottom: ChildrenMargin }}>{AddRepoComponent.DescriptionText}</p>
        <TextField {...textFieldProps} />
        <DefaultButton style={{ marginTop: ChildrenMargin }} {...buttonProps} />
      </>
    );
  }

  private onTextFieldChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.setState({
      textFieldValue: newValue || "",
      textFieldErrorMessage: undefined
    });
  };

  private onAddRepoButtonClick = async (): Promise<void> => {
    const startKey: number = TelemetryProcessor.traceStart(Action.NotebooksGitHubManualRepoAdd, {
      databaseAccountName: this.props.container.databaseAccount() && this.props.container.databaseAccount().name,
      defaultExperience: this.props.container.defaultExperience && this.props.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Notebook
    });
    let enteredUrl = this.state.textFieldValue;
    if (enteredUrl.indexOf("/tree/") === -1) {
      enteredUrl = `${enteredUrl}/tree/${AddRepoComponent.DefaultBranchName}`;
    }

    const gitHubInfo = GitHubUtils.fromGitHubUri(enteredUrl);
    if (gitHubInfo) {
      this.setState({
        textFieldValue: "",
        textFieldErrorMessage: undefined
      });

      const repo = await this.props.getRepo(gitHubInfo.owner, gitHubInfo.repo);
      if (repo) {
        const item: RepoListItem = {
          key: GitHubUtils.toRepoFullName(repo.owner.login, repo.name),
          repo,
          branches: [
            {
              name: gitHubInfo.branch
            }
          ]
        };

        TelemetryProcessor.traceSuccess(
          Action.NotebooksGitHubManualRepoAdd,
          {
            databaseAccountName: this.props.container.databaseAccount() && this.props.container.databaseAccount().name,
            defaultExperience: this.props.container.defaultExperience && this.props.container.defaultExperience(),
            dataExplorerArea: Constants.Areas.Notebook
          },
          startKey
        );
        return this.props.pinRepo(item);
      }
    }

    this.setState({
      textFieldErrorMessage: AddRepoComponent.TextFieldErrorMessage
    });
    TelemetryProcessor.traceFailure(
      Action.NotebooksGitHubManualRepoAdd,
      {
        databaseAccountName: this.props.container.databaseAccount() && this.props.container.databaseAccount().name,
        defaultExperience: this.props.container.defaultExperience && this.props.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.Notebook,
        error: AddRepoComponent.TextFieldErrorMessage
      },
      startKey
    );
  };
}
