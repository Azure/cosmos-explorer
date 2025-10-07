/**
 * Accordion top class
 */
import {
  Coachmark,
  DirectionalHint,
  Image,
  Link,
  Stack,
  TeachingBubble,
  TeachingBubbleContent,
  Text,
} from "@fluentui/react";
import { sendMessage } from "Common/MessageHandler";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { TerminalKind } from "Contracts/ViewModels";
import { SplashScreenButton } from "Explorer/SplashScreen/SplashScreenButton";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceOpen } from "Shared/Telemetry/TelemetryProcessor";
import { useCarousel } from "hooks/useCarousel";
import { usePostgres } from "hooks/usePostgres";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import * as React from "react";
import ConnectIcon from "../../../images/Connect_color.svg";
import ContainersIcon from "../../../images/Containers.svg";
import CosmosDBIcon from "../../../images/CosmosDB-logo.svg";
import LinkIcon from "../../../images/Link_blue.svg";
import PowerShellIcon from "../../../images/PowerShell.svg";
import CopilotIcon from "../../../images/QueryCopilotNewLogo.svg";
import QuickStartIcon from "../../../images/Quickstart_Lightning.svg";
import VisualStudioIcon from "../../../images/VisualStudio.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import * as Constants from "../../Common/Constants";
import { userContext } from "../../UserContext";
import { getCollectionName } from "../../Utils/APITypeUtils";
import { FeaturePanelLauncher } from "../Controls/FeaturePanel/FeaturePanelLauncher";
import { DataSamplesUtil } from "../DataSamples/DataSamplesUtil";
import Explorer from "../Explorer";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";
import { useNotebook } from "../Notebook/useNotebook";
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

export class SplashScreen extends React.Component<SplashScreenProps> {
  private readonly container: Explorer;
  private subscriptions: Array<{ dispose: () => void }>;

  constructor(props: SplashScreenProps) {
    super(props);
    this.container = props.explorer;
    this.subscriptions = [];
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
          (state) => state.isNotebookEnabled,
        ),
      },
      { dispose: useSelectedNode.subscribe(() => this.setState({})) },
      {
        dispose: useCarousel.subscribe(
          () => this.setState({}),
          (state) => state.showCoachMark,
        ),
      },
      {
        dispose: usePostgres.subscribe(
          () => this.setState({}),
          (state) => state.showPostgreTeachingBubble,
        ),
      },
      {
        dispose: usePostgres.subscribe(
          () => this.setState({}),
          (state) => state.showResetPasswordBubble,
        ),
      },
      {
        dispose: useDatabases.subscribe(
          () => this.setState({}),
          (state) => state.sampleDataResourceTokenCollection,
        ),
      },
      {
        dispose: useQueryCopilot.subscribe(
          () => this.setState({}),
          (state) => state.copilotEnabled,
        ),
      },
    );
  }

  private clearMostRecent = (): void => {
    MostRecentActivity.clear(userContext.databaseAccount?.name);
    this.setState({});
  };

  private getSplashScreenButtons = (): JSX.Element => {
    if (userContext.apiType === "SQL") {
      return (
        <Stack
          className="splashStackContainer"
          style={{ width: "66%", cursor: "pointer", margin: "40px auto" }}
          tokens={{ childrenGap: 16 }}
        >
          <Stack className="splashStackRow" horizontal>
            <SplashScreenButton
              imgSrc={QuickStartIcon}
              title={"Launch quick start"}
              description={"Launch a quick start tutorial to get started with sample data"}
              onClick={() => {
                this.container.onNewCollectionClicked({ isQuickstart: true });
                traceOpen(Action.LaunchQuickstart, { apiType: userContext.apiType });
              }}
            />
            <SplashScreenButton
              imgSrc={ContainersIcon}
              title={`New ${getCollectionName()}`}
              description={"Create a new container for storage and throughput"}
              onClick={() => {
                this.container.onNewCollectionClicked();
                traceOpen(Action.NewContainerHomepage, { apiType: userContext.apiType });
              }}
            />
          </Stack>
          <Stack className="splashStackRow" horizontal>
            <SplashScreenButton
              imgSrc={CosmosDBIcon}
              imgSize={35}
              title={"Azure Cosmos DB Samples Gallery"}
              description={
                "Discover samples that showcase scalable, intelligent app patterns. Try one now to see how fast you can go from concept to code with Cosmos DB"
              }
              onClick={() => {
                window.open("https://azurecosmosdb.github.io/gallery/?tags=example", "_blank");
                traceOpen(Action.LearningResourcesClicked, { apiType: userContext.apiType });
              }}
            />
            <SplashScreenButton
              imgSrc={ConnectIcon}
              title={"Connect"}
              description={"Prefer using your own choice of tooling? Find the connection string you need to connect"}
              onClick={() => useTabs.getState().openAndActivateReactTab(ReactTabKind.Connect)}
            />
          </Stack>
        </Stack>
      );
    }

    const mainItems = this.createMainItems();
    return (
      <div className="mainButtonsContainer">
        {userContext.apiType === "Postgres" &&
          usePostgres.getState().showPostgreTeachingBubble &&
          !usePostgres.getState().showResetPasswordBubble && (
            <TeachingBubble
              headline="New to Cosmos DB PGSQL?"
              target={"#mainButton-quickstartDescription"}
              hasCloseButton
              onDismiss={() => usePostgres.getState().setShowPostgreTeachingBubble(false)}
              calloutProps={{
                directionalHint: DirectionalHint.rightCenter,
                directionalHintFixed: true,
                preventDismissOnLostFocus: true,
                preventDismissOnResize: true,
                preventDismissOnScroll: true,
              }}
              primaryButtonProps={{
                text: "Get started",
                onClick: () => {
                  useTabs.getState().openAndActivateReactTab(ReactTabKind.Quickstart);
                  usePostgres.getState().setShowPostgreTeachingBubble(false);
                },
              }}
            >
              Welcome! If you are new to Cosmos DB PGSQL and need help with getting started, here is where you can find
              sample data, query.
            </TeachingBubble>
          )}
        {/*TODO: convert below to use SplashScreenButton */}
        {mainItems.map((item) => (
          <Stack
            id={`mainButton-${item.id}`}
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

              <div id={item.id} className="newDescription">
                {item.description}
              </div>
            </div>
          </Stack>
        ))}
        {userContext.apiType === "Postgres" && usePostgres.getState().showResetPasswordBubble && (
          <TeachingBubble
            headline="Create your password"
            target={"#mainButton-quickstartDescription"}
            hasCloseButton
            onDismiss={() => {
              localStorage.setItem(userContext.databaseAccount.id, "true");
              usePostgres.getState().setShowResetPasswordBubble(false);
            }}
            calloutProps={{
              directionalHint: DirectionalHint.bottomRightEdge,
              directionalHintFixed: true,
              preventDismissOnLostFocus: true,
              preventDismissOnResize: true,
              preventDismissOnScroll: true,
            }}
            primaryButtonProps={{
              text: "Create",
              onClick: () => {
                localStorage.setItem(userContext.databaseAccount.id, "true");
                sendMessage({
                  type: MessageTypes.OpenPostgreSQLPasswordReset,
                });
                usePostgres.getState().setShowResetPasswordBubble(false);
              },
            }}
          >
            If you haven&apos;t changed your password yet, change it now.
          </TeachingBubble>
        )}
      </div>
    );
  };

  public render(): JSX.Element {
    let title: string;
    let subtitle: string;

    switch (userContext.apiType) {
      case "Postgres":
        title = "Welcome to Azure Cosmos DB for PostgreSQL";
        subtitle = "Get started with our sample datasets, documentation, and additional tools.";
        break;
      case "VCoreMongo":
        title = "Welcome to Azure DocumentDB (with MongoDB compatibility)";
        subtitle = "Get started with our sample datasets, documentation, and additional tools.";
        break;
      default:
        title = "Welcome to Azure Cosmos DB";
        subtitle = "Globally distributed, multi-model database service for any scale";
    }

    return (
      <div className="connectExplorerContainer">
        <form className="connectExplorerFormContainer">
          <div className="splashScreenContainer">
            <div className="splashScreen">
              <h2 className="title" role="heading" aria-label={title}>
                {title}
                <FeaturePanelLauncher />
              </h2>
              <div className="subtitle">{subtitle}</div>
              {this.getSplashScreenButtons()}
              {useCarousel.getState().showCoachMark && (
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
                        useCarousel.getState().setShowCoachMark(false);
                        this.container.onNewCollectionClicked({ isQuickstart: true });
                      },
                    }}
                    secondaryButtonProps={{
                      text: "Cancel",
                      onClick: () => useCarousel.getState().setShowCoachMark(false),
                    }}
                    onDismiss={() => useCarousel.getState().setShowCoachMark(false)}
                  >
                    You will be guided to create a sample container with sample data, then we will give you a tour of
                    data explorer. You can also cancel launching this tour and explore yourself
                  </TeachingBubbleContent>
                </Coachmark>
              )}
              {userContext.apiType === "Postgres" || userContext.apiType === "VCoreMongo" ? (
                <Stack horizontal style={{ margin: "0 auto", width: "84%" }} tokens={{ childrenGap: 16 }}>
                  <Stack style={{ width: "33%" }}>
                    <Text
                      variant="large"
                      style={{
                        marginBottom: 16,
                        fontFamily: '"Segoe UI Semibold", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
                      }}
                    >
                      Next steps
                    </Text>
                    {this.getNextStepItems()}
                  </Stack>
                  <Stack style={{ width: "33%" }}>
                    <Text
                      variant="large"
                      style={{
                        marginBottom: 16,
                        fontFamily: '"Segoe UI Semibold", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
                      }}
                    >
                      Tips & learn more
                    </Text>
                    {this.getTipsAndLearnMoreItems()}
                  </Stack>
                  <Stack style={{ width: "33%" }}></Stack>
                </Stack>
              ) : (
                <div className="moreStuffContainer">
                  <div className="moreStuffColumn commonTasks">
                    <h2 className="title">Recents</h2>
                    {this.getRecentItems()}
                  </div>
                  <div className="moreStuffColumn">
                    <h2 className="title">Top 3 things you need to know</h2>
                    {this.top3Items()}
                  </div>
                  <div className="moreStuffColumn tipsContainer">
                    <h2 className="title">Learning Resources</h2>
                    {this.getLearningResourceItems()}
                  </div>
                </div>
              )}
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

    if (
      userContext.apiType === "SQL" ||
      userContext.apiType === "Mongo" ||
      (userContext.apiType === "Postgres" && !userContext.isReplica) ||
      userContext.apiType === "VCoreMongo"
    ) {
      const launchQuickstartBtn = {
        id: "quickstartDescription",
        iconSrc: QuickStartIcon,
        title: "Launch quick start",
        description: "Launch a quick start tutorial to get started with sample data",
        onClick: () => {
          if (userContext.apiType === "Postgres" || userContext.apiType === "VCoreMongo") {
            useTabs.getState().openAndActivateReactTab(ReactTabKind.Quickstart);
          } else {
            this.container.onNewCollectionClicked({ isQuickstart: true });
          }
          traceOpen(Action.LaunchQuickstart, { apiType: userContext.apiType });
        },
      };
      heroes.push(launchQuickstartBtn);
    }

    heroes.push(this.getShellCard());
    heroes.push(this.getThirdCard());
    return heroes;
  }

  private getShellCard() {
    if (userContext.apiType === "Postgres") {
      return {
        iconSrc: PowerShellIcon,
        title: "PostgreSQL Shell",
        description: "Create table and interact with data using PostgreSQL’s shell interface",
        onClick: () => this.container.openNotebookTerminal(TerminalKind.Postgres),
      };
    }

    if (userContext.apiType === "VCoreMongo") {
      return {
        iconSrc: PowerShellIcon,
        title: "Mongo Shell",
        description: "Create a collection and interact with data using MongoDB's shell interface",
        onClick: () => this.container.openNotebookTerminal(TerminalKind.VCoreMongo),
      };
    }

    return {
      iconSrc: ContainersIcon,
      title: `New ${getCollectionName()}`,
      description: "Create a new container for storage and throughput",
      onClick: () => {
        this.container.onNewCollectionClicked();
        traceOpen(Action.NewContainerHomepage, { apiType: userContext.apiType });
      },
    };
  }

  private getThirdCard() {
    let icon = ConnectIcon;
    let title = "Connect";
    let description = "Prefer using your own choice of tooling? Find the connection string you need to connect";
    let onClick = () => useTabs.getState().openAndActivateReactTab(ReactTabKind.Connect);

    if (userContext.apiType === "Postgres") {
      title = "Connect with pgAdmin";
      description = "Prefer pgAdmin? Find your connection strings here";
    }

    if (userContext.apiType === "VCoreMongo") {
      icon = VisualStudioIcon;
      title = "Connect with VS Code";
      description = "Query and Manage your MongoDB and DocumentDB clusters in Visual Studio Code";
      onClick = () => this.container.openInVsCode();
    }

    return {
      iconSrc: icon,
      title: title,
      description: description,
      onClick: onClick,
    };
  }

  //TODO: Re-enable lint rule when query copilot is reinstated in DE
  /* eslint-disable-next-line no-unused-vars */
  private getQueryCopilotCard = (): JSX.Element => {
    return (
      <>
        {useQueryCopilot.getState().copilotEnabled && (
          <SplashScreenButton
            imgSrc={CopilotIcon}
            title={"Query faster with Query Advisor"}
            description={
              "Query Advisor is your AI buddy that helps you write Azure Cosmos DB queries like a pro. Try it using our sample data set now!"
            }
            onClick={() => {
              const copilotVersion = userContext.features.copilotVersion;
              if (copilotVersion === "v1.0") {
                useTabs.getState().openAndActivateReactTab(ReactTabKind.QueryCopilot);
              } else if (copilotVersion === "v2.0") {
                const sampleCollection = useDatabases.getState().sampleDataResourceTokenCollection;
                sampleCollection.onNewQueryClick(sampleCollection, undefined);
              }
              traceOpen(Action.OpenQueryCopilotFromSplashScreen, { apiType: userContext.apiType });
            }}
          />
        )}
      </>
    );
  };

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
    return MostRecentActivity.getItems(userContext.databaseAccount?.name).map((activity) => {
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

  private onSplashScreenItemKeyPress(event: React.KeyboardEvent, callback: () => void) {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      callback();
      event.stopPropagation();
    }
  }

  private top3Items(): JSX.Element {
    let items: { link: string; title: string; description: string }[];
    switch (userContext.apiType) {
      case "SQL":
      case "Postgres":
        items = [
          {
            link: "https://aka.ms/msl-modeling-partitioning-2",
            title: "Advanced Modeling Patterns",
            description: "Learn advanced strategies to optimize your database.",
          },
          {
            link: "https://aka.ms/msl-modeling-partitioning-1",
            title: "Partitioning Best Practices",
            description: "Learn to apply data model and partitioning strategies.",
          },
          {
            link: "https://aka.ms/msl-resource-planning",
            title: "Plan Your Resource Requirements",
            description: "Get to know the different configuration choices.",
          },
        ];
        break;
      case "Mongo":
        items = [
          {
            link: "https://aka.ms/mongodbintro",
            title: "What is the MongoDB API?",
            description: "Understand Azure Cosmos DB for MongoDB and its features.",
          },
          {
            link: "https://aka.ms/mongodbfeaturesupport",
            title: "Features and Syntax",
            description: "Discover the advantages and features",
          },
          {
            link: "https://aka.ms/mongodbpremigration",
            title: "Migrate Your Data",
            description: "Pre-migration steps for moving data",
          },
        ];
        break;
      case "Cassandra":
        items = [
          {
            link: "https://aka.ms/cassandrajava",
            title: "Build a Java App",
            description: "Create a Java app using an SDK.",
          },
          {
            link: "https://aka.ms/cassandrapartitioning",
            title: "Partitioning Best Practices",
            description: "Learn how partitioning works.",
          },
          {
            link: "https://aka.ms/cassandraRu",
            title: "Request Units (RUs)",
            description: "Understand RU charges.",
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
            description: "Learn how partitioning works",
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
            title: "What is the Table API?",
            description: "Understand Azure Cosmos DB for Table and its features",
          },
          {
            link: "https://aka.ms/tableimport",
            title: "Migrate your data",
            description: "Learn how to migrate your data",
          },
          {
            link: "https://aka.ms/tablefaq",
            title: "Azure Cosmos DB for Table FAQs",
            description: "Common questions about Azure Cosmos DB for Table",
          },
        ];
        break;
      default:
        break;
    }
    return (
      <Stack>
        {items.map((item, i) => (
          <Stack key={`top${i}`} style={{ marginBottom: 26 }}>
            <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
              <Link
                onClick={() => traceOpen(Action.Top3ItemsClicked, { item: i + 1, apiType: userContext.apiType })}
                href={item.link}
                target="_blank"
                style={{ marginRight: 5 }}
              >
                {item.title}
              </Link>
              <Image src={LinkIcon} alt={item.title} />
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
                  <Image style={{ marginRight: 8 }} src={item.iconSrc} alt={item.title} />
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
    interface item {
      link: string;
      title: string;
      description: string;
    }
    const cdbLiveTv: item = {
      link: "https://developer.azurecosmosdb.com/tv",
      title: "Learn the Fundamentals",
      description: "Watch Azure Cosmos DB Live TV show introductory and how to videos.",
    };

    const commonItems: item[] = [
      {
        link: "https://learn.microsoft.com/azure/cosmos-db/data-explorer-shortcuts",
        title: "Data Explorer keyboard shortcuts",
        description: "Learn keyboard shortcuts to navigate Data Explorer.",
      },
    ];

    let apiItems: item[];
    switch (userContext.apiType) {
      case "SQL":
      case "Postgres":
        apiItems = [
          {
            link: "https://aka.ms/msl-sdk-connect",
            title: "Get Started using an SDK",
            description: "Learn about the Azure Cosmos DB SDK.",
          },
          cdbLiveTv,
          {
            link: "https://aka.ms/msl-move-data",
            title: "Migrate Your Data",
            description: "Migrate data using Azure services and open-source solutions.",
          },
        ];
        break;
      case "Mongo":
        apiItems = [
          {
            link: "https://aka.ms/mongonodejs",
            title: "Build an app with Node.js",
            description: "Create a Node.js app.",
          },
          {
            link: "https://aka.ms/mongopython",
            title: "Getting Started Guide",
            description: "Learn the basics to get started.",
          },
          cdbLiveTv,
        ];
        break;
      case "Cassandra":
        apiItems = [
          {
            link: "https://aka.ms/cassandracontainer",
            title: "Create a Container",
            description: "Get to know the create a container options.",
          },
          cdbLiveTv,
          {
            link: "https://aka.ms/Cassandrathroughput",
            title: "Provision Throughput",
            description: "Learn how to configure throughput.",
          },
        ];
        break;
      case "Gremlin":
        apiItems = [
          {
            link: "https://aka.ms/graphquickstart",
            title: "Get Started ",
            description: "Create, query, and traverse using the Gremlin console",
          },
          {
            link: "https://aka.ms/graphimport",
            title: "Import Graph Data",
            description: "Learn Bulk ingestion data using BulkExecutor",
          },
          cdbLiveTv,
        ];
        break;
      case "Tables":
        apiItems = [
          {
            link: "https://aka.ms/tabledotnet",
            title: "Build a .NET App",
            description: "How to access Azure Cosmos DB for Table from a .NET app.",
          },
          {
            link: "https://aka.ms/Tablejava",
            title: "Build a Java App",
            description: "Create a Azure Cosmos DB for Table app with Java SDK ",
          },
          cdbLiveTv,
        ];
        break;
      default:
        break;
    }

    const items = [...commonItems, ...apiItems];

    return (
      <Stack>
        {items.map((item, i) => (
          <Stack key={`learningResource${i}`} style={{ marginBottom: 26 }}>
            <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
              <Link
                onClick={() =>
                  traceOpen(Action.LearningResourcesClicked, { item: i + 1, apiType: userContext.apiType })
                }
                href={item.link}
                target="_blank"
                style={{ marginRight: 5 }}
              >
                {item.title}
              </Link>
              <Image src={LinkIcon} alt={item.title} />
            </Stack>
            <Text>{item.description}</Text>
          </Stack>
        ))}
      </Stack>
    );
  }

  private postgresNextStepItems: { link: string; title: string; description: string }[] = [
    {
      link: "https://go.microsoft.com/fwlink/?linkid=2208312",
      title: "Data Modeling",
      description: "",
    },
    {
      link: " https://go.microsoft.com/fwlink/?linkid=2206941 ",
      title: "How to choose a Distribution Column",
      description: "",
    },
    {
      link: "https://go.microsoft.com/fwlink/?linkid=2207425",
      title: "Build Apps with Python/Java/Django",
      description: "",
    },
  ];

  private vcoreMongoNextStepItems: { link: string; title: string; description: string }[] = [
    {
      link: "https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/migration-options",
      title: "Migrate Data",
      description: "",
    },
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/vector-search-ai",
      title: "Build AI apps with Vector Search",
      description: "",
    },
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/tutorial-nodejs-web-app?tabs=github-codespaces",
      title: "Build Apps with Nodejs",
      description: "",
    },
  ];

  private getNextStepItems(): JSX.Element {
    const items = userContext.apiType === "Postgres" ? this.postgresNextStepItems : this.vcoreMongoNextStepItems;

    return (
      <Stack style={{ minWidth: 124, maxWidth: 296 }}>
        {items.map((item, i) => (
          <Stack key={`nextStep${i}`} style={{ marginBottom: 26 }}>
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

  private postgresLearnMoreItems: { link: string; title: string; description: string }[] = [
    {
      link: "https://go.microsoft.com/fwlink/?linkid=2207226",
      title: "Performance Tuning",
      description: "",
    },
    {
      link: "https://go.microsoft.com/fwlink/?linkid=2208037",
      title: "Useful Diagnostic Queries",
      description: "",
    },
    {
      link: "https://go.microsoft.com/fwlink/?linkid=2205270",
      title: "Distributed SQL Reference",
      description: "",
    },
  ];

  private vcoreMongoLearnMoreItems: { link: string; title: string; description: string }[] = [
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/vector-search",
      title: "Vector Search",
      description: "",
    },
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/how-to-create-text-index",
      title: "Text Indexing",
      description: "",
    },
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/troubleshoot-common-issues",
      title: "Troubleshoot common issues",
      description: "",
    },
  ];

  private getTipsAndLearnMoreItems(): JSX.Element {
    const items = userContext.apiType === "Postgres" ? this.postgresLearnMoreItems : this.vcoreMongoLearnMoreItems;

    return (
      <Stack style={{ minWidth: 124, maxWidth: 296 }}>
        {items.map((item, i) => (
          <Stack key={`tips${i}`} style={{ marginBottom: 26 }}>
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
}
