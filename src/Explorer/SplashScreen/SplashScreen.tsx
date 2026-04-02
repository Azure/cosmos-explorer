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
import { Keys, t } from "Localization";
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
import DocumentIcon from "../../../images/DocumentIcon.svg";
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
    height: "100%",
    overflowY: "auto",
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
    fontWeight: "400",
    margin: "16px auto",
    color: "var(--colorNeutralForeground1)",
  },
  subtitle: {
    fontSize: "18px",
    color: "var(--colorNeutralForeground2)",
  },
  cardContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    width: "60%",
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
    boxShadow: "rgba(0, 0, 0, 0.25) 0px 4px 4px",
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
    display: "flex",
    justifyContent: "space-between",
    gap: "32px",
    width: "90%",
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

  let title: string;
  let subtitle: string;

  switch (userContext.apiType) {
    case "Postgres":
      title = t(Keys.splashScreen.title.postgres);
      subtitle = t(Keys.splashScreen.subtitle.getStarted);
      break;
    case "VCoreMongo":
      title = t(Keys.splashScreen.title.vcoreMongo);
      subtitle = t(Keys.splashScreen.subtitle.getStarted);
      break;
    default:
      title = t(Keys.splashScreen.title.default);
      subtitle = t(Keys.splashScreen.subtitle.default);
  }

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
          style={{ width: "60%", cursor: "pointer", margin: "40px auto" }}
          tokens={{ childrenGap: 16 }}
        >
          <Stack className="splashStackRow" horizontal>
            <SplashScreenButton
              imgSrc={QuickStartIcon}
              title={t(Keys.splashScreen.quickStart.title)}
              description={t(Keys.splashScreen.quickStart.description)}
              onClick={() => {
                container.onNewCollectionClicked({ isQuickstart: true });
                traceOpen(Action.LaunchQuickstart, { apiType: userContext.apiType });
              }}
            />
            <SplashScreenButton
              imgSrc={ContainersIcon}
              title={t(Keys.splashScreen.newCollection.title, { collectionName: getCollectionName() })}
              description={t(Keys.splashScreen.newCollection.description)}
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
              title={t(Keys.splashScreen.samplesGallery.title)}
              description={t(Keys.splashScreen.samplesGallery.description)}
              onClick={() => {
                window.open("https://azurecosmosdb.github.io/gallery/?tags=example", "_blank");
                traceOpen(Action.LearningResourcesClicked, { apiType: userContext.apiType });
              }}
            />
            <SplashScreenButton
              imgSrc={ConnectIcon}
              title={t(Keys.splashScreen.connectCard.title)}
              description={t(Keys.splashScreen.connectCard.description)}
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
              headline={t(Keys.splashScreen.teachingBubble.newToPostgres.headline)}
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
                text: t(Keys.common.getStarted),
                onClick: () => {
                  useTabs.getState().openAndActivateReactTab(ReactTabKind.Quickstart);
                  usePostgres.getState().setShowPostgreTeachingBubble(false);
                },
              }}
            >
              {t(Keys.splashScreen.teachingBubble.newToPostgres.body)}
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
            headline={t(Keys.splashScreen.teachingBubble.resetPassword.headline)}
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
              text: t(Keys.common.create),
              onClick: () => {
                localStorage.setItem(userContext.databaseAccount.id, "true");
                sendMessage({
                  type: MessageTypes.OpenPostgreSQLPasswordReset,
                });
                usePostgres.getState().setShowResetPasswordBubble(false);
              },
            }}
          >
            {t(Keys.splashScreen.teachingBubble.resetPassword.body)}
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
        title: t(Keys.splashScreen.quickStart.title),
        description: t(Keys.splashScreen.quickStart.description),
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
        title: t(Keys.splashScreen.shell.postgres.title),
        description: t(Keys.splashScreen.shell.postgres.description),
        onClick: () => container.openNotebookTerminal(TerminalKind.Postgres),
      };
    }

    if (userContext.apiType === "VCoreMongo") {
      return {
        iconSrc: PowerShellIcon,
        title: t(Keys.splashScreen.shell.vcoreMongo.title),
        description: t(Keys.splashScreen.shell.vcoreMongo.description),
        onClick: () => container.openNotebookTerminal(TerminalKind.VCoreMongo),
      };
    }

    return {
      iconSrc: ContainersIcon,
      title: t(Keys.splashScreen.newCollection.title, { collectionName: getCollectionName() }),
      description: t(Keys.splashScreen.newCollection.description),
      onClick: () => {
        container.onNewCollectionClicked();
        traceOpen(Action.NewContainerHomepage, { apiType: userContext.apiType });
      },
    };
  };

  const getThirdCard = (): SplashScreenItem => {
    let icon = ConnectIcon;
    let title = t(Keys.splashScreen.connectCard.title);
    let description = t(Keys.splashScreen.connectCard.description);
    let onClick = () => useTabs.getState().openAndActivateReactTab(ReactTabKind.Connect);

    if (userContext.apiType === "Postgres") {
      title = t(Keys.splashScreen.connectCard.pgAdmin.title);
      description = t(Keys.splashScreen.connectCard.pgAdmin.description);
    }

    if (userContext.apiType === "VCoreMongo") {
      icon = VisualStudioIcon;
      title = t(Keys.splashScreen.connectCard.vsCode.title);
      description = t(Keys.splashScreen.connectCard.vsCode.description);
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
      description: t(Keys.splashScreen.sections.notebook),
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
            title: t(Keys.splashScreen.top3Items.sql.advancedModeling.title),
            description: t(Keys.splashScreen.top3Items.sql.advancedModeling.description),
          },
          {
            link: "https://aka.ms/msl-modeling-partitioning-1",
            title: t(Keys.splashScreen.top3Items.sql.partitioning.title),
            description: t(Keys.splashScreen.top3Items.sql.partitioning.description),
          },
          {
            link: "https://aka.ms/msl-resource-planning",
            title: t(Keys.splashScreen.top3Items.sql.resourcePlanning.title),
            description: t(Keys.splashScreen.top3Items.sql.resourcePlanning.description),
          },
        ];
        break;
      case "Mongo":
        items = [
          {
            link: "https://aka.ms/mongodbintro",
            title: t(Keys.splashScreen.top3Items.mongo.whatIsMongo.title),
            description: t(Keys.splashScreen.top3Items.mongo.whatIsMongo.description),
          },
          {
            link: "https://aka.ms/mongodbfeaturesupport",
            title: t(Keys.splashScreen.top3Items.mongo.features.title),
            description: t(Keys.splashScreen.top3Items.mongo.features.description),
          },
          {
            link: "https://aka.ms/mongodbpremigration",
            title: t(Keys.splashScreen.top3Items.mongo.migrate.title),
            description: t(Keys.splashScreen.top3Items.mongo.migrate.description),
          },
        ];
        break;
      case "Cassandra":
        items = [
          {
            link: "https://aka.ms/cassandrajava",
            title: t(Keys.splashScreen.top3Items.cassandra.buildJavaApp.title),
            description: t(Keys.splashScreen.top3Items.cassandra.buildJavaApp.description),
          },
          {
            link: "https://aka.ms/cassandrapartitioning",
            title: t(Keys.splashScreen.top3Items.cassandra.partitioning.title),
            description: t(Keys.splashScreen.top3Items.cassandra.partitioning.description),
          },
          {
            link: "https://aka.ms/cassandraRu",
            title: t(Keys.splashScreen.top3Items.cassandra.requestUnits.title),
            description: t(Keys.splashScreen.top3Items.cassandra.requestUnits.description),
          },
        ];
        break;
      case "Gremlin":
        items = [
          {
            link: "https://aka.ms/Graphdatamodeling",
            title: t(Keys.splashScreen.top3Items.gremlin.dataModeling.title),
            description: t(Keys.splashScreen.top3Items.gremlin.dataModeling.description),
          },
          {
            link: "https://aka.ms/graphpartitioning",
            title: t(Keys.splashScreen.top3Items.gremlin.partitioning.title),
            description: t(Keys.splashScreen.top3Items.gremlin.partitioning.description),
          },
          {
            link: "https://aka.ms/graphapiquery",
            title: t(Keys.splashScreen.top3Items.gremlin.queryData.title),
            description: t(Keys.splashScreen.top3Items.gremlin.queryData.description),
          },
        ];
        break;
      case "Tables":
        items = [
          {
            link: "https://aka.ms/tableintro",
            title: t(Keys.splashScreen.top3Items.tables.whatIsTable.title),
            description: t(Keys.splashScreen.top3Items.tables.whatIsTable.description),
          },
          {
            link: "https://aka.ms/tableimport",
            title: t(Keys.splashScreen.top3Items.tables.migrate.title),
            description: t(Keys.splashScreen.top3Items.tables.migrate.description),
          },
          {
            link: "https://aka.ms/tablefaq",
            title: t(Keys.splashScreen.top3Items.tables.faq.title),
            description: t(Keys.splashScreen.top3Items.tables.faq.description),
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
                  <Image src={DocumentIcon} alt="" style={{ marginRight: 8, width: 16, height: 16 }} />
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
            {t(Keys.splashScreen.sections.clearRecents)}
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
      title: t(Keys.splashScreen.learningResources.liveTv.title),
      description: t(Keys.splashScreen.learningResources.liveTv.description),
    };

    const commonItems: item[] = [
      {
        link: "https://learn.microsoft.com/azure/cosmos-db/data-explorer-shortcuts",
        title: t(Keys.splashScreen.learningResources.shortcuts.title),
        description: t(Keys.splashScreen.learningResources.shortcuts.description),
      },
    ];

    let apiItems: item[];
    switch (userContext.apiType) {
      case "SQL":
      case "Postgres":
        apiItems = [
          {
            link: "https://aka.ms/msl-sdk-connect",
            title: t(Keys.splashScreen.learningResources.sql.sdk.title),
            description: t(Keys.splashScreen.learningResources.sql.sdk.description),
          },
          cdbLiveTv,
          {
            link: "https://aka.ms/msl-move-data",
            title: t(Keys.splashScreen.learningResources.sql.migrate.title),
            description: t(Keys.splashScreen.learningResources.sql.migrate.description),
          },
        ];
        break;
      case "Mongo":
        apiItems = [
          {
            link: "https://aka.ms/mongonodejs",
            title: t(Keys.splashScreen.learningResources.mongo.nodejs.title),
            description: t(Keys.splashScreen.learningResources.mongo.nodejs.description),
          },
          {
            link: "https://aka.ms/mongopython",
            title: t(Keys.splashScreen.learningResources.mongo.gettingStarted.title),
            description: t(Keys.splashScreen.learningResources.mongo.gettingStarted.description),
          },
          cdbLiveTv,
        ];
        break;
      case "Cassandra":
        apiItems = [
          {
            link: "https://aka.ms/cassandracontainer",
            title: t(Keys.splashScreen.learningResources.cassandra.createContainer.title),
            description: t(Keys.splashScreen.learningResources.cassandra.createContainer.description),
          },
          cdbLiveTv,
          {
            link: "https://aka.ms/Cassandrathroughput",
            title: t(Keys.splashScreen.learningResources.cassandra.throughput.title),
            description: t(Keys.splashScreen.learningResources.cassandra.throughput.description),
          },
        ];
        break;
      case "Gremlin":
        apiItems = [
          {
            link: "https://aka.ms/graphquickstart",
            title: t(Keys.splashScreen.learningResources.gremlin.getStarted.title),
            description: t(Keys.splashScreen.learningResources.gremlin.getStarted.description),
          },
          {
            link: "https://aka.ms/graphimport",
            title: t(Keys.splashScreen.learningResources.gremlin.importData.title),
            description: t(Keys.splashScreen.learningResources.gremlin.importData.description),
          },
          cdbLiveTv,
        ];
        break;
      case "Tables":
        apiItems = [
          {
            link: "https://aka.ms/tabledotnet",
            title: t(Keys.splashScreen.learningResources.tables.dotnet.title),
            description: t(Keys.splashScreen.learningResources.tables.dotnet.description),
          },
          {
            link: "https://aka.ms/Tablejava",
            title: t(Keys.splashScreen.learningResources.tables.java.title),
            description: t(Keys.splashScreen.learningResources.tables.java.description),
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
      title: t(Keys.splashScreen.nextStepItems.postgres.dataModeling),
      description: "",
    },
    {
      link: " https://go.microsoft.com/fwlink/?linkid=2206941 ",
      title: t(Keys.splashScreen.nextStepItems.postgres.distributionColumn),
      description: "",
    },
    {
      link: "https://go.microsoft.com/fwlink/?linkid=2207425",
      title: t(Keys.splashScreen.nextStepItems.postgres.buildApps),
      description: "",
    },
  ];

  const vcoreMongoNextStepItems: { link: string; title: string; description: string }[] = [
    {
      link: "https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/migration-options",
      title: t(Keys.splashScreen.nextStepItems.vcoreMongo.migrateData),
      description: "",
    },
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/vector-search-ai",
      title: t(Keys.splashScreen.nextStepItems.vcoreMongo.vectorSearch),
      description: "",
    },
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/tutorial-nodejs-web-app?tabs=github-codespaces",
      title: t(Keys.splashScreen.nextStepItems.vcoreMongo.buildApps),
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
      title: t(Keys.splashScreen.learnMoreItems.postgres.performanceTuning),
      description: "",
    },
    {
      link: "https://go.microsoft.com/fwlink/?linkid=2208037",
      title: t(Keys.splashScreen.learnMoreItems.postgres.diagnosticQueries),
      description: "",
    },
    {
      link: "https://go.microsoft.com/fwlink/?linkid=2205270",
      title: t(Keys.splashScreen.learnMoreItems.postgres.sqlReference),
      description: "",
    },
  ];

  const vcoreMongoLearnMoreItems: { link: string; title: string; description: string }[] = [
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/vector-search",
      title: t(Keys.splashScreen.learnMoreItems.vcoreMongo.vectorSearch),
      description: "",
    },
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/how-to-create-text-index",
      title: t(Keys.splashScreen.learnMoreItems.vcoreMongo.textIndexing),
      description: "",
    },
    {
      link: "https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/troubleshoot-common-issues",
      title: t(Keys.splashScreen.learnMoreItems.vcoreMongo.troubleshoot),
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
        <h2 className={styles.title} role="heading" aria-label={title}>
          {title}
          <span className="activePatch"></span>
        </h2>
        <div className={styles.subtitle}>{subtitle}</div>
        {getSplashScreenButtons()}
        {useCarousel.getState().showCoachMark && (
          <Coachmark
            target="#quickstartDescription"
            positioningContainerProps={{ directionalHint: DirectionalHint.rightTopEdge }}
            persistentBeak
          >
            <TeachingBubbleContent
              headline={t(Keys.splashScreen.teachingBubble.coachMark.headline, {
                collectionName: getCollectionName().toLocaleLowerCase(),
              })}
              hasCloseButton
              closeButtonAriaLabel={t(Keys.common.close)}
              primaryButtonProps={{
                text: t(Keys.common.getStarted),
                onClick: () => {
                  useCarousel.getState().setShowCoachMark(false);
                  container.onNewCollectionClicked({ isQuickstart: true });
                },
              }}
              secondaryButtonProps={{
                text: t(Keys.common.cancel),
                onClick: () => useCarousel.getState().setShowCoachMark(false),
              }}
              onDismiss={() => useCarousel.getState().setShowCoachMark(false)}
            >
              {t(Keys.splashScreen.teachingBubble.coachMark.body)}
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
                {t(Keys.splashScreen.sections.nextSteps)}
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
                {t(Keys.splashScreen.sections.tipsAndLearnMore)}
              </Text>
              {getTipsAndLearnMoreItems()}
            </Stack>
            <Stack style={{ width: "33%" }}></Stack>
          </Stack>
        ) : (
          <div className={styles.moreStuffContainer}>
            <div className={styles.moreStuffColumn}>
              <h2 className={styles.columnTitle}>{t(Keys.splashScreen.sections.recents)}</h2>
              {getRecentItems()}
            </div>
            <div className={styles.moreStuffColumn}>
              <h2 className={styles.columnTitle}>{t(Keys.splashScreen.sections.top3)}</h2>
              {top3Items()}
            </div>
            <div className={styles.moreStuffColumn}>
              <h2 className={styles.columnTitle}>{t(Keys.splashScreen.sections.learningResources)}</h2>
              {getLearningResourceItems()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
