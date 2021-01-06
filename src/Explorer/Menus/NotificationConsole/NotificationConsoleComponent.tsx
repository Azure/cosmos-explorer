/**
 * React component for control bar
 */

import * as React from "react";
import { ClientDefaults, KeyCodes } from "../../../Common/Constants";
import AnimateHeight from "react-animate-height";
import { Dropdown, IDropdownOption } from "office-ui-fabric-react";
import LoadingIcon from "../../../../images/loading.svg";
import ErrorBlackIcon from "../../../../images/error_black.svg";
import infoBubbleIcon from "../../../../images/info-bubble-9x9.svg";
import InfoIcon from "../../../../images/info_color.svg";
import ErrorRedIcon from "../../../../images/error_red.svg";
import ClearIcon from "../../../../images/Clear.svg";
const LoaderIcon = require("../../../../images/circular_loader_black_16x16.gif");
const ChevronUpIcon = require("../../../../images/QueryBuilder/CollapseChevronUp_16x.png");
const ChevronDownIcon = require("../../../../images/QueryBuilder/CollapseChevronDown_16x.png");

/**
 * Log levels
 */
export enum ConsoleDataType {
  Info = 0,
  Error = 1,
  InProgress = 2
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
  onConsoleExpandedChange: (isExpanded: boolean) => void;
  consoleData: ConsoleData[];
  onConsoleDataChange: (consoleData: ConsoleData[]) => void;
}

interface NotificationConsoleComponentState {
  headerStatus: string;
  selectedFilter: string;
  isExpanded: boolean;
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
    { key: "Error", text: "Error" }
  ];
  private headerTimeoutId?: number;
  private prevHeaderStatus: string | null;
  private consoleHeaderElement?: HTMLElement;

  constructor(props: NotificationConsoleComponentProps) {
    super(props);
    this.state = {
      headerStatus: "",
      selectedFilter: NotificationConsoleComponent.FilterOptions[0].key || "",
      isExpanded: props.isConsoleExpanded
    };
    this.prevHeaderStatus = null;
  }

  public componentDidUpdate(
    prevProps: NotificationConsoleComponentProps,
    prevState: NotificationConsoleComponentState
  ) {
    const currentHeaderStatus = NotificationConsoleComponent.extractHeaderStatus(this.props);

    if (
      this.prevHeaderStatus !== currentHeaderStatus &&
      currentHeaderStatus !== null &&
      prevState.headerStatus !== currentHeaderStatus
    ) {
      this.setHeaderStatus(currentHeaderStatus);
    }

    // Call setHeaderStatus() only to clear HeaderStatus or update status to a different value.
    // Cache previous headerStatus externally. Otherwise, simply comparing with previous state/props will cause circular
    // updates: currentHeaderStatus -> "" -> currentHeaderStatus -> "" etc.
    this.prevHeaderStatus = currentHeaderStatus;

    if (prevProps.isConsoleExpanded !== this.props.isConsoleExpanded) {
      // Sync state and props
      // TODO react anti-pattern: remove isExpanded from state which duplicates prop's isConsoleExpanded
      this.setState({ isExpanded: this.props.isConsoleExpanded });
    }
  }

  public setElememntRef = (element: HTMLDivElement) => {
    this.consoleHeaderElement = element;
  };

  public render(): JSX.Element {
    const numInProgress = this.props.consoleData.filter((data: ConsoleData) => data.type === ConsoleDataType.InProgress)
      .length;
    const numErroredItems = this.props.consoleData.filter((data: ConsoleData) => data.type === ConsoleDataType.Error)
      .length;
    const numInfoItems = this.props.consoleData.filter((data: ConsoleData) => data.type === ConsoleDataType.Info)
      .length;
    return (
      <div className="notificationConsoleContainer">
        <div
          className="notificationConsoleHeader"
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
            <span className="consoleSplitter" />
            <span className="headerStatus">
              <span className="headerStatusEllipsis">{this.state.headerStatus}</span>
            </span>
          </div>
          <div
            className="expandCollapseButton"
            role="button"
            tabIndex={0}
            aria-label={"console button" + (this.state.isExpanded ? " collapsed" : " expanded")}
            aria-expanded={!this.state.isExpanded}
          >
            <img
              src={this.state.isExpanded ? ChevronDownIcon : ChevronUpIcon}
              alt={this.state.isExpanded ? "ChevronDownIcon" : "ChevronUpIcon"}
            />
          </div>
        </div>
        <AnimateHeight
          duration={NotificationConsoleComponent.transitionDurationMs}
          height={this.state.isExpanded ? "auto" : 0}
          onAnimationEnd={this.onConsoleWasExpanded}
        >
          <div className="notificationConsoleContents">
            <div className="notificationConsoleControls">
              <Dropdown
                label="Filter:"
                role="combobox"
                selectedKey={this.state.selectedFilter}
                options={NotificationConsoleComponent.FilterOptions}
                onChange={() => this.onFilterSelected}
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
    this.setState({ isExpanded: !this.state.isExpanded });
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
    this.props.onConsoleDataChange([]);
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
    let filterType: Number | null = null;

    switch (this.state.selectedFilter) {
      case "All":
        filterType = null;
        break;
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
        filterType = null;
    }

    return filterType == null
      ? this.props.consoleData
      : this.props.consoleData.filter((data: ConsoleData) => data.type === filterType);
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

  private static extractHeaderStatus(props: NotificationConsoleComponentProps) {
    if (props.consoleData && props.consoleData.length > 0) {
      return props.consoleData[0].message.split(":\n")[0];
    } else {
      return null;
    }
  }

  private onConsoleWasExpanded = (): void => {
    this.props.onConsoleExpandedChange(this.state.isExpanded);
    if (this.state.isExpanded && this.consoleHeaderElement) {
      this.consoleHeaderElement.focus();
    }
  };
}
