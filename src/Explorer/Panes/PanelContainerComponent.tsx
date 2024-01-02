import { IPanelProps, IRenderFunction, Panel, PanelType } from "@fluentui/react";
import * as React from "react";
import { useNotificationConsole } from "../../hooks/useNotificationConsole";
import { useSidePanel } from "../../hooks/useSidePanel";

export interface PanelContainerProps {
  headerText?: string;
  panelContent?: JSX.Element;
  isConsoleExpanded: boolean;
  isOpen: boolean;
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

  omponentDidMount(): void {
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
        style={{ height: this.state.height }}
      >
        {this.props.panelContent}
      </Panel>
    );
  }

  public isFocusable(element: HTMLElement) {
    return (
      element.tabIndex >= 0 ||
      (element instanceof HTMLAnchorElement && element.href) ||
      (element instanceof HTMLAreaElement && element.href) ||
      (element instanceof HTMLInputElement && !element.disabled) ||
      (element instanceof HTMLSelectElement && !element.disabled) ||
      (element instanceof HTMLTextAreaElement && !element.disabled) ||
      (element instanceof HTMLButtonElement && !element.disabled)
    );
  }
  private findFocusableParent = (element: HTMLElement) => {
    while (element) {
      if (this.isFocusable(element)) {
        return element;
      }
      element = element.parentNode as HTMLElement;
    }
    return null;
  };

  private onDissmiss = (ev?: KeyboardEvent | React.SyntheticEvent<HTMLElement>): void => {
    const elementIdToFocus = sessionStorage.getItem("focusedElementId") || null;
    if (elementIdToFocus) {
      const targetElement = document.getElementById(elementIdToFocus);

      if (targetElement) {
        const focusableParent = this.findFocusableParent(targetElement);
        if (focusableParent) {
          setTimeout(() => {
            if (focusableParent) {
              focusableParent.focus();
            }
          }, 100);
          sessionStorage.removeItem("focusedElementId");
        }
      }
    }
    if (ev && (ev.target as HTMLElement).id === "notificationConsoleHeader") {
      ev.preventDefault();
    } else {
      useSidePanel.getState().closeSidePanel();
    }
  };

  private getPanelHeight = (): string => {
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
  const { isOpen, panelContent, panelWidth, headerText } = useSidePanel((state) => {
    return {
      isOpen: state.isOpen,
      panelContent: state.panelContent,
      headerText: state.headerText,
      panelWidth: state.panelWidth,
    };
  });
  // TODO Refactor PanelContainerComponent into a functional component and remove this wrapper
  // This component only exists so we can use hooks and pass them down to a non-functional component
  return (
    <PanelContainerComponent
      isOpen={isOpen}
      panelContent={panelContent}
      headerText={headerText}
      isConsoleExpanded={isConsoleExpanded}
      panelWidth={panelWidth}
      isConsoleAnimationFinished={isConsoleAnimationFinished}
    />
  );
};
