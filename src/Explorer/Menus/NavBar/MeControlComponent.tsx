import "./MeControlComponent.less";
import * as React from "react";
import { DefaultButton, BaseButton, IButtonProps } from "office-ui-fabric-react/lib/Button";
import { DirectionalHint, IContextualMenuProps } from "office-ui-fabric-react/lib/ContextualMenu";
import { FocusZone } from "office-ui-fabric-react/lib/FocusZone";
import { IPersonaSharedProps, Persona, PersonaInitialsColor, PersonaSize } from "office-ui-fabric-react/lib/Persona";

export interface MeControlComponentProps {
  /**
   * Wheather user is signed in or not
   */
  isUserSignedIn: boolean;
  /**
   * User info
   */
  user: MeControlUser;
  /**
   * Click handler for sign in click
   */
  onSignInClick: (e: React.MouseEvent<BaseButton>) => void;
  /**
   * Click handler for sign out click
   */
  onSignOutClick: (e: React.SyntheticEvent) => void;
  /**
   * Click handler for switch directory click
   */
  onSwitchDirectoryClick: (e: React.SyntheticEvent) => void;
}

export interface MeControlUser {
  /**
   * Display name for user
   */
  name: string;
  /**
   * Display email for user
   */
  email: string;
  /**
   * Display tenant for user
   */
  tenantName: string;
  /**
   * image source for the profic photo
   */
  imageUrl: string;
}

export class MeControlComponent extends React.Component<MeControlComponentProps> {
  public render(): JSX.Element {
    return this.props.isUserSignedIn ? this._renderProfileComponent() : this._renderSignInComponent();
  }

  private _renderProfileComponent(): JSX.Element {
    const { user } = this.props;

    const menuProps: IContextualMenuProps = {
      className: "mecontrolContextualMenu",
      isBeakVisible: false,
      directionalHintFixed: true,
      directionalHint: DirectionalHint.bottomRightEdge,
      calloutProps: {
        minPagePadding: 0
      },
      items: [
        {
          key: "Persona",
          onRender: this._renderPersonaComponent
        },
        {
          key: "SwitchDirectory",
          onRender: this._renderSwitchDirectory
        },
        {
          key: "SignOut",
          onRender: this._renderSignOut
        }
      ]
    };

    const personaProps: IPersonaSharedProps = {
      imageUrl: user.imageUrl,
      text: user.email,
      secondaryText: user.tenantName,
      showSecondaryText: true,
      showInitialsUntilImageLoads: true,
      initialsColor: PersonaInitialsColor.teal,
      size: PersonaSize.size28,
      className: "mecontrolHeaderPersona"
    };

    const buttonProps: IButtonProps = {
      id: "mecontrolHeader",
      className: "mecontrolHeaderButton",
      menuProps: menuProps,
      onRenderMenuIcon: () => <span />,
      styles: {
        rootHovered: { backgroundColor: "#393939" },
        rootFocused: { backgroundColor: "#393939" },
        rootPressed: { backgroundColor: "#393939" },
        rootExpanded: { backgroundColor: "#393939" }
      }
    };

    return (
      <FocusZone>
        <DefaultButton {...buttonProps}>
          <Persona {...personaProps} />
        </DefaultButton>
      </FocusZone>
    );
  }

  private _renderPersonaComponent = (): JSX.Element => {
    const { user } = this.props;
    const personaProps: IPersonaSharedProps = {
      imageUrl: user.imageUrl,
      text: user.name,
      secondaryText: user.email,
      showSecondaryText: true,
      showInitialsUntilImageLoads: true,
      initialsColor: PersonaInitialsColor.teal,
      size: PersonaSize.size72,
      className: "mecontrolContextualMenuPersona"
    };

    return <Persona {...personaProps} />;
  };

  private _renderSwitchDirectory = (): JSX.Element => {
    return (
      <div
        className="switchDirectoryLink"
        onClick={(e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) =>
          this.props.onSwitchDirectoryClick(e)
        }
      >
        Switch Directory
      </div>
    );
  };

  private _renderSignOut = (): JSX.Element => {
    return (
      <div
        className="signOutLink"
        onClick={(e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => this.props.onSignOutClick(e)}
      >
        Sign out
      </div>
    );
  };

  private _renderSignInComponent = (): JSX.Element => {
    const buttonProps: IButtonProps = {
      className: "mecontrolSigninButton",
      text: "Sign In",
      onClick: (e: React.MouseEvent<BaseButton>) => this.props.onSignInClick(e),
      styles: {
        rootHovered: { backgroundColor: "#393939", color: "#fff" },
        rootFocused: { backgroundColor: "#393939", color: "#fff" },
        rootPressed: { backgroundColor: "#393939", color: "#fff" }
      }
    };
    return <DefaultButton {...buttonProps} />;
  };
}
