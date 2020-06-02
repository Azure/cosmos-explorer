import * as React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import { IconButton, PrimaryButton } from "office-ui-fabric-react/lib/Button";
import { KeyCodes } from "../../Common/Constants";
import LoadingIndicatorIcon from "../../../images/LoadingIndicator_3Squares.gif";

export interface GenericPaneProps {
  container: ViewModels.Explorer;
  content: JSX.Element;
  id: string;
  isExecuting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitButtonText: string;
  title: string;
}

export class GenericPaneComponent extends React.Component<GenericPaneProps> {
  public render(): JSX.Element {
    const notificationConsoleElement: HTMLElement = document.getElementById("explorerNotificationConsole");
    const panelHeight: number = window.innerHeight - $(notificationConsoleElement).height();

    return (
      <div tabIndex={-1} onKeyDown={this.onKeyDown}>
        <div className="contextual-pane-out" onClick={this.props.onClose}></div>
        <div className="contextual-pane" id={this.props.id} style={{ height: panelHeight }} onKeyDown={this.onKeyDown}>
          <div className="panelContentWrapper">
            <div className="firstdivbg headerline">
              <span id="databaseTitle">{this.props.title}</span>
              <IconButton
                ariaLabel="Close pane"
                title="Close pane"
                onClick={this.props.onClose}
                tabIndex={0}
                className="closePaneBtn"
                iconProps={{ iconName: "Cancel" }}
              />
            </div>
            {this.props.content}
            <div className="paneFooter">
              <div className="leftpanel-okbut">
                <PrimaryButton
                  ariaLabel="Submit"
                  title="Submit"
                  onClick={this.props.onSubmit}
                  tabIndex={0}
                  className="genericPaneSubmitBtn"
                  text={this.props.submitButtonText}
                />
              </div>
            </div>
          </div>
          <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer" hidden={!this.props.isExecuting}>
            <img className="dataExplorerLoader" src={LoadingIndicatorIcon} />
          </div>
        </div>
      </div>
    );
  }

  private onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.keyCode === KeyCodes.Escape) {
      this.props.onClose();
      event.stopPropagation();
    }
  };
}
