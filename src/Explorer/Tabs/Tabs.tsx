import { Spinner, SpinnerSize, TooltipHost } from "@fluentui/react";
import { CollectionTabKind } from "Contracts/ViewModels";
import Explorer from "Explorer/Explorer";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { SplashScreen } from "Explorer/SplashScreen/SplashScreen";
import { ConnectTab } from "Explorer/Tabs/ConnectTab";
import { QuickstartTab } from "Explorer/Tabs/QuickstartTab";
import { KeyboardAction, KeyboardActionGroup, useKeyboardActionGroup } from "KeyboardShortcuts";
import { isFabricNative } from "Platform/Fabric/FabricUtil";
import { userContext } from "UserContext";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import ko from "knockout";
import React, { MutableRefObject, Suspense, useEffect, useRef, useState } from "react";
import errorQuery from "../../../images/error_no_outline.svg";
import warningIconSvg from "../../../images/warning.svg";
import { useObservable } from "../../hooks/useObservable";
import { ReactTabKind, useTabs } from "../../hooks/useTabs";
import TabsBase from "./TabsBase";

// Lazy-loaded tab components (code-split by API type)
const QueryCopilotTab = React.lazy(() =>
  import(/* webpackChunkName: "QueryCopilotTab" */ "Explorer/QueryCopilot/QueryCopilotTab").then((m) => ({
    default: m.QueryCopilotTab,
  })),
);
const FabricHomeScreen = React.lazy(() =>
  import(/* webpackChunkName: "FabricHomeScreen" */ "Explorer/SplashScreen/FabricHome").then((m) => ({
    default: m.FabricHomeScreen,
  })),
);
const PostgresConnectTab = React.lazy(() =>
  import(/* webpackChunkName: "PostgresConnectTab" */ "Explorer/Tabs/PostgresConnectTab").then((m) => ({
    default: m.PostgresConnectTab,
  })),
);
const VcoreMongoConnectTab = React.lazy(() =>
  import(/* webpackChunkName: "VcoreMongoConnectTab" */ "Explorer/Tabs/VCoreMongoConnectTab").then((m) => ({
    default: m.VcoreMongoConnectTab,
  })),
);
const VcoreMongoQuickstartTab = React.lazy(() =>
  import(/* webpackChunkName: "VcoreMongoQuickstartTab" */ "Explorer/Tabs/VCoreMongoQuickstartTab").then((m) => ({
    default: m.VcoreMongoQuickstartTab,
  })),
);

type Tab = TabsBase | (TabsBase & { render: () => JSX.Element });

interface TabsProps {
  explorer: Explorer;
}

export const Tabs = ({ explorer }: TabsProps): JSX.Element => {
  const { openedTabs, openedReactTabs, activeTab, activeReactTab } = useTabs();

  const setKeyboardHandlers = useKeyboardActionGroup(KeyboardActionGroup.TABS);
  useEffect(() => {
    setKeyboardHandlers({
      [KeyboardAction.SELECT_LEFT_TAB]: () => useTabs.getState().selectLeftTab(),
      [KeyboardAction.SELECT_RIGHT_TAB]: () => useTabs.getState().selectRightTab(),
      [KeyboardAction.CLOSE_TAB]: () => useTabs.getState().closeActiveTab(),
    });
  }, [setKeyboardHandlers]);

  // Add useEffect to handle context buttons
  useEffect(() => {
    if (activeReactTab !== undefined) {
      // React tabs have no context buttons
      useCommandBar.getState().setContextButtons([]);
    }
  }, [activeReactTab]);

  return (
    <div className="tabsManagerContainer">
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

  const tabTitle = useObservable(tab?.tabTitle || getReactTabTitle());

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
      role="presentation"
    >
      <span className="tabNavContentContainer">
        <div className="tab_Content">
          <TooltipHost content={useObservable(tab?.tabPath || ko.observable(""))}>
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
              aria-selected={active}
              aria-expanded={active}
              aria-controls={tabId}
              tabIndex={0}
              role="tab"
              ref={focusTab}
            >
              <span className="statusIconContainer" style={{ width: tabKind === ReactTabKind.Home ? 0 : 18 }}>
                {useObservable(tab?.isExecutionError || ko.observable(false)) && (
                  <ErrorIcon tab={tab} active={active} />
                )}
                {useObservable(tab?.isExecutionWarning || ko.observable(false)) && (
                  <WarningIcon tab={tab} active={active} />
                )}
                {isTabExecuting(tab, tabKind) && (
                  <Spinner
                    size={SpinnerSize.small}
                    styles={{
                      circle: {
                        borderTopColor: "var(--colorNeutralForeground1)",
                        borderLeftColor: "var(--colorNeutralForeground1)",
                        borderBottomColor: "var(--colorNeutralForeground1)",
                        borderRightColor: "var(--colorNeutralBackground1)",
                      },
                    }}
                  />
                )}
                {isQueryErrorThrown(tab, tabKind) && (
                  <TooltipHost content="Error">
                    <img src={errorQuery} alt="Error" style={{ marginTop: 4, marginLeft: 4, width: 10, height: 11 }} />
                  </TooltipHost>
                )}
              </span>
              <span className="tabNavText">{tabTitle}</span>
            </span>
          </TooltipHost>
          <span className="tabIconSection">
            <CloseButton tab={tab} active={active} hovering={hovering} tabKind={tabKind} ariaLabel={tabTitle} />
          </span>
        </div>
      </span>
    </li>
  );
}

const onKeyPressReactTabClose = (e: KeyboardEvent, tabKind: ReactTabKind): void => {
  if (e.key === "Enter" || e.code === "Space") {
    useTabs.getState().closeReactTab(tabKind);
    e.stopPropagation();
  }
};

const CloseButton = ({
  tab,
  active,
  hovering,
  tabKind,
  ariaLabel,
}: {
  tab: Tab;
  active: boolean;
  hovering: boolean;
  tabKind?: ReactTabKind;
  ariaLabel: string;
}) => (
  <TooltipHost
    content="Close"
    styles={{
      root: {
        display: hovering || active ? undefined : "none",
      },
    }}
  >
    <span
      role="button"
      aria-label={ariaLabel}
      className="cancelButton"
      onClick={(event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        event.stopPropagation();
        tab ? tab.onCloseTabButtonClick() : useTabs.getState().closeReactTab(tabKind);
      }}
      tabIndex={active ? 0 : undefined}
      onKeyPress={({ nativeEvent: e }) =>
        tab ? tab.onKeyPressClose(undefined, e) : onKeyPressReactTabClose(e, tabKind)
      }
    >
      <span className="tabIcon close-Icon" />
    </span>
  </TooltipHost>
);

const ErrorIcon = ({ tab, active }: { tab: Tab; active: boolean }) => (
  <TooltipHost content="Click to view more details">
    <div
      id="errorStatusIcon"
      role="button"
      tabIndex={active ? 0 : undefined}
      className={active ? "actionsEnabled errorIconContainer" : "errorIconContainer"}
      onClick={({ nativeEvent: e }) => tab.onErrorDetailsClick(undefined, e)}
      onKeyPress={({ nativeEvent: e }) => tab.onErrorDetailsKeyPress(undefined, e)}
    >
      <span className="errorIcon" />
    </div>
  </TooltipHost>
);

const WarningIcon = ({ tab, active }: { tab: Tab; active: boolean }) => (
  <TooltipHost content="Click to view more details">
    <div
      id="warningStatusIcon"
      role="button"
      tabIndex={active ? 0 : undefined}
      className={active ? "actionsEnabled warningIconContainer" : "warningIconContainer"}
      onClick={({ nativeEvent: e }) => tab.onErrorDetailsClick(undefined, e)}
      onKeyPress={({ nativeEvent: e }) => tab.onErrorDetailsKeyPress(undefined, e)}
    >
      <img src={warningIconSvg} alt="Warning Icon" style={{ height: 15, marginBottom: 5 }} />
    </div>
  </TooltipHost>
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
      return (
        <div data-test={`Tab:${tab.tabId}`} {...attrs}>
          {tab.render()}
        </div>
      );
    }
  }

  return <div data-test={`Tab:${tab.tabId}`} {...attrs} ref={ref} data-bind="html:html" />;
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
  const content = (() => {
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
        if (isFabricNative()) {
          return <FabricHomeScreen explorer={explorer} />;
        } else {
          return <SplashScreen explorer={explorer} />;
        }
      case ReactTabKind.Quickstart:
        return userContext.apiType === "VCoreMongo" ? (
          <VcoreMongoQuickstartTab explorer={explorer} />
        ) : (
          <QuickstartTab explorer={explorer} />
        );
      case ReactTabKind.QueryCopilot:
        return <QueryCopilotTab explorer={explorer} />;
      default:
        throw new Error(`Unsupported tab kind ${ReactTabKind[activeReactTab]}`);
    }
  })();
  return <Suspense fallback={<Spinner size={SpinnerSize.large} />}>{content}</Suspense>;
};
