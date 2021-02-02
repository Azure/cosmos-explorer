import * as React from "react";
import { Panel, PanelType } from "office-ui-fabric-react";
import { PanelParams } from "./PanelManager";

export interface PanelContainerProps {
  panelParams: PanelParams;
  isConsoleExpanded: boolean;
}

export class PanelContainerComponent extends React.Component<PanelContainerProps> {
  private readonly consoleHeaderHeight = 32;
  private readonly consoleContentHeight = 220;

  render(): JSX.Element {
    if (!this.props.panelParams) {
      return <></>;
    }

    return (
      <Panel
        headerText={this.props.panelParams.headerText}
        isOpen={this.props.panelParams.isOpen}
        onDismiss={this.onDissmiss}
        isLightDismiss
        type={PanelType.custom}
        closeButtonAriaLabel="Close"
        customWidth="440px"
        headerClassName="panelHeader"
        styles={{
          navigation: { borderBottom: "1px solid #cccccc" },
          content: { padding: "24px 34px 20px 34px", height: "100%" },
          scrollableContent: { height: "100%" },
        }}
        style={{ height: this.getPanelHeight() }}
      >
        {this.props.panelParams.panelContent}
      </Panel>
    );
  }

  private onDissmiss = (ev?: React.SyntheticEvent<HTMLElement>): void => {
    if ((ev.target as HTMLElement).id === "notificationConsoleHeader") {
      ev.preventDefault();
    } else {
      this.props.panelParams.onPanelClose();
    }
  };

  private getPanelHeight = (): string => {
    const consoleHeight = this.props.isConsoleExpanded
      ? this.consoleContentHeight + this.consoleHeaderHeight
      : this.consoleHeaderHeight;
    const panelHeight = window.innerHeight - consoleHeight;
    return panelHeight + "px";
  };
}
