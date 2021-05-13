import * as ko from "knockout";
import React from "react";
import NewVertexIcon from "../../../images/NewVertex.svg";
import StyleIcon from "../../../images/Style.svg";
import { DatabaseAccount } from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import {
  GraphAccessor,
  GraphExplorer,
  GraphExplorerError,
  GraphExplorerProps,
} from "../Graph/GraphExplorerComponent/GraphExplorer";
// import { GraphAccessor, GraphExplorer, GraphExplorerError } from "../Graph/GraphExplorerComponent/GraphExplorer";
// import { GraphExplorerAdapter } from "../Graph/GraphExplorerComponent/GraphExplorerAdapter";
import { ContextualPaneBase } from "../Panes/ContextualPaneBase";
import { GraphStylingPanel } from "../Panes/GraphStylingPanel/GraphStylingPanel";
import { NewVertexPanel } from "../Panes/NewVertexPanel/NewVertexPanel";
import TabsBase from "./TabsBase";
export interface GraphIconMap {
  [key: string]: { data: string; format: string };
}

export interface GraphConfig {
  nodeColor: ko.Observable<string>;
  nodeColorKey: ko.Observable<string>; // map property to node color. Takes precedence over nodeColor unless undefined
  linkColor: ko.Observable<string>;
  showNeighborType: ko.Observable<ViewModels.NeighborType>;
  nodeCaption: ko.Observable<string>;
  nodeSize: ko.Observable<number>;
  linkWidth: ko.Observable<number>;
  nodeIconKey: ko.Observable<string>;
  iconsMap: ko.Observable<GraphIconMap>;
}

export interface IGraphConfig {
  nodeColor: string;
  nodeColorKey: string;
  linkColor: string;
  showNeighborType: ViewModels.NeighborType;
  nodeCaption: string;
  nodeSize: number;
  linkWidth: number;
  nodeIconKey: string;
  iconsMap: GraphIconMap;
}

interface GraphTabOptions extends ViewModels.TabOptions {
  account: DatabaseAccount;
  masterKey: string;
  collectionId: string;
  databaseId: string;
  collectionPartitionKeyProperty: string;
}

// export default class GraphTab extends React.Component<GraphTabProps, GraphTabStates> {
export default class GraphTab extends TabsBase {
  // Graph default configuration
  public static readonly DEFAULT_NODE_CAPTION = "id";
  private static readonly LINK_COLOR = "#aaa";
  private static readonly NODE_SIZE = 10;
  private static readonly NODE_COLOR = "orange";
  private static readonly LINK_WIDTH = 1;
  private graphExplorerProps: GraphExplorerProps;
  private isNewVertexDisabled: ko.Observable<boolean>;
  private isPropertyEditing: ko.Observable<boolean>;
  private isGraphDisplayed: ko.Observable<boolean>;
  private graphAccessor: GraphAccessor;
  private igraphConfig: IGraphConfig;
  private igraphConfigUiData: ViewModels.IGraphConfigUiData;
  private isFilterQueryLoading: ko.Observable<boolean>;
  private isValidQuery: ko.Observable<boolean>;
  private collectionPartitionKeyProperty: string;
  private contextualPane: ContextualPaneBase;
  public graphExplorer: GraphExplorer;
  public options: GraphTabOptions;
  constructor(options: GraphTabOptions) {
    super(options);

    this.collectionPartitionKeyProperty = options.collectionPartitionKeyProperty;
    this.isNewVertexDisabled = ko.observable(false);
    this.isPropertyEditing = ko.observable(false);
    this.isGraphDisplayed = ko.observable(false);
    this.graphAccessor = undefined;
    this.igraphConfig = GraphTab.createIGraphConfig();
    this.igraphConfigUiData = GraphTab.createIGraphConfigUiData(this.igraphConfig);
    this.graphExplorerProps = {
      onGraphAccessorCreated: (instance: GraphAccessor): void => {
        this.graphAccessor = instance;
      },
      onIsNewVertexDisabledChange: (isDisabled: boolean): void => {
        this.isNewVertexDisabled(isDisabled);
        this.updateNavbarWithTabsButtons();
      },
      onIsPropertyEditing: (isEditing: boolean) => {
        this.isPropertyEditing(isEditing);
        this.updateNavbarWithTabsButtons();
      },
      onIsGraphDisplayed: (isDisplayed: boolean) => {
        this.isGraphDisplayed(isDisplayed);
        this.updateNavbarWithTabsButtons();
      },
      onResetDefaultGraphConfigValues: () => this.setDefaultIGraphConfigValues(),
      igraphConfig: this.igraphConfig,
      igraphConfigUiData: this.igraphConfigUiData,
      onIsFilterQueryLoadingChange: (isFilterQueryLoading: boolean): void =>
        this.isFilterQueryLoading(isFilterQueryLoading),
      onIsValidQueryChange: (isValidQuery: boolean): void => this.isValidQuery(isValidQuery),
      collectionPartitionKeyProperty: options.collectionPartitionKeyProperty,
      graphBackendEndpoint: GraphTab.getGremlinEndpoint(options.account),
      databaseId: options.databaseId,
      collectionId: options.collectionId,
      masterKey: options.masterKey,
      onLoadStartKey: options.onLoadStartKey,
      onLoadStartKeyChange: (onLoadStartKey: number): void => {
        if (onLoadStartKey === undefined) {
          this.onLoadStartKey = undefined;
        }
      },
      resourceId: options.account.id,
      setIConfigUiData: this.setIGraphConfigUiData,
    };

    this.isFilterQueryLoading = ko.observable(false);
    this.isValidQuery = ko.observable(true);
    // this.setCaption = this.setCaption.bind(this);
  }

  public static getGremlinEndpoint(account: DatabaseAccount): string {
    return account.properties.gremlinEndpoint
      ? GraphTab.sanitizeHost(account.properties.gremlinEndpoint)
      : `${account.name}.graphs.azure.com:443/`;
  }

  public render(): JSX.Element {
    return (
      <div className="graphExplorerContainer" role="tabpanel" id={this.tabId}>
        <GraphExplorer {...this.graphExplorerProps} />
      </div>
    );
  }

  public onTabClick(): void {
    super.onTabClick();
    this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Graph);
  }

  /**
   * Removing leading http|https and remove trailing /
   * @param url
   * @return
   */
  private static sanitizeHost(url: string): string {
    if (!url) {
      return url;
    }
    return url.replace(/^(http|https):\/\//, "").replace(/\/$/, "");
  }

  /* Command bar */
  private showNewVertexEditor(): void {
    this.collection.container.openSidePanel(
      "New Vertex",
      <NewVertexPanel
        explorer={this.collection.container}
        partitionKeyPropertyProp={this.collectionPartitionKeyProperty}
        openNotificationConsole={() => this.collection.container.expandConsole()}
        onSubmit={(
          result: ViewModels.NewVertexData,
          onError: (errorMessage: string) => void,
          onSuccess: () => void
        ): void => {
          this.graphAccessor.addVertex(result).then(
            () => {
              onSuccess();
              this.contextualPane.cancel();
            },
            (error: GraphExplorerError) => {
              onError(error.title);
            }
          );
        }}
      />
    );
  }
  public openStyling(): void {
    this.collection.container.openSidePanel(
      "Graph Style",
      <GraphStylingPanel
        closePanel={this.collection.container.closeSidePanel}
        igraphConfigUiData={this.igraphConfigUiData}
        igraphConfig={this.igraphConfig}
        getValues={(igraphConfig?: IGraphConfig): void => {
          this.igraphConfig = igraphConfig;
          this.graphAccessor.shareIGraphConfig(igraphConfig);
        }}
      />
    );
  }

  setIGraphConfigUiData = (val: string[]): void => {
    if (val.length > 0) {
      this.igraphConfigUiData = {
        showNeighborType: ViewModels.NeighborType.TARGETS_ONLY,
        nodeProperties: val,
        nodePropertiesWithNone: [GraphExplorer.NONE_CHOICE].concat(val),
        nodeCaptionChoice: this.igraphConfig.nodeCaption,
        nodeColorKeyChoice: "None",
        nodeIconChoice: "Node",
        nodeIconSet: "",
      };
    }
  };

  public static createIGraphConfig(): IGraphConfig {
    return {
      nodeColor: GraphTab.NODE_COLOR,
      nodeColorKey: "None",
      linkColor: GraphTab.LINK_COLOR,
      showNeighborType: ViewModels.NeighborType.TARGETS_ONLY,
      nodeCaption: GraphTab.DEFAULT_NODE_CAPTION,
      nodeSize: GraphTab.NODE_SIZE,
      linkWidth: GraphTab.LINK_WIDTH,
      nodeIconKey: undefined,
      iconsMap: {},
    };
  }

  public static createIGraphConfigUiData(igraphConfig: IGraphConfig): ViewModels.IGraphConfigUiData {
    return {
      showNeighborType: igraphConfig.showNeighborType,
      nodeProperties: [],
      nodePropertiesWithNone: [],
      nodeCaptionChoice: igraphConfig.nodeCaption,
      nodeColorKeyChoice: igraphConfig.nodeIconKey,
      nodeIconChoice: igraphConfig.nodeIconKey,
      nodeIconSet: undefined,
    };
  }

  private setDefaultIGraphConfigValues() {
    // Assign default values if undefined
    if (this.igraphConfigUiData.nodeCaptionChoice === undefined && this.igraphConfigUiData.nodeProperties.length > 1) {
      this.igraphConfigUiData.nodeCaptionChoice = this.igraphConfigUiData.nodeProperties[0];
    }
    if (
      this.igraphConfigUiData.nodeColorKeyChoice === undefined &&
      this.igraphConfigUiData.nodePropertiesWithNone.length > 1
    ) {
      this.igraphConfigUiData.nodeColorKeyChoice = this.igraphConfigUiData.nodePropertiesWithNone[0];
    }
    if (
      this.igraphConfigUiData.nodeIconChoice === undefined &&
      this.igraphConfigUiData.nodePropertiesWithNone.length > 1
    ) {
      this.igraphConfigUiData.nodeIconChoice = this.igraphConfigUiData.nodePropertiesWithNone[0];
    }
  }
  protected getTabsButtons(): CommandButtonComponentProps[] {
    const label = "New Vertex";
    const buttons: CommandButtonComponentProps[] = [
      {
        iconSrc: NewVertexIcon,
        iconAlt: label,
        onCommandClick: () => this.showNewVertexEditor(),
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: this.isNewVertexDisabled(),
      },
    ];
    buttons.push();
    if (this.isGraphDisplayed()) {
      const label = "Style";
      buttons.push({
        iconSrc: StyleIcon,
        iconAlt: label,
        onCommandClick: () => this.openStyling(),
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: this.isPropertyEditing(),
      });
    }
    return buttons;
  }
  protected buildCommandBarOptions(): void {
    ko.computed(() => ko.toJSON([this.isNewVertexDisabled])).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }
}
