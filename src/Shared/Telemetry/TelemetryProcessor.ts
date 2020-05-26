import { Action, ActionModifiers } from "./TelemetryConstants";
import { MessageHandler } from "../../Common/MessageHandler";
import { MessageTypes } from "../../Contracts/ExplorerContracts";

/**
 * Class that persists telemetry data to the portal tables.
 */
// TODO: Move to a separate Diagnostics folder
// TODO: Log telemetry for StorageExplorer case/other clients as well
export default class TelemetryProcessor {
  public static trace(action: Action, actionModifier: string = ActionModifiers.Mark, data?: any): void {
    MessageHandler.sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: actionModifier,
        data: JSON.stringify(data)
      }
    });

    const appInsights: Microsoft.ApplicationInsights.IAppInsights = (<any>window).appInsights;
    if (!appInsights) {
      return;
    }
    appInsights.trackEvent(Action[action], data);
  }

  public static traceStart(action: Action, data?: any): number {
    const timestamp: number = Date.now();
    MessageHandler.sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Start,
        timestamp: timestamp,
        data: JSON.stringify(data)
      }
    });

    const appInsights: Microsoft.ApplicationInsights.IAppInsights = (<any>window).appInsights;
    if (appInsights) {
      appInsights.startTrackEvent(Action[action]);
    }
    return timestamp;
  }

  public static traceSuccess(action: Action, data?: any, timestamp?: number): void {
    MessageHandler.sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Success,
        timestamp: timestamp || Date.now(),
        data: JSON.stringify(data)
      }
    });

    const appInsights: Microsoft.ApplicationInsights.IAppInsights = (<any>window).appInsights;
    if (!appInsights) {
      return;
    }
    appInsights.stopTrackEvent(Action[action], data);
  }

  public static traceFailure(action: Action, data?: any, timestamp?: number): void {
    MessageHandler.sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Failed,
        timestamp: timestamp || Date.now(),
        data: JSON.stringify(data)
      }
    });

    const appInsights: Microsoft.ApplicationInsights.IAppInsights = (<any>window).appInsights;
    if (!appInsights) {
      return;
    }
    appInsights.stopTrackEvent(Action[action], data);
  }

  public static traceCancel(action: Action, data?: any, timestamp?: number): void {
    MessageHandler.sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Cancel,
        timestamp: timestamp || Date.now(),
        data: JSON.stringify(data)
      }
    });

    const appInsights: Microsoft.ApplicationInsights.IAppInsights = (<any>window).appInsights;
    if (!appInsights) {
      return;
    }
    appInsights.stopTrackEvent(Action[action], data);
  }

  public static traceOpen(action: Action, data?: any, timestamp?: number): number {
    MessageHandler.sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Open,
        timestamp: timestamp || Date.now(),
        data: JSON.stringify(data)
      }
    });

    const appInsights: Microsoft.ApplicationInsights.IAppInsights = (<any>window).appInsights;
    if (appInsights) {
      appInsights.startTrackEvent(Action[action]);
    }
    return timestamp;
  }

  public static traceMark(action: Action, data?: any, timestamp?: number): number {
    MessageHandler.sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Mark,
        timestamp: timestamp || Date.now(),
        data: JSON.stringify(data)
      }
    });

    const appInsights: Microsoft.ApplicationInsights.IAppInsights = (<any>window).appInsights;
    if (appInsights) {
      appInsights.startTrackEvent(Action[action]);
    }
    return timestamp;
  }
}
