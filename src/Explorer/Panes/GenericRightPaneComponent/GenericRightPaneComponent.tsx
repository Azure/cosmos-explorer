import { IconButton, PrimaryButton } from "@fluentui/react";
import React, { FunctionComponent, ReactNode } from "react";
import ErrorRedIcon from "../../../../images/error_red.svg";
import LoadingIndicatorIcon from "../../../../images/LoadingIndicator_3Squares.gif";
import { KeyCodes } from "../../../Common/Constants";

export interface GenericRightPaneProps {
  expandConsole: () => void;
  formError: string;
  formErrorDetail: string;
  id: string;
  isExecuting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitButtonText: string;
  title: string;
  isSubmitButtonHidden?: boolean;
  children?: ReactNode;
}

export const GenericRightPaneComponent: FunctionComponent<GenericRightPaneProps> = ({
  expandConsole,
  formError,
  formErrorDetail,
  id,
  isExecuting,
  onClose,
  onSubmit,
  submitButtonText,
  title,
  isSubmitButtonHidden,
  children,
}: GenericRightPaneProps) => {
  const getPanelHeight = (): number => {
    const notificationConsoleElement: HTMLElement = document.getElementById("explorerNotificationConsole");
    return window.innerHeight - $(notificationConsoleElement).height();
  };

  const panelHeight: number = getPanelHeight();

  const renderPanelHeader = (): JSX.Element => {
    return (
      <div className="firstdivbg headerline">
        <span id="databaseTitle" role="heading" aria-level={2}>
          {title}
        </span>
        <IconButton
          ariaLabel="Close pane"
          title="Close pane"
          onClick={onClose}
          tabIndex={0}
          className="closePaneBtn"
          iconProps={{ iconName: "Cancel" }}
        />
      </div>
    );
  };

  const renderErrorSection = (): JSX.Element => {
    return (
      <div className="warningErrorContainer" aria-live="assertive" hidden={!formError}>
        <div className="warningErrorContent">
          <span>
            <img className="paneErrorIcon" src={ErrorRedIcon} alt="Error" />
          </span>
          <span className="warningErrorDetailsLinkContainer">
            <span className="formErrors" title={formError}>
              {formError}
            </span>
            <a className="errorLink" role="link" hidden={!formErrorDetail} onClick={expandConsole}>
              More details
            </a>
          </span>
        </div>
      </div>
    );
  };

  const renderPanelFooter = (): JSX.Element => {
    return (
      <div className="paneFooter">
        <div className="leftpanel-okbut">
          <PrimaryButton
            style={{ visibility: isSubmitButtonHidden ? "hidden" : "visible" }}
            ariaLabel="Submit"
            title="Submit"
            onClick={onSubmit}
            tabIndex={0}
            className="genericPaneSubmitBtn"
            text={submitButtonText}
          />
        </div>
      </div>
    );
  };

  const renderLoadingScreen = (): JSX.Element => {
    return (
      <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer" hidden={!isExecuting}>
        <img className="dataExplorerLoader" src={LoadingIndicatorIcon} />
      </div>
    );
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.keyCode === KeyCodes.Escape) {
      onClose();
      event.stopPropagation();
    }
  };

  return (
    <div tabIndex={-1} onKeyDown={onKeyDown}>
      <div className="contextual-pane-out" onClick={onClose}></div>
      <div className="contextual-pane" id={id} style={{ height: panelHeight }} onKeyDown={onKeyDown}>
        <div className="panelContentWrapper">
          {renderPanelHeader()}
          {renderErrorSection()}
          {children}
          {renderPanelFooter()}
        </div>
        {renderLoadingScreen()}
      </div>
    </div>
  );
};
