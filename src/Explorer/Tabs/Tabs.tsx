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
  return (
    <div className="tabsManagerContainer">
      <div id="content" className="flexContainer hideOverflows">
        <div className="nav-tabs-margin">
          <ul className="nav nav-tabs level navTabHeight" id="navTabs" role="tablist">
            {openedTabs.map((tab) => (
              <TabNav key={tab.tabId} tab={tab} active={activeTab === tab} />
            ))}
          </ul>
        </div>
        <div className="tabPanesContainer">
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

  useEffect(() => {
    if (active && focusTab.current) {
      focusTab.current.focus();
    }
  });
  return (
    <li
      onMouseOver={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => tab.onTabClick()}
      onKeyPress={({ nativeEvent: e }) => tab.onKeyPressActivate(e)}
      className={active ? "active tabList" : "tabList"}
      title={useObservable(tab.tabPath)}
      aria-selected={active}
      aria-expanded={active}
      aria-controls={tab.tabId}
      tabIndex={0}
      role="tab"
      ref={focusTab}
    >
      <span className="tabNavContentContainer">
        <a data-toggle="tab" href={"#" + tab.tabId} tabIndex={-1}>
          <div className="tab_Content">
            <span className="statusIconContainer">
              {useObservable(tab.isExecutionError) && <ErrorIcon tab={tab} active={active} />}
              {useObservable(tab.isExecuting) && (
                <img className="loadingIcon" title="Loading" src={loadingIcon} alt="Loading" />
              )}
            </span>
            <span className="tabNavText">{useObservable(tab.tabTitle)}</span>
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
    onClick={() => tab.onCloseTabButtonClick()}
    tabIndex={active ? 0 : undefined}
    onKeyPress={({ nativeEvent: e }) => tab.onKeyPressClose(e)}
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
    onClick={() => tab.onErrorDetailsClick()}
    onKeyPress={({ nativeEvent: e }) => tab.onErrorDetailsKeyPress(e)}
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
    const { current: element } = ref;
    if (element) {
      ko.applyBindings(tab, element);
      const ctx = ko.contextFor(element).createChildContext(tab);
      ko.applyBindingsToDescendants(ctx, element);
      tab.isTemplateReady(true);
      return () => ko.cleanNode(element);
    }
  }, [ref, tab]);

  if ("render" in tab) {
    return <div {...attrs}>{tab.render()}</div>;
  }

  return <div {...attrs} ref={ref} data-bind="html:html" />;
}
