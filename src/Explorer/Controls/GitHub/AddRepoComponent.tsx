import { DefaultButton, IButtonProps, ITextFieldProps, TextField } from "@fluentui/react";
import * as React from "react";
import * as Constants from "../../../Common/Constants";
import * as UrlUtility from "../../../Common/UrlUtility";
import { IGitHubRepo } from "../../../GitHub/GitHubClient";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import * as GitHubUtils from "../../../Utils/GitHubUtils";
import Explorer from "../../Explorer";
import { RepoListItem } from "./GitHubReposComponent";
import { ChildrenMargin } from "./GitHubStyleConstants";

export interface AddRepoComponentProps {
  container: Explorer;
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

  constructor(props: AddRepoComponentProps) {
    super(props);

    this.state = {
      textFieldValue: "",
      textFieldErrorMessage: undefined,
    };
  }

  public render(): JSX.Element {
    const textFieldProps: ITextFieldProps = {
      placeholder: AddRepoComponent.TextFieldPlaceholder,
      autoFocus: true,
      value: this.state.textFieldValue,
      errorMessage: this.state.textFieldErrorMessage,
      onChange: this.onTextFieldChange,
    };

    const buttonProps: IButtonProps = {
      text: AddRepoComponent.ButtonText,
      ariaLabel: AddRepoComponent.ButtonText,
      onClick: this.onAddRepoButtonClick,
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
    newValue?: string,
  ): void => {
    this.setState({
      textFieldValue: newValue || "",
      textFieldErrorMessage: undefined,
    });
  };

  private onAddRepoButtonClick = async (): Promise<void> => {
    const startKey: number = TelemetryProcessor.traceStart(Action.NotebooksGitHubManualRepoAdd, {
      dataExplorerArea: Constants.Areas.Notebook,
    });
    let enteredUrl = this.state.textFieldValue;
    if (enteredUrl.indexOf("/tree/") === -1) {
      enteredUrl = UrlUtility.createUri(enteredUrl, `tree/`);
    }

    const repoInfo = GitHubUtils.fromRepoUri(enteredUrl);
    if (repoInfo) {
      this.setState({
        textFieldValue: "",
        textFieldErrorMessage: undefined,
      });

      const repo = await this.props.getRepo(repoInfo.owner, repoInfo.repo);
      if (repo) {
        const item: RepoListItem = {
          key: GitHubUtils.toRepoFullName(repo.owner, repo.name),
          repo,
          branches: repoInfo.branch ? [{ name: repoInfo.branch }] : [],
        };

        TelemetryProcessor.traceSuccess(
          Action.NotebooksGitHubManualRepoAdd,
          {
            dataExplorerArea: Constants.Areas.Notebook,
          },
          startKey,
        );
        return this.props.pinRepo(item);
      }
    }

    this.setState({
      textFieldErrorMessage: AddRepoComponent.TextFieldErrorMessage,
    });
    TelemetryProcessor.traceFailure(
      Action.NotebooksGitHubManualRepoAdd,
      {
        dataExplorerArea: Constants.Areas.Notebook,
        error: AddRepoComponent.TextFieldErrorMessage,
      },
      startKey,
    );
  };
}
