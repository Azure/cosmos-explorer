/**
 * Accordion top class
 */
import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../Contracts/ViewModels";
import NewContainerIcon from "../../../images/Hero-new-container.svg";
import NewNotebookIcon from "../../../images/Hero-new-notebook.svg";
import NewQueryIcon from "../../../images/AddSqlQuery_16x16.svg";
import OpenQueryIcon from "../../../images/BrowseQuery.svg";
import NewStoredProcedureIcon from "../../../images/AddStoredProcedure.svg";
import ScaleAndSettingsIcon from "../../../images/Scale_15x15.svg";
import { SplashScreenComponent, SplashScreenItem } from "./SplashScreenComponent";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";
import AddDatabaseIcon from "../../../images/AddDatabase.svg";
import SampleIcon from "../../../images/Hero-sample.svg";
import { DataSamplesUtil } from "../DataSamples/DataSamplesUtil";
import Explorer from "../Explorer";
import { userContext } from "../../UserContext";

export interface SplashScreenComponentAdapterProps {
  explorer: Explorer;
}

export class SplashScreenComponentAdapter extends React.Component<SplashScreenComponentAdapterProps> {
  private static readonly dataModelingUrl = "https://docs.microsoft.com/azure/cosmos-db/modeling-data";
  private static readonly throughputEstimatorUrl = "https://cosmos.azure.com/capacitycalculator";
  private static readonly failoverUrl = "https://docs.microsoft.com/azure/cosmos-db/high-availability";

  public parameters: ko.Observable<number>;
  private readonly container: Explorer;

  constructor(props: SplashScreenComponentAdapterProps) {
    super(props);
    this.container = props.explorer;
    this.parameters = ko.observable<number>(Date.now());
    this.container.tabsManager.openedTabs.subscribe((tabs) => {
      if (tabs.length === 0) {
        this.forceRender();
      }
    });
    this.container.selectedNode.subscribe(this.forceRender);
    this.container.isNotebookEnabled.subscribe(this.forceRender);
  }

  public forceRender = (): void => {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  };

  private clearMostRecent = (): void => {
    this.container.mostRecentActivity.clear(userContext.databaseAccount?.id);
    this.forceRender();
  };

  public renderComponent(): JSX.Element {
    return (
      <SplashScreenComponent
        mainItems={this.createMainItems()}
        commonTaskItems={this.createCommonTaskItems()}
        recentItems={this.createRecentItems()}
        tipsItems={this.createTipsItems()}
        onClearRecent={this.clearMostRecent}
      />
    );
  }

  /**
   * This exists to enable unit testing
   */
  public createDataSampleUtil(): DataSamplesUtil {
    return new DataSamplesUtil(this.container);
  }

  /**
   * public for testing purposes
   */
  public createMainItems(): SplashScreenItem[] {
    const dataSampleUtil = this.createDataSampleUtil();
    const heroes: SplashScreenItem[] = [
      {
        iconSrc: NewContainerIcon,
        title: this.container.addCollectionText(),
        description: "Create a new container for storage and throughput",
        onClick: () => this.container.onNewCollectionClicked(),
      },
    ];

    if (dataSampleUtil.isSampleContainerCreationSupported()) {
      // Insert at the front
      heroes.unshift({
        iconSrc: SampleIcon,
        title: "Start with Sample",
        description: "Get started with a sample provided by Cosmos DB",
        onClick: () => dataSampleUtil.createSampleContainerAsync(),
      });
    }

    if (this.container.isNotebookEnabled()) {
      heroes.push({
        iconSrc: NewNotebookIcon,
        title: "New Notebook",
        description: "Create a notebook to start querying, visualizing, and modeling your data",
        onClick: () => this.container.onNewNotebookClicked(),
      });
    }

    return heroes;
  }

  private createCommonTaskItems(): SplashScreenItem[] {
    const items: SplashScreenItem[] = [];

    if (this.container.isAuthWithResourceToken()) {
      return items;
    }

    if (!this.container.isDatabaseNodeOrNoneSelected()) {
      if (this.container.isPreferredApiDocumentDB() || this.container.isPreferredApiGraph()) {
        items.push({
          iconSrc: NewQueryIcon,
          onClick: () => {
            const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();
            selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, null);
          },
          title: "New SQL Query",
          description: null,
        });
      } else if (this.container.isPreferredApiMongoDB()) {
        items.push({
          iconSrc: NewQueryIcon,
          onClick: () => {
            const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();
            selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection, null);
          },
          title: "New Query",
          description: null,
        });
      }

      items.push({
        iconSrc: OpenQueryIcon,
        title: "Open Query",
        description: null,
        onClick: () => this.container.browseQueriesPane.open(),
      });

      if (!this.container.isPreferredApiCassandra()) {
        items.push({
          iconSrc: NewStoredProcedureIcon,
          title: "New Stored Procedure",
          description: null,
          onClick: () => {
            const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();
            selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, null);
          },
        });
      }

      /* Scale & Settings */
      let isShared = false;
      if (this.container.isDatabaseNodeSelected()) {
        isShared = this.container.findSelectedDatabase().isDatabaseShared();
      } else if (this.container.isNodeKindSelected("Collection")) {
        const database: ViewModels.Database = this.container.findSelectedCollection().getDatabase();
        isShared = database && database.isDatabaseShared();
      }

      const label = isShared ? "Settings" : "Scale & Settings";
      items.push({
        iconSrc: ScaleAndSettingsIcon,
        title: label,
        description: null,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();
          selectedCollection && selectedCollection.onSettingsClick();
        },
      });
    } else {
      items.push({
        iconSrc: AddDatabaseIcon,
        title: this.container.addDatabaseText(),
        description: null,
        onClick: () => this.container.addDatabasePane.open(),
      });
    }

    return items;
  }

  private static getInfo(item: MostRecentActivity.Item): string {
    if (item.type === MostRecentActivity.Type.OpenNotebook) {
      const data = item.data as MostRecentActivity.OpenNotebookItem;
      return data.path;
    } else {
      return undefined;
    }
  }

  private createRecentItems(): SplashScreenItem[] {
    return this.container.mostRecentActivity.getItems(userContext.databaseAccount?.id).map((item) => ({
      iconSrc: MostRecentActivity.MostRecentActivity.getItemIcon(item),
      title: item.title,
      description: item.description,
      info: SplashScreenComponentAdapter.getInfo(item),
      onClick: () => this.container.mostRecentActivity.onItemClicked(item),
    }));
  }

  private createTipsItems(): SplashScreenItem[] {
    return [
      {
        iconSrc: null,
        title: "Data Modeling",
        description: "Learn more about modeling",
        onClick: () => window.open(SplashScreenComponentAdapter.dataModelingUrl),
      },
      {
        iconSrc: null,
        title: "Cost & Throughput Calculation",
        description: "Learn more about cost calculation",
        onClick: () => window.open(SplashScreenComponentAdapter.throughputEstimatorUrl),
      },
      {
        iconSrc: null,
        title: "Configure automatic failover",
        description: "Learn more about Cosmos DB high-availability",
        onClick: () => window.open(SplashScreenComponentAdapter.failoverUrl),
      },
    ];
  }
}
