import { IPanelProps, IRenderFunction, Panel, PanelType } from "@fluentui/react";
import * as React from "react";
import { useSidePanel } from "../../hooks/useSidePanel";

export interface PanelContainerProps {
  headerText: string;
  panelContent: JSX.Element;
  isConsoleExpanded: boolean;
  isOpen: boolean;
  closePanel: () => void;
  panelWidth?: string;
  onRenderNavigationContent?: IRenderFunction<IPanelProps>;
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
        customWidth={this.props.panelWidth ? this.props.panelWidth : "440px"}
        headerClassName="panelHeader"
        onRenderNavigationContent={this.props.onRenderNavigationContent}
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

export const SidePanel: React.FC = () => {
  const isOpen = useSidePanel((state) => state.isOpen);
  const closePanel = useSidePanel((state) => state.closeSidePanel);
  const panelContent = useSidePanel((state) => state.panelContent);
  const headerText = useSidePanel((state) => state.headerText);
  // TODO Refactor PanelContainerComponent into a functional component and remove this wrapper
  // This component only exists so we can use hooks and pass them down to a non-functional component
  return (
    <PanelContainerComponent
      isOpen={isOpen}
      panelContent={panelContent}
      headerText={headerText}
      isConsoleExpanded={false}
      closePanel={closePanel}
    />
  );
};
