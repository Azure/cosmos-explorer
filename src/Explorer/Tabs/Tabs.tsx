import { MessageBar, MessageBarButton, MessageBarType } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { MinimalQueryIterator } from "Common/IteratorUtilities";
import { sendMessage } from "Common/MessageHandler";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { CollectionTabKind, QueryResults } from "Contracts/ViewModels";
import Explorer from "Explorer/Explorer";
import { QueryCopilotTab } from "Explorer/QueryCopilot/QueryCopilotTab";
import { SplashScreen } from "Explorer/SplashScreen/SplashScreen";
import { ConnectTab } from "Explorer/Tabs/ConnectTab";
import { PostgresConnectTab } from "Explorer/Tabs/PostgresConnectTab";
import { QuickstartTab } from "Explorer/Tabs/QuickstartTab";
import { userContext } from "UserContext";
import { useQueryCopilot } from "hooks/useQueryCopilot";
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

  return (
    <div className="tabsManagerContainer">
      {networkSettingsWarning && (
        <MessageBar
          messageBarType={MessageBarType.warning}
          actions={
            <MessageBarButton onClick={() => sendMessage({ type: MessageTypes.OpenPostgresNetworkingBlade })}>
              Change network settings
            </MessageBarButton>
          }
          messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
        >
          {networkSettingsWarning}
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
  });
  return (
    <li
      onMouseOver={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
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
      className={active ? "active tabList" : "tabList"}
      style={active ? { fontWeight: "bolder" } : {}}
      title={useObservable(tab?.tabPath || ko.observable(""))}
      aria-selected={active}
      aria-expanded={active}
      aria-controls={tabId}
      tabIndex={0}
      role="tab"
      ref={focusTab}
    >
      <span className="tabNavContentContainer">
        <div className="tab_Content">
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
          {tabKind !== ReactTabKind.Home && (
            <span className="tabIconSection">
              <CloseButton tab={tab} active={active} hovering={hovering} tabKind={tabKind} />
            </span>
          )}
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
  if (e.key === "Enter" || e.key === "Space") {
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
  const hideFeedbackModalForLikedQueries = useQueryCopilot((state) => state.hideFeedbackModalForLikedQueries);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [generatedQuery, setGeneratedQuery] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [isGeneratingQuery, setIsGeneratingQuery] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [likeQuery, setLikeQuery] = useState<boolean>();
  const [dislikeQuery, setDislikeQuery] = useState<boolean>();
  const [showCallout, setShowCallout] = useState<boolean>(false);
  const [showSamplePrompts, setShowSamplePrompts] = useState<boolean>(false);
  const [queryIterator, setQueryIterator] = useState<MinimalQueryIterator>();
  const [queryResults, setQueryResults] = useState<QueryResults>();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copilotTeachingBubbleVisible, { toggle: toggleCopilotTeachingBubbleVisible }] = useBoolean(false);
  const inputEdited = useRef(false);
  const [isSamplePromptsOpen, setIsSamplePromptsOpen] = useState<boolean>(false);
  const [showDeletePopup, setShowDeletePopup] = useState<boolean>(false);
  const [showFeedbackBar, setShowFeedbackBar] = useState<boolean>(false);
  const [showCopyPopup, setshowCopyPopup] = useState<boolean>(false);
  const [showErrorMessageBar, setShowErrorMessageBar] = useState<boolean>(false);
  switch (activeReactTab) {
    case ReactTabKind.Connect:
      return userContext.apiType === "Postgres" ? <PostgresConnectTab /> : <ConnectTab />;
    case ReactTabKind.Home:
      return <SplashScreen explorer={explorer} />;
    case ReactTabKind.Quickstart:
      return <QuickstartTab explorer={explorer} />;
    case ReactTabKind.QueryCopilot:
      return (
        <QueryCopilotTab
          // Pass the states as props
          hideFeedbackModalForLikedQueries={hideFeedbackModalForLikedQueries}
          userPrompt={userPrompt}
          generatedQuery={generatedQuery}
          query={query}
          selectedQuery={selectedQuery}
          isGeneratingQuery={isGeneratingQuery}
          isExecuting={isExecuting}
          likeQuery={likeQuery}
          dislikeQuery={dislikeQuery}
          showCallout={showCallout}
          showSamplePrompts={showSamplePrompts}
          queryIterator={queryIterator}
          queryResults={queryResults}
          errorMessage={errorMessage}
          copilotTeachingBubbleVisible={copilotTeachingBubbleVisible}
          inputEdited={inputEdited.current}
          isSamplePromptsOpen={isSamplePromptsOpen}
          showDeletePopup={showDeletePopup}
          showFeedbackBar={showFeedbackBar}
          showCopyPopup={showCopyPopup}
          showErrorMessageBar={showErrorMessageBar}
          // Pass the update functions as props
          setUserPrompt={setUserPrompt}
          setGeneratedQuery={setGeneratedQuery}
          setQuery={setQuery}
          setSelectedQuery={setSelectedQuery}
          setIsGeneratingQuery={setIsGeneratingQuery}
          setIsExecuting={setIsExecuting}
          setLikeQuery={setLikeQuery}
          setDislikeQuery={setDislikeQuery}
          setShowCallout={setShowCallout}
          setShowSamplePrompts={setShowSamplePrompts}
          setQueryIterator={setQueryIterator}
          setQueryResults={setQueryResults}
          setErrorMessage={setErrorMessage}
          toggleCopilotTeachingBubbleVisible={toggleCopilotTeachingBubbleVisible}
          setIsSamplePromptsOpen={setIsSamplePromptsOpen}
          setShowDeletePopup={setShowDeletePopup}
          setShowFeedbackBar={setShowFeedbackBar}
          setshowCopyPopup={setshowCopyPopup}
          setShowErrorMessageBar={setShowErrorMessageBar}
          explorer={explorer}
        />
      );
    default:
      throw Error(`Unsupported tab kind ${ReactTabKind[activeReactTab]}`);
  }
};
