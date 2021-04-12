/**
 * React component for control bar
 */

import { Dropdown, IDropdownOption } from "office-ui-fabric-react";
import * as React from "react";
import AnimateHeight from "react-animate-height";
import LoaderIcon from "../../../../images/circular_loader_black_16x16.gif";
import ClearIcon from "../../../../images/Clear.svg";
import ErrorBlackIcon from "../../../../images/error_black.svg";
import ErrorRedIcon from "../../../../images/error_red.svg";
import infoBubbleIcon from "../../../../images/info-bubble-9x9.svg";
import InfoIcon from "../../../../images/info_color.svg";
import LoadingIcon from "../../../../images/loading.svg";
import ChevronDownIcon from "../../../../images/QueryBuilder/CollapseChevronDown_16x.png";
import ChevronUpIcon from "../../../../images/QueryBuilder/CollapseChevronUp_16x.png";
import { ClientDefaults, KeyCodes } from "../../../Common/Constants";
import { userContext } from "../../../UserContext";

/**
 * Log levels
 */
export enum ConsoleDataType {
  Info = 0,
  Error = 1,
  InProgress = 2,
}

/**
 * Interface for the data/content that will be recorded
 */
export interface ConsoleData {
  type: ConsoleDataType;
  date: string;
  message: string;
  id?: string;
}

export interface NotificationConsoleComponentProps {
  isConsoleExpanded: boolean;
  consoleData: ConsoleData;
  inProgressConsoleDataIdToBeDeleted: string;
  setIsConsoleExpanded: (isExpanded: boolean) => void;
}

interface NotificationConsoleComponentState {
  headerStatus: string;
  selectedFilter: string;
  allConsoleData: ConsoleData[];
}

export class NotificationConsoleComponent extends React.Component<
  NotificationConsoleComponentProps,
  NotificationConsoleComponentState
> {
  private static readonly transitionDurationMs = 200;
  private static readonly FilterOptions = [
    { key: "All", text: "All" },
    { key: "In Progress", text: "In progress" },
    { key: "Info", text: "Info" },
    { key: "Error", text: "Error" },
  ];
  private headerTimeoutId?: number;
  private prevHeaderStatus: string;
  private consoleHeaderElement?: HTMLElement;

  constructor(props: NotificationConsoleComponentProps) {
    super(props);
    this.state = {
      headerStatus: undefined,
      selectedFilter: NotificationConsoleComponent.FilterOptions[0].key,
      allConsoleData: props.consoleData ? [props.consoleData] : [],
    };
    this.prevHeaderStatus = undefined;
  }

  public componentDidUpdate(
    prevProps: NotificationConsoleComponentProps,
    prevState: NotificationConsoleComponentState
  ) {
    const currentHeaderStatus = NotificationConsoleComponent.extractHeaderStatus(this.props.consoleData);

    if (
      this.prevHeaderStatus !== currentHeaderStatus &&
      currentHeaderStatus !== undefined &&
      prevState.headerStatus !== currentHeaderStatus
    ) {
      this.setHeaderStatus(currentHeaderStatus);
    }

    // Call setHeaderStatus() only to clear HeaderStatus or update status to a different value.
    // Cache previous headerStatus externally. Otherwise, simply comparing with previous state/props will cause circular
    // updates: currentHeaderStatus -> "" -> currentHeaderStatus -> "" etc.
    this.prevHeaderStatus = currentHeaderStatus;

    if (this.props.consoleData || this.props.inProgressConsoleDataIdToBeDeleted) {
      this.updateConsoleData(prevProps);
    }
  }

  public setElememntRef = (element: HTMLElement) => {
    this.consoleHeaderElement = element;
  };

  public render(): JSX.Element {
    const numInProgress = this.state.allConsoleData.filter(
      (data: ConsoleData) => data.type === ConsoleDataType.InProgress
    ).length;
    const numErroredItems = this.state.allConsoleData.filter((data: ConsoleData) => data.type === ConsoleDataType.Error)
      .length;
    const numInfoItems = this.state.allConsoleData.filter((data: ConsoleData) => data.type === ConsoleDataType.Info)
      .length;

    return (
      <div className="notificationConsoleContainer">
        <div
          className="notificationConsoleHeader"
          id="notificationConsoleHeader"
          ref={this.setElememntRef}
          onClick={(event: React.MouseEvent<HTMLDivElement>) => this.expandCollapseConsole()}
          onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => this.onExpandCollapseKeyPress(event)}
          tabIndex={0}
        >
          <div className="statusBar">
            <span className="dataTypeIcons">
              <span className="notificationConsoleHeaderIconWithData">
                <img src={LoadingIcon} alt="in progress items" />
                <span className="numInProgress">{numInProgress}</span>
              </span>
              <span className="notificationConsoleHeaderIconWithData">
                <img src={ErrorBlackIcon} alt="error items" />
                <span className="numErroredItems">{numErroredItems}</span>
              </span>
              <span className="notificationConsoleHeaderIconWithData">
                <img src={infoBubbleIcon} alt="info items" />
                <span className="numInfoItems">{numInfoItems}</span>
              </span>
            </span>
            {userContext.features.pr && <PrPreview pr={userContext.features.pr} />}
            <span className="consoleSplitter" />
            <span className="headerStatus">
              <span className="headerStatusEllipsis">{this.state.headerStatus}</span>
            </span>
          </div>
          <div
            className="expandCollapseButton"
            role="button"
            tabIndex={0}
            aria-label={"console button" + (this.props.isConsoleExpanded ? " collapsed" : " expanded")}
            aria-expanded={!this.props.isConsoleExpanded}
          >
            <img
              src={this.props.isConsoleExpanded ? ChevronDownIcon : ChevronUpIcon}
              alt={this.props.isConsoleExpanded ? "ChevronDownIcon" : "ChevronUpIcon"}
            />
          </div>
        </div>
        <AnimateHeight
          duration={NotificationConsoleComponent.transitionDurationMs}
          height={this.props.isConsoleExpanded ? "auto" : 0}
          onAnimationEnd={this.onConsoleWasExpanded}
        >
          <div className="notificationConsoleContents">
            <div className="notificationConsoleControls">
              <Dropdown
                label="Filter:"
                role="combobox"
                selectedKey={this.state.selectedFilter}
                options={NotificationConsoleComponent.FilterOptions}
                onChange={this.onFilterSelected.bind(this)}
                aria-labelledby="consoleFilterLabel"
                aria-label={this.state.selectedFilter}
              />
              <span className="consoleSplitter" />
              <span
                className="clearNotificationsButton"
                onClick={() => this.clearNotifications()}
                role="button"
                onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => this.onClearNotificationsKeyPress(event)}
                tabIndex={0}
              >
                <img src={ClearIcon} alt="clear notifications image" />
                Clear Notifications
              </span>
            </div>
            <div className="notificationConsoleData">
              {this.renderAllFilteredConsoleData(this.getFilteredConsoleData())}
            </div>
          </div>
        </AnimateHeight>
      </div>
    );
  }
  private expandCollapseConsole() {
    this.props.setIsConsoleExpanded(!this.props.isConsoleExpanded);
  }

  private onExpandCollapseKeyPress = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.keyCode === KeyCodes.Space || event.keyCode === KeyCodes.Enter) {
      this.expandCollapseConsole();
      event.stopPropagation();
      event.preventDefault();
    }
  };

  private onClearNotificationsKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.keyCode === KeyCodes.Space || event.keyCode === KeyCodes.Enter) {
      this.clearNotifications();
      event.stopPropagation();
      event.preventDefault();
    }
  };

  private clearNotifications(): void {
    this.setState({ allConsoleData: [] });
  }

  private renderAllFilteredConsoleData(rowData: ConsoleData[]): JSX.Element[] {
    return rowData.map((item: ConsoleData, index: number) => (
      <div className="rowData" key={index}>
        {item.type === ConsoleDataType.Info && <img className="infoIcon" src={InfoIcon} alt="info" />}
        {item.type === ConsoleDataType.Error && <img className="errorIcon" src={ErrorRedIcon} alt="error" />}
        {item.type === ConsoleDataType.InProgress && <img className="loaderIcon" src={LoaderIcon} alt="in progress" />}
        <span className="date">{item.date}</span>
        <span className="message">{item.message}</span>
      </div>
    ));
  }

  private onFilterSelected = (event: React.ChangeEvent<HTMLSelectElement>, option: IDropdownOption): void => {
    this.setState({ selectedFilter: String(option.key) });
  };

  private getFilteredConsoleData(): ConsoleData[] {
    let filterType: ConsoleDataType;

    switch (this.state.selectedFilter) {
      case "In Progress":
        filterType = ConsoleDataType.InProgress;
        break;
      case "Info":
        filterType = ConsoleDataType.Info;
        break;
      case "Error":
        filterType = ConsoleDataType.Error;
        break;
      default:
        filterType = undefined;
    }

    return filterType
      ? this.state.allConsoleData.filter((data: ConsoleData) => data.type === filterType)
      : this.state.allConsoleData;
  }

  private setHeaderStatus(statusMessage: string): void {
    if (this.state.headerStatus === statusMessage) {
      return;
    }

    this.headerTimeoutId && clearTimeout(this.headerTimeoutId);
    this.setState({ headerStatus: statusMessage });
    this.headerTimeoutId = window.setTimeout(
      () => this.setState({ headerStatus: "" }),
      ClientDefaults.errorNotificationTimeoutMs
    );
  }

  private static extractHeaderStatus(consoleData: ConsoleData) {
    return consoleData?.message.split(":\n")[0];
  }

  private onConsoleWasExpanded = (): void => {
    if (this.props.isConsoleExpanded && this.consoleHeaderElement) {
      this.consoleHeaderElement.focus();
    }
  };

  private updateConsoleData = (prevProps: NotificationConsoleComponentProps): void => {
    if (!this.areConsoleDataEqual(this.props.consoleData, prevProps.consoleData)) {
      this.setState({ allConsoleData: [this.props.consoleData, ...this.state.allConsoleData] });
    }

    if (
      this.props.inProgressConsoleDataIdToBeDeleted &&
      prevProps.inProgressConsoleDataIdToBeDeleted !== this.props.inProgressConsoleDataIdToBeDeleted
    ) {
      const allConsoleData = this.state.allConsoleData.filter(
        (data: ConsoleData) =>
          !(data.type === ConsoleDataType.InProgress && data.id === this.props.inProgressConsoleDataIdToBeDeleted)
      );
      this.setState({ allConsoleData });
    }
  };

  private areConsoleDataEqual = (currentData: ConsoleData, prevData: ConsoleData): boolean => {
    if (!currentData || !prevData) {
      return !currentData && !prevData;
    }

    return (
      currentData.date === prevData.date &&
      currentData.message === prevData.message &&
      currentData.type === prevData.type &&
      currentData.id === prevData.id
    );
  };
}

const PrPreview = (props: { pr: string }) => {
  const url = new URL(props.pr);
  const [, ref] = url.hash.split("#");
  url.hash = "";

  return (
    <>
      <span className="consoleSplitter" />
      <a target="_blank" href={url.href} style={{ marginRight: "1em", fontWeight: "bold" }}>
        {ref}
      </a>
    </>
  );
};
