import { ChoiceGroup, Dropdown, IChoiceGroupOption, IDropdownStyles, Stack, TextField } from "office-ui-fabric-react";
import React, { FunctionComponent } from "react";
import { IGraphConfigUiData, NeighborType } from "../../../Contracts/ViewModels";

interface GraphStyleProps {
  config: IGraphConfigUiData;
  // firstFieldHasFocus: boolean;
}

export const GraphStyleComponentF: FunctionComponent<GraphStyleProps> = ({
  config
  // firstFieldHasFocus,
}: GraphStyleProps): JSX.Element => {
  // const [firstFieldHasFocusState, setFirstFieldHasFocus] = useState(firstFieldHasFocus);

  const nodePropertiesOptions = config.nodeProperties.map((nodeProperty) => ({
    key: nodeProperty,
    text: nodeProperty,
  }));

  // const nodePropertiesOptions = [
  //   { key: "1", text: "Test1" },
  //   { key: "2", text: "Test2" },
  //   { key: "3", text: "Test3" },
  // ];

  const nodePropertiesWithNoneOptions = config.nodePropertiesWithNone.map((nodePropertyWithNone) => ({
    key: nodePropertyWithNone,
    text: nodePropertyWithNone,
  }));

  // const nodePropertiesWithNoneOptions = [
  //   { key: "1", text: "Node1" },
  //   { key: "2", text: "Node2" },
  //   { key: "3", text: "Node2" },
  // ];

  const showNeighborTypeOptions: IChoiceGroupOption[] = [
    { key: NeighborType.BOTH.toString(), text: "All neighbors" },
    { key: NeighborType.SOURCES_ONLY.toString(), text: "Sources" },
    { key: NeighborType.TARGETS_ONLY.toString(), text: "Targets" },
  ];

  const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { height: 32, marginRight: 10 } };
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

  return (
    <Stack>
      <div id="graphStyle" className="graphStyle">
        <div className="seconddivpadding">
          <Dropdown label="Show vertex (node) as" options={nodePropertiesOptions} required styles={dropdownStyles} />
        </div>
        <div className="seconddivpadding">
          <Dropdown
            label="Map this property to node color"
            options={nodePropertiesWithNoneOptions}
            required
            styles={dropdownStyles}
          />
        </div>
        <div className="seconddivpadding">
          <Stack horizontal>
            <Dropdown
              label="Map this property to node icon"
              options={nodePropertiesWithNoneOptions}
              required
              styles={dropdownStyles}
            />
            <Stack.Item align="end">
              <TextField
                // value={nodeIconSet}
                // label=" "
                placeholder="Icon set: blank for collection id"
                inputClassName="nodeIconSet"
                autoComplete="off"
              />
            </Stack.Item>
          </Stack>
        </div>
        <p className="seconddivpadding">Show</p>

        <ChoiceGroup
          styles={choiceButtonStyles}
          options={showNeighborTypeOptions}
          onChange={() => config.setValues()}
        />
      </div>
    </Stack>
  );
};
