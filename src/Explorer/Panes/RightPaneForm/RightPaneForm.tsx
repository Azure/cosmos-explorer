import { IconButton } from "office-ui-fabric-react/lib/Button";
import React, { FunctionComponent, ReactNode } from "react";
import { KeyCodes } from "../../../Common/Constants";
import Explorer from "../../Explorer";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent, PanelInfoErrorProps } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";

export interface RightPaneFormProps {
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
  children?: ReactNode;
}

export const RightPaneForm: FunctionComponent<RightPaneFormProps> = ({
  container,
  formError,
  formErrorDetail,
  id,
  isExecuting,
  onClose,
  onSubmit,
  submitButtonText,
  title,
  isSubmitButtonHidden = false,
  children,
}: RightPaneFormProps) => {
  const getPanelHeight = (): number => {
    const notificationConsoleElement: HTMLElement = document.getElementById("explorerNotificationConsole");
    return window.innerHeight - $(notificationConsoleElement).height();
  };

  const panelHeight: number = getPanelHeight();

  const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };
  const renderPanelHeader = (): JSX.Element => {
    return (
      <div className="firstdivbg headerline">
        <span id="databaseTitle" role="heading" aria-level={2}>
          {title}
        </span>
        <IconButton
          ariaLabel="Close pane"
          title="Close pane"
          data-testid="closePaneBtn"
          onClick={onClose}
          tabIndex={0}
          className="closePaneBtn"
          iconProps={{ iconName: "Cancel" }}
        />
      </div>
    );
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.keyCode === KeyCodes.Escape) {
      onClose();
      event.stopPropagation();
    }
  };

  const showErrorDetail = (): void => {
    container.expandConsole();
  };

  const panelInfoErrorProps: PanelInfoErrorProps = {
    messageType: "error",
    message: formError,
    formError: formError !== "",
    showErrorDetails: formErrorDetail !== "",
    openNotificationConsole: showErrorDetail,
  };

  return (
    <>
      <div className="contextual-pane-out" onClick={onClose}></div>
      <div className="contextual-pane" id={id} style={{ height: panelHeight }} onKeyDown={onKeyDown}>
        <div className="panelContentWrapper">
          {renderPanelHeader()}
          <PanelInfoErrorComponent {...panelInfoErrorProps} />
          <form className="panelFormWrapper" onSubmit={handleOnSubmit}>
            {children}
            {!isSubmitButtonHidden && <PanelFooterComponent buttonLabel={submitButtonText} />}
          </form>
        </div>
        {isExecuting && <PanelLoadingScreen />}
      </div>
    </>
  );
};
