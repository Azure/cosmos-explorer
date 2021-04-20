import { useBoolean } from "@uifabric/react-hooks";
import React, { FunctionComponent, useState } from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import { NewVertexComponent } from "../../Graph/NewVertexComponent/NewVertexComponent";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";

export interface INewVertexPanelProps {
  explorer: Explorer;
  partitionKeyPropertyProp: string;
  onSubmit: (
    result: ViewModels.NewVertexData,
    handleErrorScenario: (errorMsg: string) => void,
    handleSuccessScenario: () => void
  ) => void;
  openNotificationConsole: () => void;
}

export const NewVertexPanel: FunctionComponent<INewVertexPanelProps> = ({
  explorer,
  partitionKeyPropertyProp,
  onSubmit,
  openNotificationConsole,
}: INewVertexPanelProps): JSX.Element => {
  let newVertexDataValue: ViewModels.NewVertexData;
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const buttonLabel = "OK";

  const submit = (event: React.MouseEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);
    setShowErrorDetails(false);
    if (onSubmit !== undefined) {
      setLoadingTrue();
      onSubmit(newVertexDataValue, handleErrorScenario, handleSuccessScenario);
    }
  };

  const handleErrorScenario = (errorMsg: string) => {
    setErrorMessage(errorMsg);
    setShowErrorDetails(true);
    setLoadingFalse();
  };

  const handleSuccessScenario = () => {
    setLoadingFalse();
    explorer.closeSidePanel();
  };

  const onChange = (newVertexData: ViewModels.NewVertexData) => {
    newVertexDataValue = newVertexData;
  };

  return (
    <form className="panelFormWrapper" onSubmit={(event: React.MouseEvent<HTMLFormElement>) => submit(event)}>
      {errorMessage && (
        <PanelInfoErrorComponent
          message={errorMessage}
          messageType="error"
          showErrorDetails={showErrorDetails}
          openNotificationConsole={openNotificationConsole}
        />
      )}
      <div className="panelMainContent">
        <NewVertexComponent
          newVertexDataProp={newVertexDataValue}
          partitionKeyPropertyProp={partitionKeyPropertyProp}
          onChangeProp={onChange}
        />
      </div>
      <PanelFooterComponent buttonLabel={buttonLabel} />
      {isLoading && <PanelLoadingScreen />}
    </form>
  );
};
