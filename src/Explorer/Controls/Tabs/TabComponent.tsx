import * as React from "react";
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
interface TabRefs {
  [key: string]: HTMLElement;
}

/**
 * We assume there's at least one tab
 */
export class TabComponent extends React.Component<TabComponentProps> {
  private tabRefs: TabRefs = {};
  public constructor(props: TabComponentProps) {
    super(props);

    if (this.props.tabs.length < 1) {
      const msg = "TabComponent must have at least one tab";
      console.error(msg);
      throw new Error(msg);
    }
  }
  state = {
    activeTabIndex: this.props.currentTabIndex,
  };

  private setActiveTab(index: number): void {
    this.setState({ activeTabIndex: index });
    this.props.onTabIndexChange(index);
  }
  private setIndex = (index: number) => {
    const tab = this.tabRefs[index];
    if (tab) {
      tab.focus();
      this.setState({ activeTabIndex: index });
    }
  };
  private handlekeypress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    const { tabs, onTabIndexChange } = this.props;
    const { activeTabIndex } = this.state;
    const count = tabs.length;

    const prevTab = () => {
      this.setIndex((activeTabIndex - 1 + count) % count);
      onTabIndexChange((activeTabIndex - 1 + count) % count);
    };
    const nextTab = () => {
      this.setIndex((activeTabIndex + 1) % count);
      onTabIndexChange((activeTabIndex + 1) % count);
    };

    if (event.key === "ArrowLeft") {
      prevTab();
    } else if (event.key === "ArrowRight") {
      nextTab();
    }
  };

  private renderTabTitles(): JSX.Element[] {
    return this.props.tabs.map((tab: Tab, index: number) => {
      if (!tab.isVisible()) {
        return <React.Fragment key={index} />;
      }

      let className = "toggleSwitch";
      let ariaselected;
      let tabindex;
      if (index === this.props.currentTabIndex) {
        className += " selectedToggle";
        ariaselected = true;
        tabindex = 0;
      } else {
        className += " unselectedToggle";
        ariaselected = false;
        tabindex = -1;
      }

      return (
        <div className="tab" key={index}>
          <span
            className={className}
            role="tab"
            onClick={() => this.setActiveTab(index)}
            onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => this.handlekeypress(event)}
            onFocus={() => this.setState({ activeTabIndex: index })}
            aria-label={`Select tab: ${tab.title}`}
            aria-selected={ariaselected}
            tabIndex={tabindex}
            ref={(element) => (this.tabRefs[index] = element)}
          >
            {tab.title}
          </span>
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
