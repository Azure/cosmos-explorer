import * as React from "react";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";
import "./TabComponent.less";

export interface TabContent {
  render: () => JSX.Element;
  className?: string;
}

export interface Tab {
  title: string;
  content: TabContent;
  isVisible: () => boolean;
}

interface TabComponentProps {
  tabs: Tab[];
  currentTabIndex: number;
  onTabIndexChange: (newIndex: number) => void;
  hideHeader: boolean;
}

/**
 * We assume there's at least one tab
 */
export class TabComponent extends React.Component<TabComponentProps> {
  public constructor(props: TabComponentProps) {
    super(props);

    if (this.props.tabs.length < 1) {
      const msg = "TabComponent must have at least one tab";
      console.error(msg);
      throw new Error(msg);
    }
  }

  private setActiveTab(index: number): void {
    this.props.onTabIndexChange(index);
  }

  public render(): JSX.Element {
    const { tabs, currentTabIndex, hideHeader } = this.props;
    const currentTabContent = tabs[currentTabIndex].content;
    let className = "tabComponentContent";
    if (currentTabContent.className) {
      className += ` ${currentTabContent.className}`;
    }
    return (
      <div className="tabComponentContainer">
        <div className="tabs tabSwitch">
          {!hideHeader && (
            <Pivot
              aria-label="Tab navigation"
              selectedKey={currentTabIndex.toString()}
              linkSize="normal"
              onLinkClick={(item) => this.setActiveTab(parseInt(item?.props.itemKey || ""))}
            >
              {tabs.map((tab: Tab, index: number) => {
                if (!tab.isVisible()) {
                  return null; // Skip rendering invisible tabs
                }
                return <PivotItem key={index} headerText={tab.title} itemKey={index.toString()} />;
              })}
            </Pivot>
          )}
        </div>
        <div className={className}>{tabs[currentTabIndex].content.render()}</div>
      </div>
    );
  }
}
