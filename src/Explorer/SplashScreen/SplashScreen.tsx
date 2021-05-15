/**
 * Accordion top class
 */
import { Link } from "@fluentui/react";
import * as React from "react";
import AddDatabaseIcon from "../../../images/AddDatabase.svg";
import NewQueryIcon from "../../../images/AddSqlQuery_16x16.svg";
import NewStoredProcedureIcon from "../../../images/AddStoredProcedure.svg";
import OpenQueryIcon from "../../../images/BrowseQuery.svg";
import NewContainerIcon from "../../../images/Hero-new-container.svg";
import NewNotebookIcon from "../../../images/Hero-new-notebook.svg";
import SampleIcon from "../../../images/Hero-sample.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import ScaleAndSettingsIcon from "../../../images/Scale_15x15.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { getDatabaseName } from "../../Utils/APITypeUtils";
import { FeaturePanelLauncher } from "../Controls/FeaturePanel/FeaturePanelLauncher";
import { DataSamplesUtil } from "../DataSamples/DataSamplesUtil";
import Explorer from "../Explorer";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";

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
  private subscriptions: Array<{ dispose: () => void }>;

  constructor(props: SplashScreenProps) {
    super(props);
    this.container = props.explorer;
    this.subscriptions = [];
  }

  public componentWillUnmount() {
    while (this.subscriptions.length) {
      this.subscriptions.pop().dispose();
    }
  }

  public componentDidMount() {
    this.subscriptions.push(
      this.container.selectedNode.subscribe(() => this.setState({})),
      this.container.isNotebookEnabled.subscribe(() => this.setState({}))
    );
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

    const formContainer = (jsx: JSX.Element) => (
      <div className="connectExplorerContainer">
        <form className="connectExplorerFormContainer">{jsx}</form>
      </div>
    );

    return formContainer(
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

  private createCommonTaskItems(): SplashScreenItem[] {
    const items: SplashScreenItem[] = [];

    if (userContext.authType === AuthType.ResourceToken) {
      return items;
    }

    if (!this.container.isDatabaseNodeOrNoneSelected()) {
      if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
        items.push({
          iconSrc: NewQueryIcon,
          onClick: () => {
            const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();
            selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, null);
          },
          title: "New SQL Query",
          description: null,
        });
      } else if (userContext.apiType === "Mongo") {
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
        onClick: () => this.container.openBrowseQueriesPanel(),
      });

      if (userContext.apiType !== "Cassandra") {
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
        title: "New " + getDatabaseName(),
        description: null,
        onClick: () => this.container.openAddDatabasePane(),
      });
    }

    return items;
  }

  private decorateOpenCollectionActivity({ databaseId, collectionId }: MostRecentActivity.OpenCollectionItem) {
    return {
      iconSrc: NotebookIcon,
      title: collectionId,
      description: "Data",
      onClick: () => {
        const collection = this.container.findCollection(databaseId, collectionId);
        collection && collection.openTab();
      },
    };
  }

  private decorateOpenNotebookActivity({ name, path }: MostRecentActivity.OpenNotebookItem) {
    return {
      info: path,
      iconSrc: CollectionIcon,
      title: name,
      description: "Notebook",
      onClick: () => {
        const notebookItem = this.container.createNotebookContentItemFile(name, path);
        notebookItem && this.container.openNotebook(notebookItem);
      },
    };
  }

  private createRecentItems(): SplashScreenItem[] {
    return MostRecentActivity.mostRecentActivity.getItems(userContext.databaseAccount?.id).map((activity) => {
      switch (activity.type) {
        default: {
          const unknownActivity: never = activity;
          throw new Error(`Unknown activity: ${unknownActivity}`);
        }
        case MostRecentActivity.Type.OpenNotebook:
          return this.decorateOpenNotebookActivity(activity);

        case MostRecentActivity.Type.OpenCollection:
          return this.decorateOpenCollectionActivity(activity);
      }
    });
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
