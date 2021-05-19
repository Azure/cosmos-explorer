import React, { FunctionComponent, ReactNode } from "react";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";

export interface RightPaneFormProps {
  expandConsole: () => void;
  formError: string;
  isExecuting: boolean;
  onSubmit: () => void;
  submitButtonText: string;
  isSubmitButtonHidden?: boolean;
  children?: ReactNode;
}

export const RightPaneForm: FunctionComponent<RightPaneFormProps> = ({
  expandConsole,
  formError,
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

  return (
    <>
      <form className="panelFormWrapper" onSubmit={handleOnSubmit}>
        {formError && (
          <PanelInfoErrorComponent
            messageType="error"
            message={formError}
            showErrorDetails={true}
            openNotificationConsole={expandConsole}
          />
        )}
        {children}
        {!isSubmitButtonHidden && <PanelFooterComponent buttonLabel={submitButtonText} />}
      </form>
      {isExecuting && <PanelLoadingScreen />}
    </>
  );
};
