import { Link, MessageBar, MessageBarButton, MessageBarType } from "@fluentui/react";
import { CassandraProxyEndpoints, MongoProxyEndpoints } from "Common/Constants";
import { sendMessage } from "Common/MessageHandler";
import { Platform, configContext, updateConfigContext } from "ConfigContext";
import { IpRule } from "Contracts/DataModels";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { CollectionTabKind } from "Contracts/ViewModels";
import Explorer from "Explorer/Explorer";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { QueryCopilotTab } from "Explorer/QueryCopilot/QueryCopilotTab";
import { SplashScreen } from "Explorer/SplashScreen/SplashScreen";
import { ConnectTab } from "Explorer/Tabs/ConnectTab";
import { PostgresConnectTab } from "Explorer/Tabs/PostgresConnectTab";
import { QuickstartTab } from "Explorer/Tabs/QuickstartTab";
import { VcoreMongoConnectTab } from "Explorer/Tabs/VCoreMongoConnectTab";
import { VcoreMongoQuickstartTab } from "Explorer/Tabs/VCoreMongoQuickstartTab";
import { KeyboardAction, KeyboardActionGroup, useKeyboardActionGroup } from "KeyboardShortcuts";
import { hasRUThresholdBeenConfigured } from "Shared/StorageUtility";
import { userContext } from "UserContext";
import { CassandraProxyOutboundIPs, MongoProxyOutboundIPs, PortalBackendIPs } from "Utils/EndpointUtils";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import ko from "knockout";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import loadingIcon from "../../../images/circular_loader_black_16x16.gif";
import errorIcon from "../../../images/close-black.svg";
import errorQuery from "../../../images/error_no_outline.svg";
import { useObservable } from "../../hooks/useObservable";
import { ReactTabKind, useTabs } from "../../hooks/useTabs";
import TabsBase from "./TabsBase";

type Tab = TabsBase | (TabsBase & { render: () => JSX.Element });

interface TabsProps {
  explorer: Explorer;
}

export const Tabs = ({ explorer }: TabsProps): JSX.Element => {
  const { openedTabs, openedReactTabs, activeTab, activeReactTab, networkSettingsWarning } = useTabs();
  const [showRUThresholdMessageBar, setShowRUThresholdMessageBar] = useState<boolean>(
    userContext.apiType === "SQL" && configContext.platform !== Platform.Fabric && !hasRUThresholdBeenConfigured(),
  );
  const [
    showMongoAndCassandraProxiesNetworkSettingsWarningState,
    setShowMongoAndCassandraProxiesNetworkSettingsWarningState,
  ] = useState<boolean>(showMongoAndCassandraProxiesNetworkSettingsWarning());

  const setKeyboardHandlers = useKeyboardActionGroup(KeyboardActionGroup.TABS);
  useEffect(() => {
    setKeyboardHandlers({
      [KeyboardAction.SELECT_LEFT_TAB]: () => useTabs.getState().selectLeftTab(),
      [KeyboardAction.SELECT_RIGHT_TAB]: () => useTabs.getState().selectRightTab(),
      [KeyboardAction.CLOSE_TAB]: () => useTabs.getState().closeActiveTab(),
    });
  }, [setKeyboardHandlers]);

  return (
    <div className="tabsManagerContainer">
      {networkSettingsWarning && (
        <MessageBar
          messageBarType={MessageBarType.warning}
          actions={
            <MessageBarButton
              onClick={() =>
                sendMessage({
                  type:
                    userContext.apiType === "VCoreMongo"
                      ? MessageTypes.OpenVCoreMongoNetworkingBlade
                      : MessageTypes.OpenPostgresNetworkingBlade,
                })
              }
            >
              Change network settings
            </MessageBarButton>
          }
          messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
        >
          {networkSettingsWarning}
        </MessageBar>
      )}
      {showRUThresholdMessageBar && (
        <MessageBar
          messageBarType={MessageBarType.info}
          onDismiss={() => {
            setShowRUThresholdMessageBar(false);
          }}
          styles={{
            innerText: {
              fontWeight: "bold",
            },
          }}
        >
          {`To prevent queries from using excessive RUs, Data Explorer has a 5,000 RU default limit. To modify or remove
          the limit, go to the Settings cog on the right and find "RU Threshold".`}
          <Link
            className="underlinedLink"
            href="https://review.learn.microsoft.com/en-us/azure/cosmos-db/data-explorer?branch=main#configure-request-unit-threshold"
            target="_blank"
          >
            Learn More
          </Link>
        </MessageBar>
      )}
      {showMongoAndCassandraProxiesNetworkSettingsWarningState && (
        <MessageBar
          messageBarType={MessageBarType.warning}
          onDismiss={() => {
            setShowMongoAndCassandraProxiesNetworkSettingsWarningState(false);
          }}
        >
          {`We are moving our middleware to new infrastructure. To avoid future issues with Data Explorer access, please
          re-enable "Allow access from Azure Portal" on the Networking blade for your account.`}
        </MessageBar>
      )}
      <div id="content" className="flexContainer hideOverflows">
        <div className="nav-tabs-margin">
          <ul className="nav nav-tabs level navTabHeight" id="navTabs" role="tablist">
            {openedReactTabs.map((tab) => (
              <TabNav key={ReactTabKind[tab]} active={activeReactTab === tab} tabKind={tab} />
            ))}
            {openedTabs.map((tab) => (
              <TabNav key={tab.tabId} tab={tab} active={activeTab === tab} />
            ))}
          </ul>
        </div>
        <div className="tabPanesContainer">
          {activeReactTab !== undefined && getReactTabContent(activeReactTab, explorer)}
          {openedTabs.map((tab) => (
            <TabPane key={tab.tabId} tab={tab} active={activeTab === tab} />
          ))}
        </div>
      </div>
    </div>
  );
};

function TabNav({ tab, active, tabKind }: { tab?: Tab; active: boolean; tabKind?: ReactTabKind }) {
  const [hovering, setHovering] = useState(false);
  const focusTab = useRef<HTMLLIElement>() as MutableRefObject<HTMLLIElement>;
  const tabId = tab ? tab.tabId : "";

  const getReactTabTitle = (): ko.Observable<string> => {
    if (tabKind === ReactTabKind.QueryCopilot) {
      return ko.observable("Query");
    }
    return ko.observable(ReactTabKind[tabKind]);
  };

  useEffect(() => {
    if (active && focusTab.current) {
      focusTab.current.focus();
    }
  }, [active]);
  return (
    <li
      onMouseOver={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={active ? "active tabList" : "tabList"}
      style={active ? { fontWeight: "bolder" } : {}}
    >
      <span className="tabNavContentContainer">
        <div className="tab_Content">
          <span
            className="contentWrapper"
            onClick={() => {
              if (tab) {
                tab.onTabClick();
              } else if (tabKind !== undefined) {
                useTabs.getState().activateReactTab(tabKind);
              }
            }}
            onKeyPress={({ nativeEvent: e }) => {
              if (tab) {
                tab.onKeyPressActivate(undefined, e);
              } else if (tabKind !== undefined) {
                onKeyPressReactTab(e, tabKind);
              }
            }}
            title={useObservable(tab?.tabPath || ko.observable(""))}
            aria-selected={active}
            aria-expanded={active}
            aria-controls={tabId}
            tabIndex={0}
            role="tab"
            ref={focusTab}
          >
            <span className="statusIconContainer" style={{ width: tabKind === ReactTabKind.Home ? 0 : 18 }}>
              {useObservable(tab?.isExecutionError || ko.observable(false)) && <ErrorIcon tab={tab} active={active} />}
              {isTabExecuting(tab, tabKind) && (
                <img className="loadingIcon" title="Loading" src={loadingIcon} alt="Loading" />
              )}
              {isQueryErrorThrown(tab, tabKind) && (
                <img
                  src={errorQuery}
                  title="Error"
                  alt="Error"
                  style={{ marginTop: 4, marginLeft: 4, width: 10, height: 11 }}
                />
              )}
            </span>
            <span className="tabNavText">{useObservable(tab?.tabTitle || getReactTabTitle())}</span>
          </span>
          <span className="tabIconSection">
            <CloseButton tab={tab} active={active} hovering={hovering} tabKind={tabKind} />
          </span>
        </div>
      </span>
    </li>
  );
}

const CloseButton = ({
  tab,
  active,
  hovering,
  tabKind,
}: {
  tab: Tab;
  active: boolean;
  hovering: boolean;
  tabKind?: ReactTabKind;
}) => (
  <span
    style={{ display: hovering || active ? undefined : "none" }}
    title="Close"
    role="button"
    aria-label="Close Tab"
    className="cancelButton"
    onClick={(event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      event.stopPropagation();
      tab ? tab.onCloseTabButtonClick() : useTabs.getState().closeReactTab(tabKind);
      // tabKind === ReactTabKind.QueryCopilot && useQueryCopilot.getState().resetQueryCopilotStates();
    }}
    tabIndex={active ? 0 : undefined}
    onKeyPress={({ nativeEvent: e }) => tab.onKeyPressClose(undefined, e)}
  >
    <span className="tabIcon close-Icon">
      <img src={errorIcon} title="Close" alt="Close" />
    </span>
  </span>
);

const ErrorIcon = ({ tab, active }: { tab: Tab; active: boolean }) => (
  <div
    id="errorStatusIcon"
    role="button"
    title="Click to view more details"
    tabIndex={active ? 0 : undefined}
    className={active ? "actionsEnabled errorIconContainer" : "errorIconContainer"}
    onClick={({ nativeEvent: e }) => tab.onErrorDetailsClick(undefined, e)}
    onKeyPress={({ nativeEvent: e }) => tab.onErrorDetailsKeyPress(undefined, e)}
  >
    <span className="errorIcon" />
  </div>
);

function TabPane({ tab, active }: { tab: Tab; active: boolean }) {
  const ref = useRef<HTMLDivElement>();
  const attrs = {
    style: { display: active ? undefined : "none" },
    className: "tabs-container",
  };

  useEffect((): (() => void) | void => {
    if (tab.tabKind === CollectionTabKind.Documents && tab.collection?.isSampleCollection) {
      useTeachingBubble.getState().setIsDocumentsTabOpened(true);
    }

    const { current: element } = ref;
    if (element) {
      ko.applyBindings(tab, element);
      const ctx = ko.contextFor(element).createChildContext(tab);
      ko.applyBindingsToDescendants(ctx, element);
      tab.isTemplateReady(true);
      return () => ko.cleanNode(element);
    }
  }, [ref, tab]);

  if (tab) {
    if ("render" in tab) {
      return <div {...attrs}>{tab.render()}</div>;
    }
  }

  return <div {...attrs} ref={ref} data-bind="html:html" />;
}

const onKeyPressReactTab = (e: KeyboardEvent, tabKind: ReactTabKind): void => {
  if (e.key === "Enter" || e.code === "Space") {
    useTabs.getState().activateReactTab(tabKind);
    e.stopPropagation();
  }
};

const isTabExecuting = (tab?: Tab, tabKind?: ReactTabKind): boolean => {
  if (useObservable(tab?.isExecuting || ko.observable(false))) {
    return true;
  } else if (tabKind !== undefined && tabKind !== ReactTabKind.Home && useTabs.getState()?.isTabExecuting) {
    return true;
  }
  return false;
};

const isQueryErrorThrown = (tab?: Tab, tabKind?: ReactTabKind): boolean => {
  if (
    !tab?.isExecuting &&
    tabKind !== undefined &&
    tabKind !== ReactTabKind.Home &&
    useTabs.getState()?.isQueryErrorThrown &&
    !useTabs.getState()?.isTabExecuting
  ) {
    return true;
  }
  return false;
};

const getReactTabContent = (activeReactTab: ReactTabKind, explorer: Explorer): JSX.Element => {
  // React tabs have no context buttons.
  useCommandBar.getState().setContextButtons([]);

  // eslint-disable-next-line no-console
  switch (activeReactTab) {
    case ReactTabKind.Connect:
      return userContext.apiType === "VCoreMongo" ? (
        <VcoreMongoConnectTab />
      ) : userContext.apiType === "Postgres" ? (
        <PostgresConnectTab />
      ) : (
        <ConnectTab />
      );
    case ReactTabKind.Home:
      return <SplashScreen explorer={explorer} />;
    case ReactTabKind.Quickstart:
      return userContext.apiType === "VCoreMongo" ? (
        <VcoreMongoQuickstartTab explorer={explorer} />
      ) : (
        <QuickstartTab explorer={explorer} />
      );
    case ReactTabKind.QueryCopilot:
      return <QueryCopilotTab explorer={explorer} />;
    default:
      throw Error(`Unsupported tab kind ${ReactTabKind[activeReactTab]}`);
  }
};

const showMongoAndCassandraProxiesNetworkSettingsWarning = (): boolean => {
  const ipRules: IpRule[] = userContext.databaseAccount?.properties?.ipRules;
  if (
    ((userContext.apiType === "Mongo" && configContext.MONGO_PROXY_ENDPOINT !== MongoProxyEndpoints.Local) ||
      (userContext.apiType === "Cassandra" &&
        configContext.CASSANDRA_PROXY_ENDPOINT !== CassandraProxyEndpoints.Development)) &&
    ipRules?.length
  ) {
    const legacyPortalBackendIPs: string[] = PortalBackendIPs[configContext.BACKEND_ENDPOINT];
    const ipAddressesFromIPRules: string[] = ipRules.map((ipRule) => ipRule.ipAddressOrRange);
    const ipRulesIncludeLegacyPortalBackend: boolean = legacyPortalBackendIPs.every((legacyPortalBackendIP: string) =>
      ipAddressesFromIPRules.includes(legacyPortalBackendIP),
    );
    if (!ipRulesIncludeLegacyPortalBackend) {
      return false;
    }

    if (userContext.apiType === "Mongo") {
      const isProdOrMpacMongoProxyEndpoint: boolean = [MongoProxyEndpoints.Mpac, MongoProxyEndpoints.Prod].includes(
        configContext.MONGO_PROXY_ENDPOINT,
      );

      const mongoProxyOutboundIPs: string[] = isProdOrMpacMongoProxyEndpoint
        ? [...MongoProxyOutboundIPs[MongoProxyEndpoints.Mpac], ...MongoProxyOutboundIPs[MongoProxyEndpoints.Prod]]
        : MongoProxyOutboundIPs[configContext.MONGO_PROXY_ENDPOINT];

      const ipRulesIncludeMongoProxy: boolean = mongoProxyOutboundIPs.every((mongoProxyOutboundIP: string) =>
        ipAddressesFromIPRules.includes(mongoProxyOutboundIP),
      );

      if (ipRulesIncludeMongoProxy) {
        updateConfigContext({
          MONGO_PROXY_OUTBOUND_IPS_ALLOWLISTED: true,
        });
      }

      return !ipRulesIncludeMongoProxy;
    } else if (userContext.apiType === "Cassandra") {
      const isProdOrMpacCassandraProxyEndpoint: boolean = [
        CassandraProxyEndpoints.Mpac,
        CassandraProxyEndpoints.Prod,
      ].includes(configContext.CASSANDRA_PROXY_ENDPOINT);

      const cassandraProxyOutboundIPs: string[] = isProdOrMpacCassandraProxyEndpoint
        ? [
            ...CassandraProxyOutboundIPs[CassandraProxyEndpoints.Mpac],
            ...CassandraProxyOutboundIPs[CassandraProxyEndpoints.Prod],
          ]
        : CassandraProxyOutboundIPs[configContext.CASSANDRA_PROXY_ENDPOINT];

      const ipRulesIncludeCassandraProxy: boolean = cassandraProxyOutboundIPs.every(
        (cassandraProxyOutboundIP: string) => ipAddressesFromIPRules.includes(cassandraProxyOutboundIP),
      );

      if (ipRulesIncludeCassandraProxy) {
        updateConfigContext({
          CASSANDRA_PROXY_OUTBOUND_IPS_ALLOWLISTED: true,
        });
      }

      return !ipRulesIncludeCassandraProxy;
    }
  }
  return false;
};
