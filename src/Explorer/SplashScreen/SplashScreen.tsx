/**
 * Accordion top class
 */
import * as React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import { Link } from "office-ui-fabric-react/lib/Link";
import NewContainerIcon from "../../../images/Hero-new-container.svg";
import NewNotebookIcon from "../../../images/Hero-new-notebook.svg";
import NewQueryIcon from "../../../images/AddSqlQuery_16x16.svg";
import OpenQueryIcon from "../../../images/BrowseQuery.svg";
import NewStoredProcedureIcon from "../../../images/AddStoredProcedure.svg";
import ScaleAndSettingsIcon from "../../../images/Scale_15x15.svg";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";
import AddDatabaseIcon from "../../../images/AddDatabase.svg";
import SampleIcon from "../../../images/Hero-sample.svg";
import { DataSamplesUtil } from "../DataSamples/DataSamplesUtil";
import Explorer from "../Explorer";
import { userContext } from "../../UserContext";
import { FeaturePanelLauncher } from "../Controls/FeaturePanel/FeaturePanelLauncher";
import CollectionIcon from "../../../images/tree-collection.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";

export interface SplashScreenItem {
  iconSrc: string;
  title: string;
  info?: string;
  description: string;
  onClick: () => void;
}

export interface SplashScreenProps {
  explorer: Explorer;
}

export class SplashScreen extends React.Component<SplashScreenProps> {
  private static readonly seeMoreItemTitle: string = "See more Cosmos DB documentation";
  private static readonly seeMoreItemUrl: string = "https://aka.ms/cosmosdbdocument";
  private static readonly dataModelingUrl = "https://docs.microsoft.com/azure/cosmos-db/modeling-data";
  private static readonly throughputEstimatorUrl = "https://cosmos.azure.com/capacitycalculator";
  private static readonly failoverUrl = "https://docs.microsoft.com/azure/cosmos-db/high-availability";

  private readonly container: Explorer;

  constructor(props: SplashScreenProps) {
    super(props);
    this.container = props.explorer;
    this.container.tabsManager.openedTabs.subscribe(() => this.setState({}));
    this.container.selectedNode.subscribe(() => this.setState({}));
    this.container.isNotebookEnabled.subscribe(() => this.setState({}));
  }

  public shouldComponentUpdate() {
    return this.container.tabsManager.openedTabs.length === 0;
  }

  private clearMostRecent = (): void => {
    MostRecentActivity.mostRecentActivity.clear(userContext.databaseAccount?.id);
    this.setState({});
  };

  public render(): JSX.Element {
    const mainItems = this.createMainItems();
    const commonTaskItems = this.createCommonTaskItems();
    const recentItems = this.createRecentItems();
    const tipsItems = this.createTipsItems();
    const onClearRecent = this.clearMostRecent;

    return (
      <div className="splashScreenContainer">
        <div className="splashScreen">
          <div className="title">
            Welcome to Cosmos DB
            <FeaturePanelLauncher />
          </div>
          <div className="subtitle">Globally distributed, multi-model database service for any scale</div>
          <div className="mainButtonsContainer">
            {mainItems.map((item) => (
              <div
                className="mainButton focusable"
                key={`${item.title}`}
                onClick={item.onClick}
                onKeyPress={(event: React.KeyboardEvent) => this.onSplashScreenItemKeyPress(event, item.onClick)}
                tabIndex={0}
                role="button"
              >
                <img src={item.iconSrc} alt="" />
                <div className="legendContainer">
                  <div className="legend">{item.title}</div>
                  <div className="description">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="moreStuffContainer">
            <div className="moreStuffColumn commonTasks">
              <div className="title">Common Tasks</div>
              <ul>
                {commonTaskItems.map((item) => (
                  <li
                    className="focusable"
                    key={`${item.title}${item.description}`}
                    onClick={item.onClick}
                    onKeyPress={(event: React.KeyboardEvent) => this.onSplashScreenItemKeyPress(event, item.onClick)}
                    tabIndex={0}
                    role="button"
                  >
                    <img src={item.iconSrc} alt="" />
                    <span className="oneLineContent" title={item.info}>
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="moreStuffColumn">
              <div className="title">Recents</div>
              <ul>
                {recentItems.map((item, index) => (
                  <li key={`${item.title}${item.description}${index}`}>
                    <img src={item.iconSrc} alt="" />
                    <span className="twoLineContent">
                      <Link onClick={item.onClick} title={item.info}>
                        {item.title}
                      </Link>
                      <div className="description">{item.description}</div>
                    </span>
                  </li>
                ))}
              </ul>
              {recentItems.length > 0 && <Link onClick={() => onClearRecent()}>Clear Recents</Link>}
            </div>
            <div className="moreStuffColumn tipsContainer">
              <div className="title">Tips</div>
              <ul>
                {tipsItems.map((item) => (
                  <li
                    className="tipContainer focusable"
                    key={`${item.title}${item.description}`}
                    onClick={item.onClick}
                    onKeyPress={(event: React.KeyboardEvent) => this.onSplashScreenItemKeyPress(event, item.onClick)}
                    tabIndex={0}
                    role="link"
                  >
                    <div className="title" title={item.info}>
                      {item.title}
                    </div>
                    <div className="description">{item.description}</div>
                  </li>
                ))}
                <li>
                  <a role="link" href={SplashScreen.seeMoreItemUrl} target="_blank" tabIndex={0}>
                    {SplashScreen.seeMoreItemTitle}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
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

  private getItemIcon(item: MostRecentActivity.Item): string {
    switch (item.type) {
      case MostRecentActivity.Type.OpenCollection:
        return CollectionIcon;
      case MostRecentActivity.Type.OpenNotebook:
        return NotebookIcon;
      default:
        return null;
    }
  }

  private onItemClicked(item: MostRecentActivity.Item) {
    switch (item.type) {
      case MostRecentActivity.Type.OpenCollection: {
        const openCollectionitem = item.data as MostRecentActivity.OpenCollectionItem;
        const collection = this.container.findCollection(
          openCollectionitem.databaseId,
          openCollectionitem.collectionId
        );
        if (collection) {
          collection.openTab();
        }
        break;
      }
      case MostRecentActivity.Type.OpenNotebook: {
        const openNotebookItem = item.data as MostRecentActivity.OpenNotebookItem;
        const notebookItem = this.container.createNotebookContentItemFile(openNotebookItem.name, openNotebookItem.path);
        notebookItem && this.container.openNotebook(notebookItem);
        break;
      }
      default:
        console.error("Unknown item type", item);
        break;
    }
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
    return MostRecentActivity.mostRecentActivity.getItems(userContext.databaseAccount?.id).map((item) => ({
      iconSrc: this.getItemIcon(item),
      title: item.title,
      description: item.description,
      info: SplashScreen.getInfo(item),
      onClick: () => this.onItemClicked(item),
    }));
  }

  private createTipsItems(): SplashScreenItem[] {
    return [
      {
        iconSrc: null,
        title: "Data Modeling",
        description: "Learn more about modeling",
        onClick: () => window.open(SplashScreen.dataModelingUrl),
      },
      {
        iconSrc: null,
        title: "Cost & Throughput Calculation",
        description: "Learn more about cost calculation",
        onClick: () => window.open(SplashScreen.throughputEstimatorUrl),
      },
      {
        iconSrc: null,
        title: "Configure automatic failover",
        description: "Learn more about Cosmos DB high-availability",
        onClick: () => window.open(SplashScreen.failoverUrl),
      },
    ];
  }

  private onSplashScreenItemKeyPress(event: React.KeyboardEvent, callback: () => void) {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      callback();
      event.stopPropagation();
    }
  }
}
