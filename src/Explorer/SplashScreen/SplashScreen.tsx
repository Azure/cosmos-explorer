/**
 * Accordion top class
 */
import { Coachmark, DirectionalHint, Image, Link, Stack, TeachingBubbleContent, Text } from "@fluentui/react";
import * as React from "react";
import AddDatabaseIcon from "../../../images/AddDatabase.svg";
import NewQueryIcon from "../../../images/AddSqlQuery_16x16.svg";
import NewStoredProcedureIcon from "../../../images/AddStoredProcedure.svg";
import OpenQueryIcon from "../../../images/BrowseQuery.svg";
import ConnectIcon from "../../../images/Connect_color.svg";
import ContainersIcon from "../../../images/Containers.svg";
import NewContainerIcon from "../../../images/Hero-new-container.svg";
import NewNotebookIcon from "../../../images/Hero-new-notebook.svg";
import SampleIcon from "../../../images/Hero-sample.svg";
import LinkIcon from "../../../images/Link_blue.svg";
import NotebookColorIcon from "../../../images/Notebook.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import QuickStartIcon from "../../../images/Quickstart_Lightning.svg";
import ScaleAndSettingsIcon from "../../../images/Scale_15x15.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { useSidePanel } from "../../hooks/useSidePanel";
import { userContext } from "../../UserContext";
import { getCollectionName, getDatabaseName } from "../../Utils/APITypeUtils";
import { FeaturePanelLauncher } from "../Controls/FeaturePanel/FeaturePanelLauncher";
import { DataSamplesUtil } from "../DataSamples/DataSamplesUtil";
import Explorer from "../Explorer";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";
import { useNotebook } from "../Notebook/useNotebook";
import { AddDatabasePanel } from "../Panes/AddDatabasePanel/AddDatabasePanel";
import { BrowseQueriesPane } from "../Panes/BrowseQueriesPane/BrowseQueriesPane";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";

export interface SplashScreenItem {
  iconSrc: string;
  title: string;
  id?: string;
  info?: string;
  description: string;
  showLinkIcon?: boolean;
  onClick: () => void;
}

export interface SplashScreenProps {
  explorer: Explorer;
}

export interface SplashScreenState {
  showCoachmark: boolean;
}

export class SplashScreen extends React.Component<SplashScreenProps, SplashScreenState> {
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

    this.state = {
      showCoachmark: userContext.features.enableNewQuickstart,
    };
  }

  public componentWillUnmount(): void {
    while (this.subscriptions.length) {
      this.subscriptions.pop().dispose();
    }
  }

  public componentDidMount(): void {
    this.subscriptions.push(
      {
        dispose: useNotebook.subscribe(
          () => this.setState({}),
          (state) => state.isNotebookEnabled
        ),
      },
      { dispose: useSelectedNode.subscribe(() => this.setState({})) }
    );
  }

  private clearMostRecent = (): void => {
    MostRecentActivity.mostRecentActivity.clear(userContext.databaseAccount?.id);
    this.setState({});
  };

  public render(): JSX.Element {
    const mainItems = this.createMainItems();

    return (
      <div className="connectExplorerContainer">
        <form className="connectExplorerFormContainer">
          <div className="splashScreenContainer">
            <div className="splashScreen">
              <div className="title">
                Welcome to Cosmos DB
                <FeaturePanelLauncher />
              </div>
              <div className="subtitle">Globally distributed, multi-model database service for any scale</div>
              <div className="mainButtonsContainer">
                {mainItems.map((item) => (
                  <Stack
                    horizontal
                    className="mainButton focusable"
                    key={`${item.title}`}
                    onClick={item.onClick}
                    onKeyPress={(event: React.KeyboardEvent) => this.onSplashScreenItemKeyPress(event, item.onClick)}
                    tabIndex={0}
                    role="button"
                  >
                    <div>
                      <img src={item.iconSrc} alt="" />
                    </div>
                    <div className="legendContainer">
                      <Stack horizontal verticalAlign="center" style={{ marginBottom: 8 }}>
                        <div className="legend">{item.title}</div>
                        {item.showLinkIcon && <Image style={{ marginLeft: 8, width: 16 }} src={LinkIcon} />}
                      </Stack>

                      <div
                        id={item.id}
                        className={userContext.features.enableNewQuickstart ? "newDescription" : "description"}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Stack>
                ))}
              </div>
              {this.state.showCoachmark && (
                <Coachmark
                  target="#quickstartDescription"
                  positioningContainerProps={{ directionalHint: DirectionalHint.rightTopEdge }}
                  persistentBeak
                >
                  <TeachingBubbleContent
                    headline={`Start with sample ${getCollectionName().toLocaleLowerCase()}`}
                    hasCloseButton
                    closeButtonAriaLabel="Close"
                    primaryButtonProps={{
                      text: "Get started",
                      onClick: () => {
                        this.setState({ showCoachmark: false });
                        this.container.onNewCollectionClicked({ isQuickstart: true });
                      },
                    }}
                    secondaryButtonProps={{ text: "Cancel", onClick: () => this.setState({ showCoachmark: false }) }}
                    onDismiss={() => this.setState({ showCoachmark: false })}
                  >
                    You will be guided to create a sample container with sample data, then we will give you a tour of
                    data explorer You can also cancel launching this tour and explore yourself
                  </TeachingBubbleContent>
                </Coachmark>
              )}
              <div className="moreStuffContainer">
                <div className="moreStuffColumn commonTasks">
                  <div className="title">{userContext.features.enableNewQuickstart ? "Recents" : "Common Tasks"}</div>
                  {userContext.features.enableNewQuickstart ? this.getRecentItems() : this.getCommonTasksItems()}
                </div>
                <div className="moreStuffColumn">
                  <div className="title">
                    {userContext.features.enableNewQuickstart ? "Top 3 things you need to know" : "Recents"}
                  </div>
                  {userContext.features.enableNewQuickstart ? this.top3Items() : this.getRecentItems()}
                </div>
                <div className="moreStuffColumn tipsContainer">
                  <div className="title">
                    {userContext.features.enableNewQuickstart ? "Learning Resources" : "Tips"}
                  </div>
                  {userContext.features.enableNewQuickstart ? this.getLearningResourceItems() : this.getTipItems()}
                </div>
              </div>
            </div>
          </div>
        </form>
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
    const heroes: SplashScreenItem[] = [];

    if (userContext.features.enableNewQuickstart) {
      if (userContext.apiType === "SQL" || userContext.apiType === "Mongo") {
        const launchQuickstartBtn = {
          id: "quickstartDescription",
          iconSrc: QuickStartIcon,
          title: "Launch quick start",
          description: "Launch a quick start tutorial to get started with sample data",
          showLinkIcon: userContext.apiType === "Mongo",
          onClick: () =>
            userContext.apiType === "Mongo"
              ? window.open("http://aka.ms/mongodbquickstart", "_blank")
              : this.container.onNewCollectionClicked({ isQuickstart: true }),
        };
        heroes.push(launchQuickstartBtn);
      } else if (useNotebook.getState().isPhoenixNotebooks) {
        const newNotebookBtn = {
          iconSrc: NotebookColorIcon,
          title: "New notebook",
          description: "Visualize your data stored in Azure Cosmos DB",
          onClick: () => this.container.onNewNotebookClicked(),
        };
        heroes.push(newNotebookBtn);
      }

      const newContainerBtn = {
        iconSrc: ContainersIcon,
        title: `New ${getCollectionName()}`,
        description: "Create a new container for storage and throughput",
        onClick: () => this.container.onNewCollectionClicked(),
      };
      heroes.push(newContainerBtn);

      const connectBtn = {
        iconSrc: ConnectIcon,
        title: "Connect",
        description: "Prefer using your own choice of tooling? Find the connection string you need to connect",
        // TODO: replace onClick function
        onClick: () => 2,
      };
      heroes.push(connectBtn);
    } else {
      const dataSampleUtil = this.createDataSampleUtil();
      if (dataSampleUtil.isSampleContainerCreationSupported()) {
        heroes.push({
          iconSrc: SampleIcon,
          title: "Start with Sample",
          description: "Get started with a sample provided by Cosmos DB",
          onClick: () => dataSampleUtil.createSampleContainerAsync(),
        });
      }

      heroes.push({
        iconSrc: NewContainerIcon,
        title: `New ${getCollectionName()}`,
        description: "Create a new container for storage and throughput",
        onClick: () => this.container.onNewCollectionClicked(),
      });

      if (useNotebook.getState().isPhoenixNotebooks) {
        heroes.push({
          iconSrc: NewNotebookIcon,
          title: "New Notebook",
          description: "Create a notebook to start querying, visualizing, and modeling your data",
          onClick: () => this.container.onNewNotebookClicked(),
        });
      }
    }

    return heroes;
  }

  private createCommonTaskItems(): SplashScreenItem[] {
    const items: SplashScreenItem[] = [];

    if (userContext.authType === AuthType.ResourceToken) {
      return items;
    }

    if (!useSelectedNode.getState().isDatabaseNodeOrNoneSelected()) {
      if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
        items.push({
          iconSrc: NewQueryIcon,
          onClick: () => {
            const selectedCollection: ViewModels.Collection = useSelectedNode.getState().findSelectedCollection();
            selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, undefined);
          },
          title: "New SQL Query",
          description: undefined,
        });
      } else if (userContext.apiType === "Mongo") {
        items.push({
          iconSrc: NewQueryIcon,
          onClick: () => {
            const selectedCollection: ViewModels.Collection = useSelectedNode.getState().findSelectedCollection();
            selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection, undefined);
          },
          title: "New Query",
          description: undefined,
        });
      }

      if (userContext.apiType === "SQL") {
        items.push({
          iconSrc: OpenQueryIcon,
          title: "Open Query",
          description: undefined,
          onClick: () =>
            useSidePanel
              .getState()
              .openSidePanel("Open Saved Queries", <BrowseQueriesPane explorer={this.container} />),
        });
      }

      if (userContext.apiType !== "Cassandra") {
        items.push({
          iconSrc: NewStoredProcedureIcon,
          title: "New Stored Procedure",
          description: undefined,
          onClick: () => {
            const selectedCollection: ViewModels.Collection = useSelectedNode.getState().findSelectedCollection();
            selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, undefined);
          },
        });
      }

      /* Scale & Settings */
      const isShared = useDatabases.getState().findSelectedDatabase()?.isDatabaseShared();

      const label = isShared ? "Settings" : "Scale & Settings";
      items.push({
        iconSrc: ScaleAndSettingsIcon,
        title: label,
        description: undefined,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = useSelectedNode.getState().findSelectedCollection();
          selectedCollection && selectedCollection.onSettingsClick();
        },
      });
    } else {
      items.push({
        iconSrc: AddDatabaseIcon,
        title: "New " + getDatabaseName(),
        description: undefined,
        onClick: async () => {
          const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
          if (throughputCap && throughputCap !== -1) {
            await useDatabases.getState().loadAllOffers();
          }
          useSidePanel
            .getState()
            .openSidePanel(
              "New " + getDatabaseName(),
              <AddDatabasePanel explorer={this.container} buttonElement={document.activeElement as HTMLElement} />
            );
        },
      });
    }

    return items;
  }

  private decorateOpenCollectionActivity({ databaseId, collectionId }: MostRecentActivity.OpenCollectionItem) {
    return {
      iconSrc: CollectionIcon,
      title: collectionId,
      description: getCollectionName(),
      onClick: () => {
        const collection = useDatabases.getState().findCollection(databaseId, collectionId);
        collection?.openTab();
      },
    };
  }

  private decorateOpenNotebookActivity({ name, path }: MostRecentActivity.OpenNotebookItem) {
    return {
      info: path,
      iconSrc: NotebookIcon,
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
        iconSrc: undefined,
        title: "Data Modeling",
        description: "Learn more about modeling",
        onClick: () => window.open(SplashScreen.dataModelingUrl),
      },
      {
        iconSrc: undefined,
        title: "Cost & Throughput Calculation",
        description: "Learn more about cost calculation",
        onClick: () => window.open(SplashScreen.throughputEstimatorUrl),
      },
      {
        iconSrc: undefined,
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

  private getCommonTasksItems(): JSX.Element {
    const commonTaskItems = this.createCommonTaskItems();
    return (
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
    );
  }

  private top3Items(): JSX.Element {
    let items: { link: string; title: string; description: string }[];
    switch (userContext.apiType) {
      case "SQL":
        items = [
          {
            link: "https://aka.ms/msl-modeling-partitioning-2",
            title: "Advanced Modeling Patterns",
            description:
              "Learn advanced strategies for managing relationships between data entities to optimize your database.",
          },
          {
            link: "https://aka.ms/msl-modeling-partitioning-1",
            title: "Partitioning Best Practices",
            description:
              "Learn to apply data model and partitioning strategies to support an efficient and scalable NoSQL database.",
          },
          {
            link: "https://aka.ms/msl-resource-planning",
            title: "Plan Your Resource Requirements",
            description:
              "Familiarize yourself with the various configuration options for a new Azure Cosmos DB SQL API account.",
          },
        ];
        break;
      case "Mongo":
        items = [
          {
            link: "https://aka.ms/mongodbintro",
            title: "Introduction to Azure Cosmos DB API for MongoDB",
            description: "Understand the Cosmos DB API for MongoDB and it's offerings",
          },
          {
            link: "https://aka.ms/mongodbfeaturesupport",
            title: "Supported Features and Syntax",
            description: "Learn about the benefits and features of Cosmos DB API for MongoDB",
          },
          {
            link: "https://aka.ms/mongodbpremigration",
            title: "Migrate your data",
            description: "Pre-migration steps for data migration to Azure Cosmos DB's API for MongoDB",
          },
        ];
        break;
      case "Cassandra":
        items = [
          {
            link: "https://aka.ms/cassandrajava",
            title: "Build a Java App",
            description: "Use a Cassandra API account in Azure Cosmos DB to store the key/value data.",
          },
          {
            link: "https://aka.ms/cassandrapartitioning",
            title: "Partitioning Best Practices",
            description: "Learn how partitioning works",
          },
          {
            link: "https://aka.ms/cassandraRu",
            title: "Understanding Request Units (RUs)",
            description:
              "Understanding how and where to retrieve information when programmatically talking to Cassandra API",
          },
        ];
        break;
      case "Gremlin":
        items = [
          {
            link: "https://aka.ms/Graphdatamodeling",
            title: "Data Modeling",
            description: "Graph data modeling recommendations",
          },
          {
            link: "https://aka.ms/graphpartitioning",
            title: "Partitioning Best Practices",
            description: "Using a partitioned graph",
          },
          {
            link: "https://aka.ms/graphapiquery",
            title: "Query Data",
            description: "Querying data with Gremlin",
          },
        ];
        break;
      case "Tables":
        items = [
          {
            link: "https://aka.ms/tableintro",
            title: "Introduction to Azure Cosmos DB: Table API",
            description: "Understand the Table API in Cosmos DB and it's offerings",
          },
          {
            link: "https://aka.ms/tableimport",
            title: "Migrate your data",
            description: "Learn how to migrate your data to an Azure Cosmos DB Table API account",
          },
          {
            link: "https://aka.ms/tablefaq",
            title: "Azure Cosmos DB: Table API FAQs",
            description: "Frequently asked questions about the Table API in Azure Cosmos DB",
          },
        ];
        break;
    }
    return (
      <Stack>
        {items.map((item, i) => (
          <Stack key={`top${i}`} style={{ marginBottom: 26 }}>
            <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
              <Link href={item.link} target="_blank" style={{ marginRight: 5 }}>
                {item.title}
              </Link>
              <Image src={LinkIcon} />
            </Stack>
            <Text>{item.description}</Text>
          </Stack>
        ))}
      </Stack>
    );
  }

  private getRecentItems(): JSX.Element {
    const recentItems = this.createRecentItems()?.filter((item) => item.description !== "Notebook");

    return (
      <Stack>
        <ul>
          {recentItems.map((item, index) => (
            <li key={`${item.title}${item.description}${index}`}>
              <Stack style={{ marginBottom: 26 }}>
                <Stack horizontal>
                  <Image style={{ marginRight: 8 }} src={item.iconSrc} />
                  <Link style={{ fontSize: 14 }} onClick={item.onClick} title={item.info}>
                    {item.title}
                  </Link>
                </Stack>
                <Text style={{ color: "#605E5C" }}>{item.description}</Text>
              </Stack>
            </li>
          ))}
        </ul>
        {recentItems.length > 0 && <Link onClick={() => this.clearMostRecent()}>Clear Recents</Link>}
      </Stack>
    );
  }

  private getLearningResourceItems(): JSX.Element {
    let items: { link: string; title: string; description: string }[];
    switch (userContext.apiType) {
      case "SQL":
        items = [
          {
            link: "https://aka.ms/msl-sdk-connect",
            title: "Get Started using th SQL API with the SDK",
            description: "Learn about the Azure Cosmos DB SDK, then download and use in a .NET application.",
          },
          {
            link: "https://aka.ms/msl-complex-queries",
            title: "Master Complex Queries",
            description: "Learn how to author complex queries using cross-products and correlated subqueries.",
          },
          {
            link: "https://aka.ms/msl-move-data",
            title: "Migrate Your Data",
            description:
              "Migrate data into and out of Azure Cosmos DB SQL API using Azure services and open-source solutions.",
          },
        ];
        break;
      case "Mongo":
        items = [
          {
            link: "https://aka.ms/mongonodejs",
            title: "Build an app with Node.js",
            description: "Build a Node.js app with Azure Cosmos DB's API for MongoDB",
          },
          {
            link: "https://aka.ms/mongopython",
            title: "Use Azure Cosmos DB API for MongoDB and Python",
            description:
              "Learn how to create an API for MongoDB account, a database and a collection, and perform CRUD operations.",
          },
          {
            link: "http://aka.ms/mongodotnet",
            title: "Build a web API using .NET SDK",
            description: "Build a web API using Azure Cosmos DB's API for MongoDB and .NET SDK",
          },
        ];
        break;
      case "Cassandra":
        items = [
          {
            link: "https://aka.ms/cassandracontainer",
            title: "Create a Container",
            description: "Learn the different ways to create a container",
          },
          {
            link: "https://aka.ms/cassandraserverdiagnostics",
            title: "Run Server Diagnostics",
            description: "Server diagnostics for Azure Cosmos DB Cassandra API",
          },
          {
            link: "https://aka.ms/Cassandrathroughput",
            title: "ProvisionThroughput",
            description: "How to provision throughput in Azure Cosmos DB Cassandra API",
          },
        ];
        break;
      case "Gremlin":
        items = [
          {
            link: "https://aka.ms/graphquickstart",
            title: "Quickstart",
            description: "Create, query, and traverse an Azure Cosmos DB graph database using the Gremlin console",
          },
          {
            link: "https://aka.ms/graphimport",
            title: "Import Graph Data",
            description: "Learn Bulk ingestion in Azure Cosmos DB Gremlin API using BulkExecutor",
          },
          {
            link: "https://aka.ms/graphoptimize",
            title: "Optimize your Queries",
            description: "How to use the execution profile step to evaluate your Gremlin queries",
          },
        ];
        break;
      case "Tables":
        items = [
          {
            link: "https://aka.ms/tabledotnet",
            title: "Build an app with a .NET SDK",
            description: "Build a Table API app with .NET SDK and Azure Cosmos DB",
          },
          {
            link: "https://aka.ms/Tablejava",
            title: "Build an app with a Java SDK",
            description: "Build a Table API app with Java SDK and Azure Cosmos DB",
          },
          {
            link: "https://aka.ms/tablenodejs",
            title: "Build an app with Node.js",
            description: "Build a Table API app with Node.js and Azure Cosmos DB",
          },
        ];
        break;
    }
    return (
      <Stack>
        {items.map((item, i) => (
          <Stack key={`learningResource${i}`} style={{ marginBottom: 26 }}>
            <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
              <Link href={item.link} target="_blank" style={{ marginRight: 5 }}>
                {item.title}
              </Link>
              <Image src={LinkIcon} />
            </Stack>
            <Text>{item.description}</Text>
          </Stack>
        ))}
      </Stack>
    );
  }

  private getTipItems(): JSX.Element {
    const tipsItems = this.createTipsItems();

    return (
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
          <a role="link" href={SplashScreen.seeMoreItemUrl} rel="noreferrer" target="_blank" tabIndex={0}>
            {SplashScreen.seeMoreItemTitle}
          </a>
        </li>
      </ul>
    );
  }
}
