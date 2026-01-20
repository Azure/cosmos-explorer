import { IPanelProps, IRenderFunction, Panel, PanelType } from "@fluentui/react";
import * as React from "react";
import { useNotificationConsole } from "../../hooks/useNotificationConsole";
import { useSidePanel } from "../../hooks/useSidePanel";

export interface PanelContainerProps {
  headerText?: string;
  panelContent?: JSX.Element;
  isConsoleExpanded: boolean;
  isOpen: boolean;
  hasConsole: boolean;
  isConsoleAnimationFinished?: boolean;
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

  componentDidUpdate(): void {
    if (useNotificationConsole.getState().consoleAnimationFinished || this.state.height !== this.getPanelHeight()) {
      this.setState({
        height: this.getPanelHeight(),
      });
      useNotificationConsole.getState().setConsoleAnimationFinished(false);
    }
  }

  render(): JSX.Element {
    if (!this.props.panelContent) {
      return <></>;
    }

    return (
      <Panel
        data-test={`Panel:${this.props.headerText}`}
        headerText={this.props.headerText}
        isOpen={this.props.isOpen}
        onDismiss={this.onDissmiss}
        isLightDismiss
        type={PanelType.custom}
        closeButtonAriaLabel={`Close ${this.props.headerText}`}
        customWidth={this.props.panelWidth ? this.props.panelWidth : "440px"}
        headerClassName="panelHeader"
        className="themed-panel"
        onRenderNavigationContent={this.props.onRenderNavigationContent}
        isFooterAtBottom={true}
        styles={{
          navigation: {
            borderBottom: "1px solid var(--colorNeutralStroke1)",
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
          },
          content: {
            padding: 0,
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
          },
          header: {
            padding: "0 0 8px 34px",
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
          },
          commands: {
            marginTop: 8,
            paddingTop: 0,
            backgroundColor: "var(--colorNeutralBackground1)",
          },
          root: {},
          overlay: {
            backgroundColor: "var(--overlayBackground)",
          },
          main: {
            backgroundColor: "var(--colorNeutralBackground1)",
          },
          scrollableContent: {
            backgroundColor: "var(--colorNeutralBackground1)",
          },
          footerInner: {
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
          },
          closeButton: {
            color: "var(--colorNeutralForeground1)",
          },
        }}
        style={{ height: this.state.height }}
      >
        {this.props.panelContent}
      </Panel>
    );
  }

  private onDissmiss = (ev?: KeyboardEvent | React.SyntheticEvent<HTMLElement>): void => {
    if (ev && (ev.target as HTMLElement).id === "notificationConsoleHeader") {
      ev.preventDefault();
    } else {
      useSidePanel.getState().closeSidePanel();
    }
  };

  private getPanelHeight = (): string => {
    if (!this.props.hasConsole) {
      return window.innerHeight + "px";
    }
    const notificationConsole = document.getElementById("explorerNotificationConsole");
    if (notificationConsole) {
      return window.innerHeight - notificationConsole.clientHeight + "px";
    }
    return (
      window.innerHeight -
      (this.props.isConsoleExpanded
        ? PanelContainerComponent.consoleContentHeight + PanelContainerComponent.consoleHeaderHeight
        : PanelContainerComponent.consoleHeaderHeight) +
      "px"
    );
  };
}
export const SidePanel: React.FC = () => {
  const isConsoleExpanded = useNotificationConsole((state) => state.isExpanded);
  const isConsoleAnimationFinished = useNotificationConsole((state) => state.consoleAnimationFinished);
  const { isOpen, hasConsole, panelContent, panelWidth, headerText } = useSidePanel((state) => {
    return {
      isOpen: state.isOpen,
      hasConsole: state.hasConsole,
      panelContent: state.panelContent,
      headerText: state.headerText,
      panelWidth: state.panelWidth,
    };
  });
  // TODO Refactor PanelContainerComponent into a functional component and remove this wrapper
  // This component only exists so we can use hooks and pass them down to a non-functional component
  return (
    <PanelContainerComponent
      hasConsole={hasConsole}
      isOpen={isOpen}
      panelContent={panelContent}
      headerText={headerText}
      isConsoleExpanded={isConsoleExpanded}
      panelWidth={panelWidth}
      isConsoleAnimationFinished={isConsoleAnimationFinished}
    />
  );
};
