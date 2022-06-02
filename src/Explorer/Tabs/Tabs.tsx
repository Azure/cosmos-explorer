import { CollectionTabKind } from "Contracts/ViewModels";
import { ConnectTab } from "Explorer/Tabs/ConnectTab";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import ko from "knockout";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import loadingIcon from "../../../images/circular_loader_black_16x16.gif";
import errorIcon from "../../../images/close-black.svg";
import { useObservable } from "../../hooks/useObservable";
import { useTabs } from "../../hooks/useTabs";
import TabsBase from "./TabsBase";

type Tab = TabsBase | (TabsBase & { render: () => JSX.Element });

export const Tabs = (): JSX.Element => {
  const { openedTabs, activeTab } = useTabs();
  const isConnectTabOpen = useTabs((state) => state.isConnectTabOpen);
  const isConnectTabActive = useTabs((state) => state.isConnectTabActive);
  return (
    <div className="tabsManagerContainer">
      <div id="content" className="flexContainer hideOverflows">
        <div className="nav-tabs-margin">
          <ul className="nav nav-tabs level navTabHeight" id="navTabs" role="tablist">
            {isConnectTabOpen && <TabNav key="connect" tab={undefined} active={isConnectTabActive} />}
            {openedTabs.map((tab) => (
              <TabNav key={tab.tabId} tab={tab} active={activeTab === tab} />
            ))}
          </ul>
        </div>
        <div className="tabPanesContainer">
          {isConnectTabActive && <ConnectTab />}
          {openedTabs.map((tab) => (
            <TabPane key={tab.tabId} tab={tab} active={activeTab === tab} />
          ))}
        </div>
      </div>
    </div>
  );
};

function TabNav({ tab, active }: { tab: Tab; active: boolean }) {
  const [hovering, setHovering] = useState(false);
  const focusTab = useRef<HTMLLIElement>() as MutableRefObject<HTMLLIElement>;
  const tabId = tab ? tab.tabId : "connect";

  useEffect(() => {
    if (active && focusTab.current) {
      focusTab.current.focus();
    }
  });
  return (
    <li
      onMouseOver={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => (tab ? tab.onTabClick() : useTabs.getState().activateConnectTab())}
      onKeyPress={({ nativeEvent: e }) => (tab ? tab.onKeyPressActivate(undefined, e) : onKeyPressConnectTab(e))}
      className={active ? "active tabList" : "tabList"}
      title={useObservable(tab?.tabPath || ko.observable(""))}
      aria-selected={active}
      aria-expanded={active}
      aria-controls={tabId}
      tabIndex={0}
      role="tab"
      ref={focusTab}
    >
      <span className="tabNavContentContainer">
        <a data-toggle="tab" href={"#" + tabId} tabIndex={-1}>
          <div className="tab_Content">
            <span className="statusIconContainer">
              {useObservable(tab?.isExecutionError || ko.observable(false)) && <ErrorIcon tab={tab} active={active} />}
              {useObservable(tab?.isExecuting || ko.observable(false)) && (
                <img className="loadingIcon" title="Loading" src={loadingIcon} alt="Loading" />
              )}
            </span>
            <span className="tabNavText">{useObservable(tab?.tabTitle || ko.observable("Connect"))}</span>
            <span className="tabIconSection">
              <CloseButton tab={tab} active={active} hovering={hovering} />
            </span>
          </div>
        </a>
      </span>
    </li>
  );
}

const CloseButton = ({ tab, active, hovering }: { tab: Tab; active: boolean; hovering: boolean }) => (
  <span
    style={{ display: hovering || active ? undefined : "none" }}
    title="Close"
    role="button"
    aria-label="Close Tab"
    className="cancelButton"
    onClick={() => (tab ? tab.onCloseTabButtonClick() : useTabs.getState().closeConnectTab())}
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

const onKeyPressConnectTab = (e: KeyboardEvent): void => {
  if (e.key === "Enter" || e.key === "Space") {
    useTabs.getState().activateConnectTab();
    e.stopPropagation();
  }
};
