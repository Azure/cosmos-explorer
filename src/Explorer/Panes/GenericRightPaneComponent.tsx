import { Subscription } from "knockout";
import { IconButton, PrimaryButton } from "office-ui-fabric-react/lib/Button";
import * as React from "react";
import ErrorRedIcon from "../../../images/error_red.svg";
import LoadingIndicatorIcon from "../../../images/LoadingIndicator_3Squares.gif";
import { KeyCodes } from "../../Common/Constants";
import Explorer from "../Explorer";

export interface GenericRightPaneProps {
  container: Explorer;
  formError: string;
  formErrorDetail: string;
  id: string;
  isExecuting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitButtonText: string;
  title: string;
  isSubmitButtonHidden?: boolean;
  isFooterHidden?: boolean;
}

export interface GenericRightPaneState {
  panelHeight: number;
}

export class GenericRightPaneComponent extends React.Component<GenericRightPaneProps, GenericRightPaneState> {
  private notificationConsoleSubscription: Subscription;

  constructor(props: GenericRightPaneProps) {
    super(props);

    this.state = {
      panelHeight: this.getPanelHeight(),
    };
  }

  public componentWillUnmount(): void {
    this.notificationConsoleSubscription && this.notificationConsoleSubscription.dispose();
  }

  public render(): JSX.Element {
    return (
      <div tabIndex={-1} onKeyDown={this.onKeyDown}>
        <div className="contextual-pane-out" onClick={this.props.onClose}></div>
        <div
          className="contextual-pane"
          id={this.props.id}
          style={{ height: this.state.panelHeight }}
          onKeyDown={this.onKeyDown}
        >
          <div className="panelContentWrapper">
            {this.renderPanelHeader()}
            {this.renderErrorSection()}
            {this.props.children}
            {!this.props.isFooterHidden && this.renderPanelFooter()}
          </div>
          {this.renderLoadingScreen()}
        </div>
      </div>
    );
  }

  private renderPanelHeader = (): JSX.Element => {
    return (
      <div className="firstdivbg headerline">
        <span id="databaseTitle" role="heading" aria-level={2}>
          {this.props.title}
        </span>
        <IconButton
          ariaLabel="Close pane"
          title="Close pane"
          onClick={this.props.onClose}
          tabIndex={0}
          className="closePaneBtn"
          iconProps={{ iconName: "Cancel" }}
        />
      </div>
    );
  };

  private renderErrorSection = (): JSX.Element => {
    return (
      <div className="warningErrorContainer" aria-live="assertive" hidden={!this.props.formError}>
        <div className="warningErrorContent">
          <span>
            <img className="paneErrorIcon" src={ErrorRedIcon} alt="Error" />
          </span>
          <span className="warningErrorDetailsLinkContainer">
            <span className="formErrors" title={this.props.formError}>
              {this.props.formError}
            </span>
            <a className="errorLink" role="link" hidden={!this.props.formErrorDetail} onClick={this.showErrorDetail}>
              More details
            </a>
          </span>
        </div>
      </div>
    );
  };

  private renderPanelFooter = (): JSX.Element => {
    return (
      <div className="paneFooter">
        <div className="leftpanel-okbut">
          <PrimaryButton
            style={{ visibility: this.props.isSubmitButtonHidden ? "hidden" : "visible" }}
            ariaLabel="Submit"
            title="Submit"
            onClick={this.props.onSubmit}
            tabIndex={0}
            className="genericPaneSubmitBtn"
            text={this.props.submitButtonText}
          />
        </div>
      </div>
    );
  };

  private renderLoadingScreen = (): JSX.Element => {
    return (
      <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer" hidden={!this.props.isExecuting}>
        <img className="dataExplorerLoader" src={LoadingIndicatorIcon} />
      </div>
    );
  };

  private onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.keyCode === KeyCodes.Escape) {
      this.props.onClose();
      event.stopPropagation();
    }
  };

  private showErrorDetail = (): void => {
    this.props.container.expandConsole();
  };

  private getPanelHeight = (): number => {
    const notificationConsoleElement: HTMLElement = document.getElementById("explorerNotificationConsole");
    return window.innerHeight - $(notificationConsoleElement).height();
  };
}
