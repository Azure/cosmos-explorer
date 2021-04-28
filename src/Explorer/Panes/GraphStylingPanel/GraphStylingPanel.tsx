import React, { FunctionComponent, useState } from "react";
// import { useReact } from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import { GraphStyleComponentF } from "../../Graph/GraphStyleComponentF/GraphStyleComponent";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";
// import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";

interface GraphStylingProps {
  explorer: Explorer;
  closePanel: () => void;
  config: ViewModels.IGraphConfigUiData;
  openNotificationConsole: () => void;
}

export const GraphStylingPanel: FunctionComponent<GraphStylingProps> = ({
  explorer,
  closePanel,
  config,
  openNotificationConsole,
}: GraphStylingProps): JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const buttonLabel = "Ok";
  // const [graphConfigUIData, setGraphConfigUIData] = useState({
  //   showNeighborType: config.showNeighborType,
  //   nodeProperties: config.nodeProperties,
  //   nodePropertiesWithNone: config.nodePropertiesWithNone,
  //   nodeCaptionChoice: config.nodeCaptionChoice,
  //   nodeColorKeyChoice: config.nodeColorKeyChoice,
  //   nodeIconChoice: config.nodeIconChoice,
  //   nodeIconSet: config.nodeIconSet,
  // });

  // const [formError, setFormError] = useState<string>();
  // const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  // const [isExecuting, setIsExecuting] = useState<boolean>(false);
  // const [firstFieldHasFocus, setFirstFieldHasFocus] = useState(true);

  // const genericPaneProps: GenericRightPaneProps = {
  //   container: explorer,
  //   formError: undefined,
  //   formErrorDetail: undefined,
  //   id: "graphStylingPane",
  //   isExecuting: undefined,
  //   title: "Graph Styling",
  //   submitButtonText: "OK",
  //   onClose: () => closePanel(),
  //   onSubmit: undefined,
  // };

  return (
    <form className="panelFormWrapper">
      {errorMessage && (
        <PanelInfoErrorComponent
          message={errorMessage}
          messageType="error"
          showErrorDetails={showErrorDetails}
          openNotificationConsole={openNotificationConsole}
        />
      )}
      <div className="panelMainContent">
        <GraphStyleComponentF config={config}></GraphStyleComponentF>
      </div>
      <PanelFooterComponent buttonLabel={buttonLabel} />
      {isLoading && <PanelLoadingScreen />}
    </form>
    // <GenericRightPaneComponent {...genericPaneProps}>
    //   <div className="panelMainContent">
    //     <GraphStyleComponentF config={config}></GraphStyleComponentF>
    //   </div>
    // </GenericRightPaneComponent>
  );
};
