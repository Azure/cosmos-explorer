import * as React from "react";
import { Panel, PanelType } from "@fluentui/react";

export interface PanelContainerProps {
  headerText: string;
  panelContent: JSX.Element;
  isConsoleExpanded: boolean;
  isOpen: boolean;
  closePanel: () => void;
}

export interface PanelContainerState {
  height: string;
}

export class PanelContainerComponent extends React.Component<PanelContainerProps, PanelContainerState> {
  private static readonly consoleHeaderHeight = 32;
  private static readonly consoleContentHeight = 220;

  constructor(props: PanelContainerProps) {
    super(props);

    this.state = {
      height: this.getPanelHeight(),
    };
  }

  componentDidMount(): void {
    window.addEventListener("resize", () => this.setState({ height: this.getPanelHeight() }));
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", () => this.setState({ height: this.getPanelHeight() }));
  }

  render(): JSX.Element {
    if (!this.props.panelContent) {
      return <></>;
    }

    return (
      <Panel
        headerText={this.props.headerText}
        isOpen={this.props.isOpen}
        onDismiss={this.onDissmiss}
        isLightDismiss
        type={PanelType.custom}
        closeButtonAriaLabel="Close"
        customWidth="440px"
        headerClassName="panelHeader"
        styles={{
          navigation: { borderBottom: "1px solid #cccccc" },
          content: { padding: 0, height: "100%" },
          scrollableContent: { height: "100%" },
          header: { padding: "0 0 8px 34px" },
          commands: { marginTop: 8 },
        }}
        style={{ height: this.getPanelHeight() }}
      >
        {this.props.panelContent}
      </Panel>
    );
  }

  private onDissmiss = (ev?: React.SyntheticEvent<HTMLElement>): void => {
    if ((ev.target as HTMLElement).id === "notificationConsoleHeader") {
      ev.preventDefault();
    } else {
      this.props.closePanel();
    }
  };

  private getPanelHeight = (): string => {
    const consoleHeight = this.props.isConsoleExpanded
      ? PanelContainerComponent.consoleContentHeight + PanelContainerComponent.consoleHeaderHeight
      : PanelContainerComponent.consoleHeaderHeight;
    const panelHeight = window.innerHeight - consoleHeight;
    return panelHeight + "px";
  };
}
