import React, { FunctionComponent, ReactNode } from "react";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";

export interface RightPaneFormProps {
  formError: string;
  isExecuting: boolean;
  onSubmit: () => void;
  submitButtonText: string;
  isSubmitButtonHidden?: boolean;
  isSubmitButtonDisabled?: boolean;
  children?: ReactNode;
}

export const RightPaneForm: FunctionComponent<RightPaneFormProps> = ({
  formError,
  isExecuting,
  onSubmit,
  submitButtonText,
  isSubmitButtonHidden = false,
  isSubmitButtonDisabled = false,
  children,
}: RightPaneFormProps) => {
  const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <>
      <form className="panelFormWrapper" onSubmit={handleOnSubmit}>
        {formError && <PanelInfoErrorComponent messageType="error" message={formError} showErrorDetails={true} />}
        {children}
        {!isSubmitButtonHidden && (
          <PanelFooterComponent buttonLabel={submitButtonText} isButtonDisabled={isSubmitButtonDisabled} />
        )}
      </form>
      {isExecuting && <PanelLoadingScreen />}
    </>
  );
};
