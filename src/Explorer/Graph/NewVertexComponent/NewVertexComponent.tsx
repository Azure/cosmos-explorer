import { Dropdown, IDropdownOption, Stack, TextField } from "office-ui-fabric-react";
import React, { FunctionComponent, useEffect, useState } from "react";
import AddIcon from "../../../../images/Add-property.svg";
import DeleteIcon from "../../../../images/delete.svg";
import { NormalizedEventKey } from "../../../Common/Constants";
import { GremlinPropertyValueType, InputPropertyValueTypeString, NewVertexData } from "../../../Contracts/ViewModels";
import { EditorNodePropertiesComponent } from "../GraphExplorerComponent/EditorNodePropertiesComponent";

export interface INewVertexComponentProps {
  newVertexDataProp: NewVertexData;
  partitionKeyPropertyProp: string;
  onChangeProp: (labelData: NewVertexData) => void;
}

export const NewVertexComponent: FunctionComponent<INewVertexComponentProps> = ({
  newVertexDataProp,
  partitionKeyPropertyProp,
  onChangeProp,
}: INewVertexComponentProps): JSX.Element => {
  const DEFAULT_PROPERTY_TYPE = "string";
  const [newVertexData, setNewVertexData] = useState<NewVertexData>(newVertexDataProp || { label: "", properties: [] });
  const propertyTypes: string[] = EditorNodePropertiesComponent.VERTEX_PROPERTY_TYPES;

  useEffect(() => {
    addNewVertexProperty(partitionKeyPropertyProp);
    //eslint-disable-next-line
  }, []);
  useEffect(() => {
    onChangeProp(newVertexData);
  });

  const onAddNewProperty = () => {
    addNewVertexProperty();
    document.getElementById("propertyKeyNewVertexPane").focus();
  };

  const onAddNewPropertyKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      onAddNewProperty();
      event.stopPropagation();
    }
  };

  const addNewVertexProperty = (key?: string) => {
    const ap = newVertexData.properties;
    if (ap.length === 0) {
      key = partitionKeyPropertyProp;
    }
    ap.push({
      key: key || "",
      values: [{ value: "", type: DEFAULT_PROPERTY_TYPE }],
    });
    setNewVertexData((prevData) => ({
      ...prevData,
      properties: ap,
    }));
  };

  const removeNewVertexProperty = (event?: React.MouseEvent<HTMLDivElement>, index?: number) => {
    const ap = newVertexData.properties;
    ap.splice(index, 1);
    setNewVertexData((prevData) => ({
      ...prevData,
      properties: ap,
    }));
    document.getElementById("addProperyNewVertexBtn").focus();
  };

  const removeNewVertexPropertyKeyPress = (event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      removeNewVertexProperty(undefined, index);
      event.stopPropagation();
    }
  };

  const onLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewVertexData((prevData) => ({
      ...prevData,
      label: event.target.value,
    }));
  };

  const onKeyChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newState = { ...newVertexData };
    newState.properties[index].key = event.target.value;
    setNewVertexData(newState);
  };

  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newState = { ...newVertexData };
    newState.properties[index].values[0].value = event.target.value as GremlinPropertyValueType;
    setNewVertexData(newState);
  };

  const onTypeChange = (option: string, index: number) => {
    const newState = { ...newVertexData };
    if (newState.properties[index]) {
      newState.properties[index].values[0].type = option as InputPropertyValueTypeString;
      setNewVertexData(newState);
    }
  };

  return (
    <Stack>
      <div className="newVertexComponent">
        <div className="newVertexForm">
          <div className="newVertexFormRow">
            <TextField
              label="Label"
              className="edgeInput"
              type="text"
              ariaLabel="Enter vertex label"
              role="textbox"
              tabIndex={0}
              placeholder="Enter vertex label"
              autoComplete="off"
              id="VertexLabel"
              value={newVertexData.label}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                onLabelChange(event);
              }}
            />
            <div className="actionCol"></div>
          </div>
          {newVertexData.properties.map((data, index) => {
            return (
              <div key={index} className="newVertexFormRow">
                <div className="labelCol">
                  <TextField
                    className="edgeInput"
                    type="text"
                    id="propertyKeyNewVertexPane"
                    placeholder="Key"
                    autoComplete="off"
                    aria-label={`Enter value for propery ${index + 1}`}
                    value={data.key}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onKeyChange(event, index)}
                  />
                </div>
                <div className="valueCol">
                  <TextField
                    className="edgeInput"
                    type="text"
                    placeholder="Value"
                    autoComplete="off"
                    aria-label={`Enter value for propery ${index + 1}`}
                    value={data.values[0].value.toString()}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onValueChange(event, index)}
                  />
                </div>
                <div>
                  <Dropdown
                    role="listbox"
                    placeholder="Select an option"
                    defaultSelectedKey={data.values[0].type}
                    style={{ width: 100 }}
                    options={propertyTypes.map((type) => ({
                      key: type,
                      text: type,
                    }))}
                    onChange={(_, options: IDropdownOption) => onTypeChange(options.key.toString(), index)}
                  />
                </div>
                <div className="actionCol">
                  <div
                    className="rightPaneTrashIcon rightPaneBtns"
                    tabIndex={0}
                    role="button"
                    onClick={(event: React.MouseEvent<HTMLDivElement>) => removeNewVertexProperty(event, index)}
                    onKeyPress={(event: React.KeyboardEvent<HTMLDivElement>) =>
                      removeNewVertexPropertyKeyPress(event, index)
                    }
                  >
                    <img className="refreshcol rightPaneTrashIconImg" src={DeleteIcon} alt="Remove property" />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="newVertexFormRow">
            <span className="rightPaneAddPropertyBtnPadding">
              <span
                className="rightPaneAddPropertyBtn rightPaneBtns"
                id="addProperyNewVertexBtn"
                tabIndex={0}
                role="button"
                onClick={onAddNewProperty}
                onKeyPress={(event: React.KeyboardEvent<HTMLSpanElement>) => onAddNewPropertyKeyPress(event)}
              >
                <img className="refreshcol rightPaneAddPropertyImg" src={AddIcon} alt="Add property" /> Add Property
              </span>
            </span>
          </div>
        </div>
      </div>
    </Stack>
  );
};
