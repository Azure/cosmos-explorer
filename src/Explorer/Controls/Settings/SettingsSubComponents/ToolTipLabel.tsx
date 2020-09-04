import * as React from "react";
import { Stack, IStackTokens, IIconStyles, Icon, Callout } from "office-ui-fabric-react";

export interface ToolTipLabelComponentProps {
  label?: string;
  toolTipElement: JSX.Element;
}

interface ToolTipLabelComponentState {
  isCalloutVisible: boolean;
}

const stackTokens: IStackTokens = {
  childrenGap: 4,
  maxWidth: 300
};

const iconButtonStyles: Partial<IIconStyles> = { root: { marginBottom: -3 } };
export class ToolTipLabelComponent extends React.Component<ToolTipLabelComponentProps, ToolTipLabelComponentState> {
  private iconDivRef = React.createRef<HTMLDivElement>();

  constructor(props: ToolTipLabelComponentProps) {
    super(props);
    this.state = {
      isCalloutVisible: false
    };
  }

  private toggleIsCalloutVisible = (): void => {
    this.setState({ isCalloutVisible: !this.state.isCalloutVisible });
  };

  public render(): JSX.Element {
    return (
      <>
        <Stack horizontal verticalAlign="center" tokens={stackTokens}>
          {this.props.label && <span>{this.props.label}</span>}
          <div ref={this.iconDivRef}>
            <Icon
              iconName="Info"
              ariaLabel="Info"
              onMouseOver={this.toggleIsCalloutVisible}
              onMouseOut={this.toggleIsCalloutVisible}
              styles={iconButtonStyles}
            />
          </div>
        </Stack>
        {this.state.isCalloutVisible && (
          <Callout target={this.iconDivRef.current} onDismiss={this.toggleIsCalloutVisible} role="alertdialog">
            <div className="settingsV2ToolTip">{this.props.toolTipElement}</div>
          </Callout>
        )}
      </>
    );
  }
}
