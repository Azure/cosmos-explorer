import * as React from "react";
import * as Constants from "../../../Common/Constants";

interface AccessibleElementProps extends React.HtmlHTMLAttributes<HTMLElement> {
  as: string; // tag element name
  onActivated: (event: React.SyntheticEvent<HTMLElement>) => void;
  "aria-label": string;
  tabIndex?: number;
}

/**
 * Wrapper around span element to filter key press, automatically add onClick and require some a11y fields.
 */
export class AccessibleElement extends React.Component<AccessibleElementProps> {
  private onKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.props.onActivated(event);
    }
  };

  public override render(): JSX.Element {
    const elementProps = { ...this.props };
    delete elementProps.as;
    delete elementProps.onActivated;

    const tabIndex = this.props.tabIndex === undefined ? 0 : this.props.tabIndex;

    return React.createElement(this.props.as, {
      ...elementProps,
      onKeyPress: this.onKeyPress,
      onClick: this.props.onActivated,
      tabIndex,
    });
  }
}
