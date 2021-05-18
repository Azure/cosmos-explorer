import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../../Contracts/ViewModels";
import { IGraphConfig } from "../../Tabs/GraphTab";
import { GraphAccessor, GraphExplorer } from "./GraphExplorer";
interface Parameter {
  onIsNewVertexDisabledChange: (isEnabled: boolean) => void;
  onGraphAccessorCreated: (instance: GraphAccessor) => void;
  onIsFilterQueryLoading: (isFilterQueryLoading: boolean) => void;
  onIsValidQuery: (isValidQuery: boolean) => void;
  onIsPropertyEditing: (isEditing: boolean) => void;
  onIsGraphDisplayed: (isDisplayed: boolean) => void;
  onResetDefaultGraphConfigValues: () => void;

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
  setIConfigUiData?: (data: string[]) => void;
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
  }

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
        igraphConfigUiData={this.params.igraphConfigUiData}
        igraphConfig={this.params.igraphConfig}
        setIConfigUiData={this.params.setIConfigUiData}
      />
    );
  }
}
