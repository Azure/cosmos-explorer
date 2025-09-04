import React, { Component } from "react";
import * as Constants from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
import * as ViewModels from "../../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import { isInvalidParentFrameOrigin, isReadyMessage } from "../../../Utils/MessageValidation";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import TabsBase from "../TabsBase";
import { getMongoShellUrl } from "./getMongoShellUrl";

//eslint-disable-next-line
class MessageType {
  static IframeReady = "iframeready";
  static Notification = "notification";
  static Log = "log";
}

//eslint-disable-next-line
class LogType {
  static Information = "information";
  static Warning = "warning";
  static Verbose = "verbose";
  static InProgress = "inprogress";
  static StartTrace = "start";
  static SuccessTrace = "success";
  static FailureTrace = "failure";
}

export interface IMongoShellTabAccessor {
  onTabClickEvent: () => void;
}

export interface IMongoShellTabComponentStates {
  url: string;
}

export interface IMongoShellTabComponentProps {
  collection: ViewModels.CollectionBase;
  tabsBaseInstance: TabsBase;
  container: Explorer;
  onMongoShellTabAccessor: (instance: IMongoShellTabAccessor) => void;
}

export default class MongoShellTabComponent extends Component<
  IMongoShellTabComponentProps,
  IMongoShellTabComponentStates
> {
  private _logTraces: Map<string, number>;

  constructor(props: IMongoShellTabComponentProps) {
    super(props);
    this._logTraces = new Map();

    this.state = {
      url: getMongoShellUrl(),
    };

    props.onMongoShellTabAccessor({
      onTabClickEvent: this.onTabClick.bind(this),
    });

    window.addEventListener("message", this.handleMessage.bind(this), false);
  }

  //eslint-disable-next-line
  public setContentFocus(event: React.SyntheticEvent<HTMLIFrameElement, Event>): void {}

  public onTabClick(): void {
    this.props.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
  }

  public handleMessage(event: MessageEvent): void {
    if (isInvalidParentFrameOrigin(event)) {
      return;
    }

    const shellIframe: HTMLIFrameElement = document.getElementById(
      this.props.tabsBaseInstance.tabId,
    ) as HTMLIFrameElement;

    if (!shellIframe) {
      return;
    }
    if (typeof event.data !== "object" || event.data["signature"] !== "mongoshell") {
      return;
    }
    if (!("data" in event.data) || !("eventType" in event.data)) {
      return;
    }

    if (event.data.eventType === MessageType.IframeReady) {
      this.handleReadyMessage(event, shellIframe);
    } else if (event.data.eventType === MessageType.Notification) {
      this.handleNotificationMessage(event, shellIframe);
    } else {
      this.handleLogMessage(event, shellIframe);
    }
  }

  private handleReadyMessage(event: MessageEvent, shellIframe: HTMLIFrameElement) {
    if (!isReadyMessage(event)) {
      return;
    }
    const { databaseAccount } = userContext;

    const authorization: string = userContext.authorizationToken || "";
    const resourceId = databaseAccount?.id;
    const accountName = databaseAccount?.name;
    const documentEndpoint = databaseAccount?.properties.mongoEndpoint || databaseAccount?.properties.documentEndpoint;
    const mongoEndpoint =
      documentEndpoint.substr(
        Constants.MongoDBAccounts.protocol.length + 3,
        documentEndpoint.length -
          (Constants.MongoDBAccounts.protocol.length + 2 + Constants.MongoDBAccounts.defaultPort.length),
      ) + Constants.MongoDBAccounts.defaultPort.toString();
    const databaseId = this.props.collection.databaseId;
    const collectionId = this.props.collection.id();
    const apiEndpoint = configContext.MONGO_PROXY_ENDPOINT;
    const encryptedAuthToken: string = userContext.accessToken;

    shellIframe.contentWindow.postMessage(
      {
        signature: "dataexplorer",
        data: {
          resourceId: resourceId,
          accountName: accountName,
          mongoEndpoint: this._useMongoProxyEndpoint ? documentEndpoint : mongoEndpoint,
          authorization: authorization,
          databaseId: databaseId,
          collectionId: collectionId,
          encryptedAuthToken: encryptedAuthToken,
          apiEndpoint: apiEndpoint,
        },
      },
      window.origin,
    );
  }

  //eslint-disable-next-line
  private handleLogMessage(event: MessageEvent, shellIframe: HTMLIFrameElement) {
    if (!("logType" in event.data.data) || typeof event.data.data["logType"] !== "string") {
      return;
    }
    if (!("logData" in event.data.data)) {
      return;
    }

    const dataToLog = { message: event.data.data.logData };
    const logType: string = event.data.data.logType;
    const shellTraceId: string = event.data.data.traceId || "none";

    switch (logType) {
      case LogType.Information:
        TelemetryProcessor.trace(Action.MongoShell, ActionModifiers.Success, dataToLog);
        break;
      case LogType.Warning:
        TelemetryProcessor.trace(Action.MongoShell, ActionModifiers.Failed, dataToLog);
        break;
      case LogType.Verbose:
        TelemetryProcessor.trace(Action.MongoShell, ActionModifiers.Mark, dataToLog);
        break;
      case LogType.StartTrace:
        //eslint-disable-next-line
        const telemetryTraceId: number = TelemetryProcessor.traceStart(Action.MongoShell, dataToLog);
        this._logTraces.set(shellTraceId, telemetryTraceId);
        break;
      case LogType.SuccessTrace:
        if (this._logTraces.has(shellTraceId)) {
          const originalTelemetryTraceId: number = this._logTraces.get(shellTraceId);
          TelemetryProcessor.traceSuccess(Action.MongoShell, dataToLog, originalTelemetryTraceId);
          this._logTraces.delete(shellTraceId);
        } else {
          TelemetryProcessor.trace(Action.MongoShell, ActionModifiers.Success, dataToLog);
        }
        break;
      case LogType.FailureTrace:
        if (this._logTraces.has(shellTraceId)) {
          const originalTelemetryTraceId: number = this._logTraces.get(shellTraceId);
          TelemetryProcessor.traceFailure(Action.MongoShell, dataToLog, originalTelemetryTraceId);
          this._logTraces.delete(shellTraceId);
        } else {
          TelemetryProcessor.trace(Action.MongoShell, ActionModifiers.Failed, dataToLog);
        }
        break;
    }
  }

  //eslint-disable-next-line
  private handleNotificationMessage(event: MessageEvent, shellIframe: HTMLIFrameElement) {
    if (!("logType" in event.data.data) || typeof event.data.data["logType"] !== "string") {
      return;
    }
    if (!("logData" in event.data.data)) {
      return;
    }

    const dataToLog: string = event.data.data.logData;
    const logType: string = event.data.data.logType;

    switch (logType) {
      case LogType.Information:
        return logConsoleInfo(dataToLog);
      case LogType.Warning:
        return logConsoleError(dataToLog);
      case LogType.InProgress:
        return logConsoleProgress(dataToLog);
    }
  }

  render(): JSX.Element {
    return (
      <iframe
        name="explorer"
        className="iframe"
        style={{ width: "100%", height: "100%", border: 0, padding: 0, margin: 0, overflow: "hidden" }}
        src={this.state.url}
        id={this.props.tabsBaseInstance.tabId}
        onLoad={(event) => this.setContentFocus(event)}
        title="Mongo Shell"
        role="tabpanel"
      ></iframe>
    );
  }
}
