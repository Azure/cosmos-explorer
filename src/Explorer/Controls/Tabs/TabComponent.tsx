import * as React from "react";
import { AccessibleElement } from "../../Controls/AccessibleElement/AccessibleElement";
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
    this.setState({ activeTabIndex: index });
    this.props.onTabIndexChange(index);
  }

  private renderTabTitles(): JSX.Element[] {
    return this.props.tabs.map((tab: Tab, index: number) => {
      if (!tab.isVisible()) {
        return <React.Fragment key={index} />;
      }

      let className = "toggleSwitch";
      let ariaselected;
      if (index === this.props.currentTabIndex) {
        className += " selectedToggle";
        ariaselected = true;
      } else {
        className += " unselectedToggle";
        ariaselected = false;
      }

      return (
        <div className="tab" key={index}>
          <AccessibleElement
            as="span"
            className={className}
            role="tab"
            onActivated={() => this.setActiveTab(index)}
            aria-label={`Select tab: ${tab.title}`}
            aria-selected={ariaselected}
          >
            {tab.title}
          </AccessibleElement>
        </div>
      );
    });
  }

  public render(): JSX.Element {
    const currentTabContent = this.props.tabs[this.props.currentTabIndex].content;
    let className = "tabComponentContent";
    if (currentTabContent.className) {
      className += ` ${currentTabContent.className}`;
    }

    return (
      <div className="tabComponentContainer">
        {!this.props.hideHeader && (
          <div className="tabs tabSwitch" role="tablist">
            {this.renderTabTitles()}
          </div>
        )}
        <div className={className}>{currentTabContent.render()}</div>
      </div>
    );
  }
}
