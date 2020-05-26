/**
 * React component for control bar
 */

import * as React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { CommandButtonComponent } from "../../Controls/CommandButton/CommandButtonComponent";

export interface ControlBarComponentProps {
  buttons: ViewModels.NavbarButtonConfig[];
}

export class ControlBarComponent extends React.Component<ControlBarComponentProps> {
  private static renderButtons(commandButtonOptions: ViewModels.NavbarButtonConfig[]): JSX.Element[] {
    return commandButtonOptions.map(
      (btn: ViewModels.NavbarButtonConfig, index: number): JSX.Element => {
        // Remove label
        btn.commandButtonLabel = null;
        return CommandButtonComponent.renderButton(btn, `${index}`);
      }
    );
  }

  public render(): JSX.Element {
    if (!this.props.buttons || this.props.buttons.length < 1) {
      return <React.Fragment />;
    }

    return <React.Fragment>{ControlBarComponent.renderButtons(this.props.buttons)}</React.Fragment>;
  }
}
