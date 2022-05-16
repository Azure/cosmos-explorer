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
import CostIcon from "../../../images/Cost.svg";
import GreenCheckIcon from "../../../images/Green_check.svg";
import NewContainerIcon from "../../../images/Hero-new-container.svg";
import NewNotebookIcon from "../../../images/Hero-new-notebook.svg";
import SampleIcon from "../../../images/Hero-sample.svg";
import LinkIcon from "../../../images/Link_blue.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import NotebooksIcon from "../../../images/Notebooks.svg";
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
                      <div className="legend">{item.title}</div>
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
                  <div className="title">
                    {userContext.features.enableNewQuickstart ? "Why Cosmos DB" : "Common Tasks"}
                  </div>
                  {userContext.features.enableNewQuickstart ? this.getNotebookItems() : this.getCommonTasksItems()}
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
    const dataSampleUtil = this.createDataSampleUtil();

    if (userContext.features.enableNewQuickstart) {
      const launchQuickstartBtn = {
        id: "quickstartDescription",
        iconSrc: QuickStartIcon,
        title: "Launch quick start",
        description: "Launch a quick start tutorial to get started with sample data",
        onClick: () => this.container.onNewCollectionClicked({ isQuickstart: true }),
      };

      const newContainerBtn = {
        iconSrc: ContainersIcon,
        title: `New ${getCollectionName()}`,
        description: "Create a new container for storage and throughput",
        onClick: () => this.container.onNewCollectionClicked(),
      };

      const connectBtn = {
        iconSrc: ConnectIcon,
        title: "Connect",
        description: "Prefer using your own choice of tooling? Find the connection string you need to connect",
        // TODO: replace onClick function
        onClick: () => 2,
      };

      return [launchQuickstartBtn, newContainerBtn, connectBtn];
    } else {
      const heroes: SplashScreenItem[] = [];

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

      return heroes;
    }
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
      iconSrc: NotebookIcon,
      title: collectionId,
      description: "Data",
      onClick: () => {
        const collection = useDatabases.getState().findCollection(databaseId, collectionId);
        collection?.openTab();
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

  private getNotebookItems(): JSX.Element {
    return (
      <Stack>
        <Stack className="notebookSplashScreenItem" horizontal style={{ marginBottom: 14 }}>
          <Image src={NotebooksIcon} />
          <Text className="itemText">Notebook - Easy to develop</Text>
        </Stack>
        <Stack className="notebookSplashScreenItem" horizontal style={{ marginBottom: 14 }}>
          <Image src={GreenCheckIcon} />
          <Text className="itemText">Notebook - Enterprise ready</Text>
        </Stack>
        <Stack className="notebookSplashScreenItem" horizontal style={{ marginBottom: 14 }}>
          <Image src={CostIcon} />
          <Text className="itemText">Notebook - Cost effective</Text>
        </Stack>
      </Stack>
    );
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
    return (
      <Stack>
        <Stack style={{ marginBottom: 26 }}>
          <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
            <Link href="https://aka.ms/msl-modeling-partitioning-2" target="_blank" style={{ marginRight: 5 }}>
              Advanced Modeling Patterns
            </Link>
            <Image src={LinkIcon} />
          </Stack>
          <Text>
            Learn advanced strategies for managing relationships between data entities to optimize your database.
          </Text>
        </Stack>
        <Stack style={{ marginBottom: 26 }}>
          <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
            <Link href="https://aka.ms/msl-modeling-partitioning-1" target="_blank" style={{ marginRight: 5 }}>
              Partitioning Best Practices
            </Link>
            <Image src={LinkIcon} />
          </Stack>
          <Text>
            Learn to apply data model and partitioning strategies to support an efficient and scalable NoSQL database.
          </Text>
        </Stack>
        <Stack>
          <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
            <Link href="https://aka.ms/msl-resource-planning" target="_blank" style={{ marginRight: 5 }}>
              Plan Your Resource Requirements
            </Link>
            <Image src={LinkIcon} />
          </Stack>
          <Text>
            Familiarize yourself with the various configuration options for a new Azure Cosmos DB SQL API account.
          </Text>
        </Stack>
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
        {recentItems.length > 0 && <Link onClick={() => this.clearMostRecent()}>Clear Recents</Link>}
      </Stack>
    );
  }

  private getLearningResourceItems(): JSX.Element {
    return (
      <Stack>
        <Stack style={{ marginBottom: 26 }}>
          <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
            <Link href="https://aka.ms/msl-sdk-connect" target="_blank" style={{ marginRight: 5 }}>
              Get Started using th SQL API with the SDK
            </Link>
            <Image src={LinkIcon} />
          </Stack>
          <Text>Learn about the Azure Cosmos DB SDK, then download and use in a .NET application.</Text>
        </Stack>
        <Stack style={{ marginBottom: 26 }}>
          <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
            <Link href="https://aka.ms/msl-complex-queries" target="_blank" style={{ marginRight: 5 }}>
              Master Complex Queries
            </Link>
            <Image src={LinkIcon} />
          </Stack>
          <Text>Learn how to author complex queries using cross-products and correlated subqueries.</Text>
        </Stack>
        <Stack>
          <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
            <Link href="https://aka.ms/msl-move-data" target="_blank" style={{ marginRight: 5 }}>
              Migrate Your Data
            </Link>
            <Image src={LinkIcon} />
          </Stack>
          <Text>
            Migrate data into and out of Azure Cosmos DB SQL API using Azure services and open-source solutions.
          </Text>
        </Stack>
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
