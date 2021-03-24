/**
 * React component for control bar
 */

import * as React from "react";
import {
  CommandButtonComponent,
  CommandButtonComponentProps,
} from "../../Controls/CommandButton/CommandButtonComponent";

export interface ControlBarComponentProps {
  buttons: CommandButtonComponentProps[];
}

export class ControlBarComponent extends React.Component<ControlBarComponentProps> {
  private static renderButtons(commandButtonOptions: CommandButtonComponentProps[]): JSX.Element[] {
    return commandButtonOptions.map(
      (btn: CommandButtonComponentProps, index: number): JSX.Element => {
        // Remove label
        btn.commandButtonLabel = undefined;
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
