import { useBoolean } from "@fluentui/react-hooks";
import React, { FunctionComponent, useState } from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { NewVertexComponent } from "../../Graph/NewVertexComponent/NewVertexComponent";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";
export interface INewVertexPanelProps {
  partitionKeyPropertyProp: string;
  onSubmit: (result: ViewModels.NewVertexData, onError: (errorMsg: string) => void, onSuccess: () => void) => void;
}

export const NewVertexPanel: FunctionComponent<INewVertexPanelProps> = ({
  partitionKeyPropertyProp,
  onSubmit,
}: INewVertexPanelProps): JSX.Element => {
  let newVertexDataValue: ViewModels.NewVertexData;
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);

  const submit = () => {
    setErrorMessage(undefined);
    if (onSubmit !== undefined) {
      setLoadingTrue();
      onSubmit(newVertexDataValue, onError, onSuccess);
    }
  };

  const onError = (errorMsg: string) => {
    setErrorMessage(errorMsg);
    setLoadingFalse();
  };
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const onSuccess = () => {
    setLoadingFalse();
    closeSidePanel();
  };

  const onChange = (newVertexData: ViewModels.NewVertexData) => {
    newVertexDataValue = newVertexData;
  };
  const props: RightPaneFormProps = {
    formError: errorMessage,
    isExecuting: isLoading,
    submitButtonText: "OK",
    onSubmit: () => submit(),
  };

  return (
    <RightPaneForm {...props}>
      <div className="panelMainContent">
        <NewVertexComponent
          newVertexDataProp={newVertexDataValue}
          partitionKeyPropertyProp={partitionKeyPropertyProp}
          onChangeProp={onChange}
        />
      </div>
    </RightPaneForm>
  );
};
