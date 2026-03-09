import { Dropdown, IDropdownOption, Stack, TextField } from "@fluentui/react";
import React, { FunctionComponent, useRef, useState } from "react";
import AddIcon from "../../../../images/Add-property.svg";
import DeleteIcon from "../../../../images/delete.svg";
import { NormalizedEventKey } from "../../../Common/Constants";
import { GremlinPropertyValueType, InputPropertyValueTypeString, NewVertexData } from "../../../Contracts/ViewModels";
import { EditorNodePropertiesComponent } from "../GraphExplorerComponent/EditorNodePropertiesComponent";
import "./NewVertexComponent.less";
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
  const [newVertexData, setNewVertexData] = useState<NewVertexData>(
    newVertexDataProp || {
      label: "",
      properties: [
        {
          key: partitionKeyPropertyProp,
          values: [{ value: "", type: DEFAULT_PROPERTY_TYPE }],
        },
      ],
    },
  );

  const propertyTypes: string[] = EditorNodePropertiesComponent.VERTEX_PROPERTY_TYPES;
  const input = useRef(undefined);

  const onAddNewProperty = () => {
    addNewVertexProperty();
    setTimeout(() => {
      input.current.focus();
    }, 100);
  };

  const onAddNewPropertyKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      onAddNewProperty();
      event.stopPropagation();
    }
  };

  const addNewVertexProperty = () => {
    let key: string;
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
    onChangeProp(newVertexData);
  };

  const removeNewVertexProperty = (event?: React.MouseEvent<HTMLDivElement>, index?: number) => {
    const ap = newVertexData.properties;
    ap.splice(index, 1);
    setNewVertexData((prevData) => ({
      ...prevData,
      properties: ap,
    }));
    onChangeProp(newVertexData);
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
    onChangeProp(newVertexData);
  };

  const onKeyChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newState = { ...newVertexData };
    newState.properties[index].key = event.target.value;
    setNewVertexData(newState);
    onChangeProp(newVertexData);
  };

  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newState = { ...newVertexData };
    newState.properties[index].values[0].value = event.target.value as GremlinPropertyValueType;
    setNewVertexData(newState);
    onChangeProp(newVertexData);
  };

  const onTypeChange = (option: string, index: number) => {
    const newState = { ...newVertexData };
    if (newState.properties[index]) {
      newState.properties[index].values[0].type = option as InputPropertyValueTypeString;
      setNewVertexData(newState);
      onChangeProp(newVertexData);
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
              autoFocus
            />
            <div className="actionCol"></div>
          </div>
          {newVertexData.properties.map((data, index) => {
            return (
              <div key={index} className="newVertexFormRow">
                <div className="labelCol">
                  <TextField
                    className="edgeInput"
                    label={index === 0 && "Key"}
                    type="text"
                    id={`propertyKeyNewVertexPane${index + 1}`}
                    componentRef={input}
                    required
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
                    label={index === 0 && "Value"}
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
                    role="combobox"
                    label={index === 0 && "Type"}
                    ariaLabel="Type"
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
                    className={`rightPaneTrashIcon rightPaneBtns ${index === 0 && "customTrashIcon"}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`Delete ${data.key}`}
                    onClick={(event: React.MouseEvent<HTMLDivElement>) => removeNewVertexProperty(event, index)}
                    onKeyPress={(event: React.KeyboardEvent<HTMLDivElement>) =>
                      removeNewVertexPropertyKeyPress(event, index)
                    }
                  >
                    <img
                      aria-label="hidden"
                      className="refreshcol rightPaneTrashIconImg"
                      src={DeleteIcon}
                      alt="Remove property"
                    />
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
                aria-label="Add property"
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
