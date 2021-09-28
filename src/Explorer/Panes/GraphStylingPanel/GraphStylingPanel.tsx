import React, { FunctionComponent } from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { GraphStyleComponent } from "../../Graph/GraphStyleComponent/GraphStyleComponent";
import { IGraphConfig } from "../../Tabs/GraphTab";
import { PanelFooterComponent } from "../PanelFooterComponent";
interface GraphStylingProps {
  igraphConfigUiData: ViewModels.IGraphConfigUiData;
  igraphConfig: IGraphConfig;
  getValues: (igraphConfig?: IGraphConfig) => void;
}

export const GraphStylingPanel: FunctionComponent<GraphStylingProps> = ({
  igraphConfigUiData,
  igraphConfig,
  getValues,
}: GraphStylingProps): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);

  const buttonLabel = "Ok";

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeSidePanel();
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
