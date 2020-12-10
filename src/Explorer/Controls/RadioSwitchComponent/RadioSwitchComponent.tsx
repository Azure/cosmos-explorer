/**
 * Horizontal switch component
 */

import * as React from "react";
import "./RadioSwitchComponent.less";
import { Icon } from "office-ui-fabric-react/lib/Icon";
import { NormalizedEventKey } from "../../../Common/Constants";

export interface Choice {
  key: string;
  onSelect: () => void;
  label: string;
}

export interface RadioSwitchComponentProps {
  choices: Choice[];
  selectedKey: string;
  onSelectionKeyChange?: (newValue: string) => void;
}

export class RadioSwitchComponent extends React.Component<RadioSwitchComponentProps> {
  public render(): JSX.Element {
    return (
      <div className="radioSwitchComponent">
        {this.props.choices.map((choice: Choice) => (
          <span
            tabIndex={0}
            key={choice.key}
            onClick={() => this.onSelect(choice)}
            onKeyPress={(event) => this.onKeyPress(event, choice)}
          >
            <Icon iconName={this.props.selectedKey === choice.key ? "RadioBtnOn" : "RadioBtnOff"} />
            <span className="caption">{choice.label}</span>
          </span>
        ))}
      </div>
    );
  }

  private onSelect(choice: Choice): void {
    this.props.onSelectionKeyChange && this.props.onSelectionKeyChange(choice.key);
    choice.onSelect();
  }

  private onKeyPress(event: React.KeyboardEvent<HTMLSpanElement>, choice: Choice): void {
    if (event.key === NormalizedEventKey.Enter || event.key === NormalizedEventKey.Space) {
      this.onSelect(choice);
    }
  }
}
