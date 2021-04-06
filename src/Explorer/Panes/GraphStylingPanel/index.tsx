import React, { FunctionComponent, useState } from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import { GraphStyleComponentF } from "../../Graph/GraphStyleComponentF";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";

interface GraphStylingProps {
  explorer: Explorer;
  closePanel: () => void;
  config: ViewModels.IGraphConfigUiData;
}

export const GraphStylingPanel: FunctionComponent<GraphStylingProps> = ({
  explorer,
  closePanel,
  config,
}): JSX.Element => {
  const [graphConfigUIData, setGraphConfigUIData] = useState({
    showNeighborType: config.showNeighborType,
    nodeProperties: config.nodeProperties,
    nodePropertiesWithNone: config.nodePropertiesWithNone,
    nodeCaptionChoice: config.nodeCaptionChoice,
    nodeColorKeyChoice: config.nodeColorKeyChoice,
    nodeIconChoice: config.nodeIconChoice,
    nodeIconSet: config.nodeIconSet,
  });

  const [formError, setFormError] = useState<string>();
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [firstFieldHasFocus, setFirstFieldHasFocus] = useState(true);

  const genericPaneProps: GenericRightPaneProps = {
    container: explorer,
    formError: formError,
    formErrorDetail: formErrorsDetails,
    id: "graphStylingPane",
    isExecuting: isExecuting,
    title: "Graph Styling",
    submitButtonText: "OK",
    onClose: () => closePanel(),
    onSubmit: undefined,
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelMainContent">
        <GraphStyleComponentF config={config}></GraphStyleComponentF>
      </div>
    </GenericRightPaneComponent>
  );
};
