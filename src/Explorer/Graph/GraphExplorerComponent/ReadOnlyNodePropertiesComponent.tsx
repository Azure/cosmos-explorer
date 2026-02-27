/**
 * Graph React component
 * Read-only properties
 */

import * as React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { GraphHighlightedNodeData } from "./GraphExplorer";

export interface ReadOnlyNodePropertiesComponentProps {
  node: GraphHighlightedNodeData;
}

export class ReadOnlyNodePropertiesComponent extends React.Component<ReadOnlyNodePropertiesComponentProps> {
  public render(): JSX.Element {
    return (
      <table className="roPropertyTable propertyTable">
        <tbody>
          <tr>
            <td className="labelCol">id</td>
            <td>
              <span className="vertexId">{this.props.node.id}</span>
            </td>
          </tr>
          <tr>
            <td className="labelCol">label</td>
            <td>
              <span className="vertexLabel">{this.props.node.label}</span>
            </td>
          </tr>
          {Object.keys(this.props.node.properties).map((_propkey) => {
            const gremlinValues = this.props.node.properties[_propkey];
            return ReadOnlyNodePropertiesComponent.renderReadOnlyPropertyKeyPair(_propkey, gremlinValues);
          })}
        </tbody>
      </table>
    );
  }

  public static renderReadOnlyPropertyKeyPair(
    key: string,
    propertyValues: ViewModels.GremlinPropertyValueType[],
  ): JSX.Element {
    const renderedValues = propertyValues.map((value) =>
      ReadOnlyNodePropertiesComponent.renderSinglePropertyValue(value),
    );
    const stringifiedValues = propertyValues
      .map((value) => ReadOnlyNodePropertiesComponent.singlePropertyValueToString(value))
      .join(", ");
    return (
      <tr key={key}>
        <td className="labelCol propertyId" title={key}>
          {key}
        </td>
        <td className="valueCol" title={stringifiedValues}>
          {renderedValues}
        </td>
      </tr>
    );
  }

  public static singlePropertyValueToString(value: ViewModels.GremlinPropertyValueType): string {
    if (typeof value === "undefined") {
      return "undefined";
    } else {
      return value.toString();
    }
  }

  public static renderSinglePropertyValue(value: ViewModels.GremlinPropertyValueType): JSX.Element {
    let singlePropValue = value;
    const className = "propertyValue";
    if (typeof singlePropValue === "undefined") {
      singlePropValue = "undefined";
    } else {
      singlePropValue = value.toString();
    }
    return (
      <div key={singlePropValue} className={className}>
        {singlePropValue}
      </div>
    );
  }
}
