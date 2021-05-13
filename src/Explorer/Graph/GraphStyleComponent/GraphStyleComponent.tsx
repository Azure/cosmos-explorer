import { ChoiceGroup, Dropdown, IChoiceGroupOption, IDropdownOption, IDropdownStyles, Stack } from "@fluentui/react";
import React, { FunctionComponent, useEffect, useState } from "react";
import { IGraphConfigUiData, NeighborType } from "../../../Contracts/ViewModels";
import { IGraphConfig } from "../../Tabs/GraphTab";
const IGraphConfigType = {
  NODE_CAPTION: "NODE_CAPTION",
  NODE_COLOR: "NODE_COLOR",
  NODE_ICON: "NODE_ICON",
  SHOW_NEIGHBOR_TYPE: "SHOW_NEIGHBOR_TYPE",
};
export interface GraphStyleProps {
  igraphConfig: IGraphConfig;
  igraphConfigUiData: IGraphConfigUiData;
  getValues: (igraphConfig?: IGraphConfig) => void;
}

export const GraphStyleComponent: FunctionComponent<GraphStyleProps> = ({
  igraphConfig,
  igraphConfigUiData,
  getValues,
}: GraphStyleProps): JSX.Element => {
  const [igraphConfigState, setIGraphConfig] = useState<IGraphConfig>(igraphConfig);
  const [selected, setSelected] = useState<boolean>(false);

  const nodePropertiesOptions = igraphConfigUiData.nodeProperties.map((nodeProperty) => ({
    key: nodeProperty,
    text: nodeProperty,
  }));

  const nodePropertiesWithNoneOptions = igraphConfigUiData.nodePropertiesWithNone.map((nodePropertyWithNone) => ({
    key: nodePropertyWithNone,
    text: nodePropertyWithNone,
  }));

  const showNeighborTypeOptions: IChoiceGroupOption[] = [
    { key: NeighborType.BOTH.toString(), text: "All neighbors" },
    { key: NeighborType.SOURCES_ONLY.toString(), text: "Sources" },
    { key: NeighborType.TARGETS_ONLY.toString(), text: "Targets" },
  ];

  const dropdownStyles: Partial<IDropdownStyles> = {
    dropdown: { height: 32, marginRight: 10 },
  };
  const choiceButtonStyles = {
    flexContainer: [
      {
        selectors: {
          ".ms-ChoiceField-wrapper label": {
            fontSize: 14,
            paddingTop: 0,
          },
        },
      },
    ],
  };

  useEffect(() => {
    if (selected) {
      getValues(igraphConfigState);
    }
    //eslint-disable-next-line
  }, [igraphConfigState]);

  const handleOnChange = (val: string, igraphConfigType: string) => {
    switch (igraphConfigType) {
      case IGraphConfigType.NODE_CAPTION:
        setSelected(true);
        setIGraphConfig({
          ...igraphConfigState,
          nodeCaption: val,
        });
        break;
      case IGraphConfigType.NODE_COLOR:
        setSelected(true);
        setIGraphConfig({
          ...igraphConfigState,
          nodeColorKey: val,
        });
        break;
      case IGraphConfigType.SHOW_NEIGHBOR_TYPE:
        setSelected(true);
        setIGraphConfig({
          ...igraphConfigState,
          showNeighborType: parseInt(val),
        });
        break;
    }
  };
  return (
    <Stack>
      <div id="graphStyle" className="graphStyle">
        <div className="seconddivpadding">
          <Dropdown
            label="Show vertex (node) as"
            options={nodePropertiesOptions}
            required
            selectedKey={igraphConfigState.nodeCaption}
            styles={dropdownStyles}
            onChange={(_, options: IDropdownOption) =>
              handleOnChange(options.key.toString(), IGraphConfigType.NODE_CAPTION)
            }
          />
        </div>
        <div className="seconddivpadding">
          <Dropdown
            label="Map this property to node color"
            options={nodePropertiesWithNoneOptions}
            required
            selectedKey={igraphConfigState.nodeColorKey}
            styles={dropdownStyles}
            onChange={(_, options: IDropdownOption) =>
              handleOnChange(options.key.toString(), IGraphConfigType.NODE_COLOR)
            }
          />
        </div>

        <div className="seconddivpadding">
          <ChoiceGroup
            label="Show"
            styles={choiceButtonStyles}
            options={showNeighborTypeOptions}
            selectedKey={igraphConfigState.showNeighborType.toString()}
            onChange={(_, options: IChoiceGroupOption) =>
              handleOnChange(options.key.toString(), IGraphConfigType.SHOW_NEIGHBOR_TYPE)
            }
          />
        </div>
      </div>
    </Stack>
  );
};
