import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../../Contracts/ViewModels";
import { GraphConfig, IGraphConfig } from "../../Tabs/GraphTab";
import { GraphAccessor, GraphExplorer } from "./GraphExplorer";
interface Parameter {
  onIsNewVertexDisabledChange: (isEnabled: boolean) => void;
  onGraphAccessorCreated: (instance: GraphAccessor) => void;
  onIsFilterQueryLoading: (isFilterQueryLoading: boolean) => void;
  onIsValidQuery: (isValidQuery: boolean) => void;
  onIsPropertyEditing: (isEditing: boolean) => void;
  onIsGraphDisplayed: (isDisplayed: boolean) => void;
  onResetDefaultGraphConfigValues: () => void;

  graphConfigUiData: ViewModels.GraphConfigUiData;
  graphConfig?: GraphConfig;

  collectionPartitionKeyProperty: string;
  graphBackendEndpoint: string;
  databaseId: string;
  collectionId: string;
  masterKey: string;

  onLoadStartKey: number;
  onLoadStartKeyChange: (newKey: number) => void;
  resourceId: string;

  igraphConfigUiData: ViewModels.IGraphConfigUiData;
  igraphConfig: IGraphConfig;
}

interface IGraphExplorerProps {
  isChanged: boolean;
}

interface IGraphExplorerStates {
  isChangedState: boolean;
}

export interface GraphExplorerAdapter
  extends ReactAdapter,
    React.Component<IGraphExplorerProps, IGraphExplorerStates> {}
export class GraphExplorerAdapter implements ReactAdapter {
  public params: Parameter;
  public parameters = {};
  public isNewVertexDisabled: boolean;

  public constructor(params: Parameter, props?: IGraphExplorerProps) {
    this.params = params;
    this.state = {
      isChangedState: this.props && this.props.isChanged,
    };
  }

  // callGraphExplorer = (isChanged: boolean) => {
  //   console.log("GraphExplorerAdapter > callGraphExplorer > ", isChanged);
  // };

  public renderComponent(): JSX.Element {
    return (
      <GraphExplorer
        onIsNewVertexDisabledChange={this.params.onIsNewVertexDisabledChange}
        onGraphAccessorCreated={this.params.onGraphAccessorCreated}
        onIsFilterQueryLoadingChange={this.params.onIsFilterQueryLoading}
        onIsValidQueryChange={this.params.onIsValidQuery}
        onIsPropertyEditing={this.params.onIsPropertyEditing}
        onIsGraphDisplayed={this.params.onIsGraphDisplayed}
        onResetDefaultGraphConfigValues={this.params.onResetDefaultGraphConfigValues}
        collectionPartitionKeyProperty={this.params.collectionPartitionKeyProperty}
        graphBackendEndpoint={this.params.graphBackendEndpoint}
        databaseId={this.params.databaseId}
        collectionId={this.params.collectionId}
        masterKey={this.params.masterKey}
        onLoadStartKey={this.params.onLoadStartKey}
        onLoadStartKeyChange={this.params.onLoadStartKeyChange}
        resourceId={this.params.resourceId}
        /* TODO Figure out how to make this Knockout-free */
        graphConfigUiData={this.params.graphConfigUiData}
        graphConfig={this.params.graphConfig}
        igraphConfigUiData={this.params.igraphConfigUiData}
        igraphCofig={this.params.igraphConfig}
        isChanged={this.props && this.props.isChanged}
      />
    );
  }
}
