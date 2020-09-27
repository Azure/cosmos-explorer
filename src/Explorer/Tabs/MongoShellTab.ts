import * as Constants from "../../Common/Constants";
import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import AuthHeadersUtil from "../../Platform/Hosted/Authorization";
import { isInvalidParentFrameOrigin } from "../../Utils/MessageValidation";
import Q from "q";
import TabsBase from "./TabsBase";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { HashMap } from "../../Common/HashMap";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { PlatformType } from "../../PlatformType";
import Explorer from "../Explorer";
import { userContext } from "../../UserContext";

export default class MongoShellTab extends TabsBase {
  public url: ko.Computed<string>;
  private _container: Explorer;
  private _runtimeEndpoint: string;
  private _logTraces: HashMap<number>;

  constructor(options: ViewModels.TabOptions) {
    super(options);
    this._logTraces = new HashMap<number>();
    this._container = options.collection.container;
    this.url = ko.computed<string>(() => {
      const account = userContext.databaseAccount;
      const resourceId = account && account.id;
      const accountName = account && account.name;
      const mongoEndpoint = account && (account.properties.mongoEndpoint || account.properties.documentEndpoint);

      this._runtimeEndpoint =
        window.dataExplorerPlatform == PlatformType.Hosted ? AuthHeadersUtil.extensionEndpoint : "";
      const extensionEndpoint: string = this._container.extensionEndpoint() || this._runtimeEndpoint || "";
      let baseUrl = "/content/mongoshell/dist/";
      if (this._container.serverId() === "localhost") {
        baseUrl = "/content/mongoshell/";
      }

      return `${extensionEndpoint}${baseUrl}index.html?resourceId=${resourceId}&accountName=${accountName}&mongoEndpoint=${mongoEndpoint}`;
    });

    window.addEventListener("message", this.handleMessage.bind(this), false);
  }

  public setContentFocus(event: any): any {
    // TODO: Work around cross origin security issue in Hosted Data Explorer by using Shell <-> Data Explorer messaging (253527)
    // if(event.type === "load" && window.dataExplorerPlatform != PlatformType.Hosted) {
    //     let activeShell = event.target.contentWindow && event.target.contentWindow.mongo && event.target.contentWindow.mongo.shells && event.target.contentWindow.mongo.shells[0];
    //     activeShell && setTimeout(function(){
    //         activeShell.focus();
    //     },2000);
    // }
  }

  public onTabClick(): Q.Promise<any> {
    return super.onTabClick().then(() => {
      this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
    });
  }

  public handleMessage(event: MessageEvent) {
    if (isInvalidParentFrameOrigin(event)) {
      return;
    }

    const shellIframe: HTMLIFrameElement = <HTMLIFrameElement>document.getElementById(this.tabId);

    if (!shellIframe) {
      return;
    }
    if (typeof event.data !== "object" || event.data["signature"] !== "mongoshell") {
      return;
    }
    if (!("data" in event.data) || !("eventType" in event.data)) {
      return;
    }

    if (event.data.eventType == MessageType.IframeReady) {
      this.handleReadyMessage(event, shellIframe);
    } else if (event.data.eventType == MessageType.Notification) {
      this.handleNotificationMessage(event, shellIframe);
    } else {
      this.handleLogMessage(event, shellIframe);
    }
  }

  private handleReadyMessage(event: MessageEvent, shellIframe: HTMLIFrameElement) {
    if (typeof event.data["data"] !== "string") {
      return;
    }
    if (event.data.data !== "ready") {
      return;
    }

    const authorization: string = userContext.authorizationToken || "";
    const resourceId = this._container.databaseAccount().id;
    const accountName = this._container.databaseAccount().name;
    const documentEndpoint =
      this._container.databaseAccount().properties.mongoEndpoint ||
      this._container.databaseAccount().properties.documentEndpoint;
    const mongoEndpoint =
      documentEndpoint.substr(
        Constants.MongoDBAccounts.protocol.length + 3,
        documentEndpoint.length -
          (Constants.MongoDBAccounts.protocol.length + 2 + Constants.MongoDBAccounts.defaultPort.length)
      ) + Constants.MongoDBAccounts.defaultPort.toString();
    const databaseId = this.collection.databaseId;
    const collectionId = this.collection.id();
    const apiEndpoint = this._container.extensionEndpoint();
    const encryptedAuthToken: string = userContext.accessToken;

    shellIframe.contentWindow.postMessage(
      {
        signature: "dataexplorer",
        data: {
          resourceId: resourceId,
          accountName: accountName,
          mongoEndpoint: mongoEndpoint,
          authorization: authorization,
          databaseId: databaseId,
          collectionId: collectionId,
          encryptedAuthToken: encryptedAuthToken,
          apiEndpoint: apiEndpoint
        }
      },
      this._container.extensionEndpoint()
    );
  }

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
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, dataToLog);
        break;
      case LogType.Warning:
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, dataToLog);
        break;
      case LogType.InProgress:
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, dataToLog);
    }
  }
}

class MessageType {
  static IframeReady: string = "iframeready";
  static Notification: string = "notification";
  static Log: string = "log";
}

class LogType {
  static Information: string = "information";
  static Warning: string = "warning";
  static Verbose: string = "verbose";
  static InProgress: string = "inprogress";
  static StartTrace: string = "start";
  static SuccessTrace: string = "success";
  static FailureTrace: string = "failure";
}
