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
import { makeStyles, shorthands } from "@fluentui/react-components";
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
import QuickStartIcon from "../../../images/Quickstart_Lightning.svg";
import VisualStudioIcon from "../../../images/VisualStudio.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import * as Constants from "../../Common/Constants";
import { userContext } from "../../UserContext";
import { getCollectionName } from "../../Utils/APITypeUtils";
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

const useStyles = makeStyles({
  splashScreenContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
  },
  splashScreen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "left",
  },
  title: {
    fontSize: "48px",
    fontWeight: "500",
    margin: "16px auto",
    color: "var(--colorNeutralForeground1)",
  },
  subtitle: {
    fontSize: "18px",
    marginBottom: "40px",
    color: "var(--colorNeutralForeground2)",
  },
  cardContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    width: "66%",
    margin: "0 auto",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "left",
    ...shorthands.padding("32px", "16px"),
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "4px",
    boxShadow: "var(--shadow4)",
    cursor: "pointer",
    minHeight: "150px",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginLeft: "16px",
    textAlign: "left",
    color: "var(--colorNeutralForeground1)",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    textAlign: "left",
    marginBottom: "8px",
  },
  cardDescription: {
    fontSize: "13px",
    color: "var(--colorNeutralForeground2)",
    textAlign: "left",
  },
  moreStuffContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "32px",
    width: "66%",
    margin: "40px auto",
  },
  moreStuffColumn: {
    display: "flex",
    flexDirection: "column",
  },
  columnTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "var(--colorNeutralForeground1)",
  },
  listItem: {
    marginBottom: "26px",
  },
  listItemTitle: {
    fontSize: "14px",
    color: "var(--colorBrandForegroundLink)",
    "&:hover": {
      color: "var(--colorBrandForegroundLink)",
    },
  },
  listItemSubtitle: {
    fontSize: "13px",
    color: "var(--colorNeutralForeground2)",
  },
});

export const SplashScreen: React.FC<SplashScreenProps> = ({ explorer }) => {
  const styles = useStyles();
  const container = explorer;
  const subscriptions: Array<{ dispose: () => void }> = [];

  React.useEffect(() => {
    subscriptions.push(
      {
        dispose: useNotebook.subscribe(
          () => setState({}),
          (state) => state.isNotebookEnabled,
        ),
      },
      { dispose: useSelectedNode.subscribe(() => setState({})) },
      {
        dispose: useCarousel.subscribe(
          () => setState({}),
          (state) => state.showCoachMark,
        ),
      },
      {
        dispose: usePostgres.subscribe(
          () => setState({}),
          (state) => state.showPostgreTeachingBubble,
        ),
      },
      {
        dispose: usePostgres.subscribe(
          () => setState({}),
          (state) => state.showResetPasswordBubble,
        ),
      },
      {
        dispose: useDatabases.subscribe(
          () => setState({}),
          (state) => state.sampleDataResourceTokenCollection,
        ),
      },
      {
        dispose: useQueryCopilot.subscribe(
          () => setState({}),
          (state) => state.copilotEnabled,
        ),
      },
    );

    return () => {
      while (subscriptions.length) {
        subscriptions.pop().dispose();
      }
    };
  }, []);

  // state is used to trigger re-renders when subscriptions emit
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [state, setState] = React.useState({});

  const clearMostRecent = () => {
    MostRecentActivity.clear(userContext.databaseAccount?.name);
    setState({});
  };

  const getSplashScreenButtons = (): JSX.Element => {
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
                container.onNewCollectionClicked({ isQuickstart: true });
                traceOpen(Action.LaunchQuickstart, { apiType: userContext.apiType });
              }}
            />
            <SplashScreenButton
              imgSrc={ContainersIcon}
              title={`New ${getCollectionName()}`}
              description={"Create a new container for storage and throughput"}
              onClick={() => {
                container.onNewCollectionClicked();
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

    const mainItems = createMainItems();
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
            onKeyPress={(event: React.KeyboardEvent) => onSplashScreenItemKeyPress(event, item.onClick)}
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

  const createMainItems = (): SplashScreenItem[] => {
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
            container.onNewCollectionClicked({ isQuickstart: true });
          }
          traceOpen(Action.LaunchQuickstart, { apiType: userContext.apiType });
        },
      };
      heroes.push(launchQuickstartBtn);
    }

    heroes.push(getShellCard());
    heroes.push(getThirdCard());
    return heroes;
  };

  const getShellCard = (): SplashScreenItem => {
    if (userContext.apiType === "Postgres") {
      return {
        iconSrc: PowerShellIcon,
        title: "PostgreSQL Shell",
        description: "Create table and interact with data using PostgreSQL's shell interface",
        onClick: () => container.openNotebookTerminal(TerminalKind.Postgres),
      };
    }

    if (userContext.apiType === "VCoreMongo") {
      return {
        iconSrc: PowerShellIcon,
        title: "Mongo Shell",
        description: "Create a collection and interact with data using MongoDB's shell interface",
        onClick: () => container.openNotebookTerminal(TerminalKind.VCoreMongo),
      };
    }

    return {
      iconSrc: ContainersIcon,
      title: `New ${getCollectionName()}`,
      description: "Create a new container for storage and throughput",
      onClick: () => {
        container.onNewCollectionClicked();
        traceOpen(Action.NewContainerHomepage, { apiType: userContext.apiType });
      },
    };
  };

  const getThirdCard = (): SplashScreenItem => {
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
      onClick = () => container?.openInVsCode && container.openInVsCode();
    }

    return {
      iconSrc: icon,
      title: title,
      description: description,
      onClick: onClick,
    };
  };

  const decorateOpenCollectionActivity = (activity: MostRecentActivity.OpenCollectionItem): SplashScreenItem => {
    return {
      iconSrc: CollectionIcon,
      title: activity.collectionId,
      description: getCollectionName(),
      onClick: () => {
        const collection = useDatabases.getState().findCollection(activity.databaseId, activity.collectionId);
        collection?.openTab();
      },
    };
  };

  const decorateOpenNotebookActivity = (activity: MostRecentActivity.OpenNotebookItem): SplashScreenItem => {
    return {
      info: activity.path,
      iconSrc: NotebookIcon,
      title: activity.name,
      description: "Notebook",
      onClick: () => {
        const notebookItem = container.createNotebookContentItemFile(activity.name, activity.path);
        notebookItem && container.openNotebook(notebookItem);
      },
    };
  };

  const createRecentItems = (): SplashScreenItem[] => {
    return MostRecentActivity.getItems(userContext.databaseAccount?.name).map((activity) => {
      switch (activity.type) {
        default: {
          const unknownActivity: never = activity;
          throw new Error(`Unknown activity: ${unknownActivity}`);
        }
        case MostRecentActivity.Type.OpenNotebook:
          return decorateOpenNotebookActivity(activity);

        case MostRecentActivity.Type.OpenCollection:
          return decorateOpenCollectionActivity(activity);
      }
    });
  };

  const onSplashScreenItemKeyPress = (event: React.KeyboardEvent, callback: () => void) => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      callback();
      event.stopPropagation();
    }
  };

  const top3Items = (): JSX.Element => {
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
                className={styles.listItemTitle}
              >
                {item.title}
              </Link>
              <Image src={LinkIcon} alt={item.title} />
            </Stack>
            <Text className={styles.listItemSubtitle}>{item.description}</Text>
          </Stack>
        ))}
      </Stack>
    );
  };

  const getRecentItems = (): JSX.Element => {
    const recentItems = createRecentItems()?.filter((item) => item.description !== "Notebook");

    return (
      <Stack>
        <ul>
          {recentItems.map((item, index) => (
            <li key={`${item.title}${item.description}${index}`} className={styles.listItem}>
              <Stack style={{ marginBottom: 26 }}>
                <Stack horizontal>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: 8 }}
                    fill="currentColor"
                  >
                    <path d="M4 4c0-1.1.9-2 2-2h3.59c.4 0 .78.16 1.06.44l3.91 3.91c.28.28.44.67.44 1.06V14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8h-3.5A1.5 1.5 0 0 1 9 6.5V3H6Zm4 .2v3.3c0 .28.22.5.5.5h3.3L10 3.2ZM17 9a1 1 0 0 0-1-1v6a3 3 0 0 1-3 3H6a1 1 0 0 0 1 1h6.06A3.94 3.94 0 0 0 17 14.06V9Z" />
                  </svg>
                  <Link
                    style={{ fontSize: 14 }}
                    onClick={item.onClick}
                    title={item.info}
                    className={styles.listItemTitle}
                  >
                    {item.title}
                  </Link>
                </Stack>
                <Text className={styles.listItemSubtitle}>{item.description}</Text>
              </Stack>
            </li>
          ))}
        </ul>
        {recentItems.length > 0 && (
          <Link onClick={() => clearMostRecent()} className={styles.listItemTitle}>
            Clear Recents
          </Link>
        )}
      </Stack>
    );
  };

  const getLearningResourceItems = (): JSX.Element => {
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
                className={styles.listItemTitle}
              >
                {item.title}
              </Link>
              <Image src={LinkIcon} alt={item.title} />
            </Stack>
            <Text className={styles.listItemSubtitle}>{item.description}</Text>
          </Stack>
        ))}
      </Stack>
    );
  };

  const postgresNextStepItems: { link: string; title: string; description: string }[] = [
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

  const vcoreMongoNextStepItems: { link: string; title: string; description: string }[] = [
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

  const getNextStepItems = (): JSX.Element => {
    const items = userContext.apiType === "Postgres" ? postgresNextStepItems : vcoreMongoNextStepItems;

    return (
      <Stack style={{ minWidth: 124, maxWidth: 296 }}>
        {items.map((item, i) => (
          <Stack key={`nextStep${i}`} style={{ marginBottom: 26 }}>
            <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
              <Link href={item.link} target="_blank" style={{ marginRight: 5 }} className={styles.listItemTitle}>
                {item.title}
              </Link>
              <Image src={LinkIcon} />
            </Stack>
            <Text className={styles.listItemSubtitle}>{item.description}</Text>
          </Stack>
        ))}
      </Stack>
    );
  };

  const postgresLearnMoreItems: { link: string; title: string; description: string }[] = [
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

  const vcoreMongoLearnMoreItems: { link: string; title: string; description: string }[] = [
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

  const getTipsAndLearnMoreItems = (): JSX.Element => {
    const items = userContext.apiType === "Postgres" ? postgresLearnMoreItems : vcoreMongoLearnMoreItems;

    return (
      <Stack style={{ minWidth: 124, maxWidth: 296 }}>
        {items.map((item, i) => (
          <Stack key={`tips${i}`} style={{ marginBottom: 26 }}>
            <Stack horizontal verticalAlign="center" style={{ fontSize: 14 }}>
              <Link href={item.link} target="_blank" style={{ marginRight: 5 }} className={styles.listItemTitle}>
                {item.title}
              </Link>
              <Image src={LinkIcon} />
            </Stack>
            <Text className={styles.listItemSubtitle}>{item.description}</Text>
          </Stack>
        ))}
      </Stack>
    );
  };

  return (
    <div className={styles.splashScreenContainer}>
      <div className={styles.splashScreen}>
        <h1 className={styles.title} role="heading" aria-label="Welcome to Azure Cosmos DB">
          Welcome to Azure Cosmos DB<span className="activePatch"></span>
        </h1>
        <div className={styles.subtitle}>Globally distributed, multi-model database service for any scale</div>
        {getSplashScreenButtons()}
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
                  container.onNewCollectionClicked({ isQuickstart: true });
                },
              }}
              secondaryButtonProps={{
                text: "Cancel",
                onClick: () => useCarousel.getState().setShowCoachMark(false),
              }}
              onDismiss={() => useCarousel.getState().setShowCoachMark(false)}
            >
              You will be guided to create a sample container with sample data, then we will give you a tour of data
              explorer. You can also cancel launching this tour and explore yourself
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
              {getNextStepItems()}
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
              {getTipsAndLearnMoreItems()}
            </Stack>
            <Stack style={{ width: "33%" }}></Stack>
          </Stack>
        ) : (
          <div className={styles.moreStuffContainer}>
            <div className={styles.moreStuffColumn}>
              <h2 className={styles.columnTitle}>Recents</h2>
              {getRecentItems()}
            </div>
            <div className={styles.moreStuffColumn}>
              <h2 className={styles.columnTitle}>Top 3 things you need to know</h2>
              {top3Items()}
            </div>
            <div className={styles.moreStuffColumn}>
              <h2 className={styles.columnTitle}>Learning Resources</h2>
              {getLearningResourceItems()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
