import { ChoiceGroup, IButtonProps, IChoiceGroupOption, IChoiceGroupProps, PrimaryButton } from "@fluentui/react";
import * as React from "react";
import { ChildrenMargin } from "./GitHubStyleConstants";

export interface AuthorizeAccessComponentProps {
  scope: string;
  authorizeAccess: (scope: string | undefined) => void;
}

export interface AuthorizeAccessComponentState {
  scope: string | undefined;
}

export class AuthorizeAccessComponent extends React.Component<
  AuthorizeAccessComponentProps,
  AuthorizeAccessComponentState
> {
  // Scopes supported by GitHub OAuth. We're only interested in ones which allow us access to repos.
  // https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
  public static readonly Scopes = {
    Public: {
      key: "public_repo",
      text: "Public repos only",
    },
    PublicAndPrivate: {
      key: "repo",
      text: "Public and private repos",
    },
  };

  private static readonly DescriptionPara1 =
    "Connect your notebooks workspace to GitHub. You'll be able to view, edit, and run notebooks stored in your GitHub repositories in Data Explorer.";
  private static readonly DescriptionPara2 =
    "Complete setup by authorizing Azure Cosmos DB to access the repositories in your GitHub account: ";
  private static readonly AuthorizeButtonText = "Authorize access";

  private onChoiceGroupChange = (
    _: React.FormEvent<HTMLElement | HTMLInputElement> | undefined,
    option: IChoiceGroupOption | undefined
  ): void =>
    this.setState({
      scope: option ? option.key : undefined,
    });

  private onButtonClick = (): void => this.props.authorizeAccess(this.state.scope);

  constructor(props: AuthorizeAccessComponentProps) {
    super(props);

    this.state = {
      scope: this.props.scope,
    };
  }

  public render(): JSX.Element {
    const choiceGroupProps: IChoiceGroupProps = {
      options: [
        {
          key: AuthorizeAccessComponent.Scopes.Public.key,
          text: AuthorizeAccessComponent.Scopes.Public.text,
          ariaLabel: AuthorizeAccessComponent.Scopes.Public.text,
        },
        {
          key: AuthorizeAccessComponent.Scopes.PublicAndPrivate.key,
          text: AuthorizeAccessComponent.Scopes.PublicAndPrivate.text,
          ariaLabel: AuthorizeAccessComponent.Scopes.PublicAndPrivate.text,
        },
      ],
      selectedKey: this.state.scope,
      onChange: (
        _: React.FormEvent<HTMLElement | HTMLInputElement> | undefined,
        options: IChoiceGroupOption | undefined
      ) => this.onChoiceGroupChange(_, options),
    };

    const buttonProps: IButtonProps = {
      text: AuthorizeAccessComponent.AuthorizeButtonText,
      ariaLabel: AuthorizeAccessComponent.AuthorizeButtonText,
      onClick: this.onButtonClick,
    };

    return (
      <>
        <p>{AuthorizeAccessComponent.DescriptionPara1}</p>
        <p style={{ marginTop: ChildrenMargin }}>{AuthorizeAccessComponent.DescriptionPara2}</p>
        <ChoiceGroup style={{ marginTop: ChildrenMargin }} {...choiceGroupProps} />
        <PrimaryButton style={{ marginTop: ChildrenMargin }} {...buttonProps} />
      </>
    );
  }
}
