<<<<<<< HEAD
import React, { FunctionComponent, ReactNode } from "react";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent, PanelInfoErrorProps } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";
=======
import { IconButton } from "@fluentui/react";
import React, { FunctionComponent, ReactNode } from "react";
import { KeyCodes } from "../../../Common/Constants";
>>>>>>> 487fbf207299bfd3b7d6404bf0307a8de29ac987

export interface RightPaneFormProps {
  expandConsole: () => void;
  formError: string;
  formErrorDetail: string;
<<<<<<< HEAD
  isExecuting: boolean;
  onSubmit: () => void;
  submitButtonText: string;
=======
  id: string;
  isExecuting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitButtonText: string;
  title: string;
>>>>>>> 487fbf207299bfd3b7d6404bf0307a8de29ac987
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
