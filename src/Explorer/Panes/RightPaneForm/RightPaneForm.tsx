import React, { FunctionComponent, ReactNode } from "react";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent, PanelInfoErrorProps } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";

export interface RightPaneFormProps {
  expandConsole: () => void;
  formError: string;
  formErrorDetail: string;
  isExecuting: boolean;
  onSubmit: () => void;
  submitButtonText: string;
  isSubmitButtonHidden?: boolean;
  children?: ReactNode;
}

export const RightPaneForm: FunctionComponent<RightPaneFormProps> = ({
  expandConsole,
  formError,
  formErrorDetail,
  isExecuting,
  onSubmit,
  submitButtonText,
  isSubmitButtonHidden = false,
  children,
}: RightPaneFormProps) => {
  const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const panelInfoErrorProps: PanelInfoErrorProps = {
    messageType: "error",
    message: formError,
    formError: formError !== "",
    showErrorDetails: formErrorDetail !== "",
    openNotificationConsole: expandConsole,
  };

  return (
    <>
      <PanelInfoErrorComponent {...panelInfoErrorProps} />
      <form className="panelFormWrapper" onSubmit={handleOnSubmit}>
        {children}
        {!isSubmitButtonHidden && <PanelFooterComponent buttonLabel={submitButtonText} />}
      </form>
      {isExecuting && <PanelLoadingScreen />}
    </>
  );
};
