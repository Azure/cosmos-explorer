import React, { FunctionComponent } from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { GraphStyleComponent } from "../../Graph/GraphStyleComponent/GraphStyleComponent";
import { IGraphConfig } from "../../Tabs/GraphTab";
import { PanelFooterComponent } from "../PanelFooterComponent";
interface GraphStylingProps {
  closePanel: () => void;
  igraphConfigUiData: ViewModels.IGraphConfigUiData;
  igraphConfig: IGraphConfig;
  getValues: (igraphConfig?: IGraphConfig) => void;
}

export const GraphStylingPanel: FunctionComponent<GraphStylingProps> = ({
  closePanel,
  igraphConfigUiData,
  igraphConfig,
  getValues,
}: GraphStylingProps): JSX.Element => {
  const buttonLabel = "Ok";

  const submit = () => {
    closePanel();
  };

  return (
    <form className="panelFormWrapper" onSubmit={submit}>
      <div className="panelMainContent">
        <GraphStyleComponent
          igraphConfigUiData={igraphConfigUiData}
          igraphConfig={igraphConfig}
          getValues={getValues}
        ></GraphStyleComponent>
      </div>
      <PanelFooterComponent buttonLabel={buttonLabel} />
    </form>
  );
};
