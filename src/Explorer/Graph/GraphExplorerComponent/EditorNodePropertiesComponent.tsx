/**
 * Graph React component
 * Read-only properties
 */

import * as React from "react";
import AddIcon from "../../../../images/Add-property.svg";
import DeleteIcon from "../../../../images/delete.svg";
import * as ViewModels from "../../../Contracts/ViewModels";
import { AccessibleElement } from "../../Controls/AccessibleElement/AccessibleElement";
import { EditedProperties } from "./GraphExplorer";
import { ReadOnlyNodePropertiesComponent } from "./ReadOnlyNodePropertiesComponent";

export interface EditorNodePropertiesComponentProps {
  editedProperties: EditedProperties;
  onUpdateProperties: (editedProperties: EditedProperties) => void;
}

export class EditorNodePropertiesComponent extends React.Component<EditorNodePropertiesComponentProps> {
  public static readonly VERTEX_PROPERTY_TYPES = ["string", "number", "boolean" /* 'null' */]; // TODO Enable null when fully supported by backend
  private static readonly DEFAULT_PROPERTY_TYPE = "string";

  public render(): JSX.Element {
    return (
      <table className="propertyTable">
        <tbody>
          {this.getReadOnlyPropertiesFragment()}
          {this.getEditedPropertiesFragment()}
          {this.getAddedPropertiesFragment()}
          <tr>
            <td colSpan={3} className="rightPaneAddPropertyBtnPadding">
              <AccessibleElement
                className="rightPaneAddPropertyBtn rightPaneBtns"
                as="span"
                aria-label="Add a property"
                onActivated={() => this.addProperty()}
              >
                <img src={AddIcon} alt="Add" /> Add Property
              </AccessibleElement>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  private removeExistingProperty(key: string): void {
    const editedProperties = this.props.editedProperties;
    // search for it
    for (let i = 0; i < editedProperties.existingProperties.length; i++) {
      const ip = editedProperties.existingProperties[i];
      if (ip.key === key) {
        editedProperties.existingProperties.splice(i, 1);
        editedProperties.droppedKeys.push(key);
        break;
      }
    }
    this.props.onUpdateProperties(editedProperties);
  }

  private removeAddedProperty(index: number): void {
    const editedProperties = this.props.editedProperties;
    const ap = editedProperties.addedProperties;
    ap.splice(index, 1);

    this.props.onUpdateProperties(editedProperties);
  }

  private addProperty(): void {
    const editedProperties = this.props.editedProperties;
    const ap = editedProperties.addedProperties;
    ap.push({ key: "", values: [{ value: "", type: EditorNodePropertiesComponent.DEFAULT_PROPERTY_TYPE }] });
    this.props.onUpdateProperties(editedProperties);
  }

  private getReadOnlyPropertiesFragment(): JSX.Element {
    return (
      <React.Fragment>
        {this.props.editedProperties.readOnlyProperties.map((nodeProp: ViewModels.InputProperty) =>
          ReadOnlyNodePropertiesComponent.renderReadOnlyPropertyKeyPair(
            nodeProp.key,
            nodeProp.values.map((val) => val.value),
          ),
        )}
      </React.Fragment>
    );
  }

  private getEditedPropertiesFragment(): JSX.Element {
    return (
      <React.Fragment>
        {this.props.editedProperties.existingProperties.map((nodeProp: ViewModels.InputProperty) => {
          // Check multiple values
          if (nodeProp.values && Array.isArray(nodeProp.values) && nodeProp.values.length === 1) {
            return this.renderEditableProperty(nodeProp.key, nodeProp.values[0]);
          } else {
            return this.renderNonEditableProperty(nodeProp);
          }
        })}
      </React.Fragment>
    );
  }

  private renderEditableProperty(key: string, singleValue: ViewModels.InputPropertyValue): JSX.Element {
    return (
      <tr key={key}>
        <td className="labelCol">{key}</td>
        <td className="valueCol">
          {singleValue.type !== "null" && (
            <input
              className="edgeInput"
              type="text"
              value={singleValue.value.toString()}
              placeholder="Value"
              onChange={(e) => {
                singleValue.value = e.target.value;
                this.props.onUpdateProperties(this.props.editedProperties);
              }}
            />
          )}
        </td>
        <td>
          <select
            className="typeSelect"
            value={singleValue.type}
            onChange={(e) => {
              singleValue.type = e.target.value as ViewModels.InputPropertyValueTypeString;
              if (singleValue.type === "null") {
                singleValue.value = undefined;
              }
              this.props.onUpdateProperties(this.props.editedProperties);
            }}
            required
          >
            {EditorNodePropertiesComponent.VERTEX_PROPERTY_TYPES.map((type: string) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </td>
        <td className="actionCol">
          <AccessibleElement
            className="rightPaneTrashIcon rightPaneBtns"
            as="span"
            aria-label="Delete property"
            onActivated={() => this.removeExistingProperty(key)}
          >
            <img src={DeleteIcon} alt="Delete" />
          </AccessibleElement>
        </td>
      </tr>
    );
  }

  private renderNonEditableProperty(nodeProp: ViewModels.InputProperty): JSX.Element {
    return (
      <tr key={nodeProp.key}>
        <td className="labelCol propertyId">{nodeProp.key}</td>
        <td>
          {nodeProp.values.map((value) => ReadOnlyNodePropertiesComponent.renderSinglePropertyValue(value.value))}
        </td>
        <td />
        <td className="actionCol">
          <AccessibleElement
            className="rightPaneTrashIcon rightPaneBtns"
            as="span"
            aria-label="Remove existing property"
            onActivated={() => this.removeExistingProperty(nodeProp.key)}
          >
            <img src={DeleteIcon} alt="Delete" />
          </AccessibleElement>
        </td>
      </tr>
    );
  }

  /**
   * For now, this assumes that we add only one value to a property
   */
  private getAddedPropertiesFragment(): JSX.Element {
    return (
      <React.Fragment>
        {this.props.editedProperties.addedProperties.map((addedProperty: ViewModels.InputProperty, index: number) => {
          const firstValue = addedProperty.values[0];
          return (
            <tr key={index}>
              <td className="labelCol">
                <input
                  type="text"
                  value={addedProperty.key}
                  placeholder="Key"
                  onChange={(e) => {
                    addedProperty.key = e.target.value;
                    this.props.onUpdateProperties(this.props.editedProperties);
                  }}
                />
              </td>
              <td className="valueCol">
                {firstValue.type !== "null" && (
                  <input
                    className="edgeInput"
                    type="text"
                    value={firstValue.value.toString()}
                    placeholder="Value"
                    onChange={(e) => {
                      firstValue.value = e.target.value;
                      if (firstValue.type === "null") {
                        firstValue.value = undefined;
                      }
                      this.props.onUpdateProperties(this.props.editedProperties);
                    }}
                  />
                )}
              </td>
              <td>
                <select
                  className="typeSelect"
                  value={firstValue.type}
                  onChange={(e) => {
                    firstValue.type = e.target.value as ViewModels.InputPropertyValueTypeString;
                    this.props.onUpdateProperties(this.props.editedProperties);
                  }}
                  required
                  aria-label="Select Type"
                >
                  {EditorNodePropertiesComponent.VERTEX_PROPERTY_TYPES.map((type: string) => (
                    <option value={type} key={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </td>
              <td className="actionCol">
                <AccessibleElement
                  className="rightPaneTrashIcon rightPaneBtns"
                  as="span"
                  aria-label="Remove property"
                  onActivated={() => this.removeAddedProperty(index)}
                >
                  <img src={DeleteIcon} alt="Delete" />
                </AccessibleElement>
              </td>
            </tr>
          );
        })}
      </React.Fragment>
    );
  }
}
