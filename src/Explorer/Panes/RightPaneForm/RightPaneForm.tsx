import React, { CSSProperties, FunctionComponent, ReactNode } from "react";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";
import { labelToLoadingItemName } from "Explorer/Tables/Constants";

export interface RightPaneFormProps {
  formError: string;
  isExecuting: boolean;
  onSubmit: () => void;
  submitButtonText: string;
  isSubmitButtonHidden?: boolean;
  isSubmitButtonDisabled?: boolean;
  children?: ReactNode;
  footerStyle?: CSSProperties;
}

export const RightPaneForm: FunctionComponent<RightPaneFormProps> = ({
  formError,
  isExecuting,
  onSubmit,
  submitButtonText,
  isSubmitButtonHidden = false,
  isSubmitButtonDisabled = false,
  children,
  footerStyle,
}: RightPaneFormProps) => {
  const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
    const screenReaderStatusElement = document.getElementById("screenReaderStatus");
    if (screenReaderStatusElement) {
      screenReaderStatusElement.innerHTML = labelToLoadingItemName[submitButtonText] || "Loading";
    }
  };

  return (
    <>
      <form className="panelFormWrapper" onSubmit={handleOnSubmit}>
        {formError && <PanelInfoErrorComponent messageType="error" message={formError} showErrorDetails={true} />}
        {children}
        {!isSubmitButtonHidden && (
          <PanelFooterComponent
            buttonLabel={submitButtonText}
            isButtonDisabled={isSubmitButtonDisabled}
            style={footerStyle}
          />
        )}
      </form>
      <span role="status" className="screenReaderOnly" id="screenReaderStatus"></span>
      {isExecuting && <PanelLoadingScreen />}
    </>
  );
};
