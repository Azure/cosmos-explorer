import { Action, ActionModifiers } from "./TelemetryConstants";
import { sendMessage } from "../../Common/MessageHandler";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { appInsights } from "../appInsights";
import { config } from "../../ConfigContext";

/**
 * Class that persists telemetry data to the portal tables.
 */
// TODO: Move to a separate Diagnostics folder
// TODO: Log telemetry for StorageExplorer case/other clients as well
export default class TelemetryProcessor {
  public static trace(action: Action, actionModifier: string = ActionModifiers.Mark, data?: any): void {
    sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: actionModifier,
        data: JSON.stringify(data)
      }
    });

    appInsights.trackEvent({ name: Action[action] }, TelemetryProcessor.getData(data));
  }

  public static traceStart(action: Action, data?: any): number {
    const timestamp: number = Date.now();
    sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Start,
        timestamp: timestamp,
        data: JSON.stringify(data)
      }
    });

    appInsights.startTrackEvent(Action[action]);
    return timestamp;
  }

  public static traceSuccess(action: Action, data?: any, timestamp?: number): void {
    sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Success,
        timestamp: timestamp || Date.now(),
        data: JSON.stringify(data)
      }
    });

    appInsights.stopTrackEvent(Action[action], TelemetryProcessor.getData(data));
  }

  public static traceFailure(action: Action, data?: any, timestamp?: number): void {
    sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Failed,
        timestamp: timestamp || Date.now(),
        data: JSON.stringify(data)
      }
    });

    appInsights.stopTrackEvent(Action[action], TelemetryProcessor.getData(data));
  }

  public static traceCancel(action: Action, data?: any, timestamp?: number): void {
    sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Cancel,
        timestamp: timestamp || Date.now(),
        data: JSON.stringify(data)
      }
    });

    appInsights.stopTrackEvent(Action[action], TelemetryProcessor.getData(data));
  }

  public static traceOpen(action: Action, data?: any, timestamp?: number): number {
    const validTimestamp = timestamp || Date.now();
    sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Open,
        timestamp: validTimestamp,
        data: JSON.stringify(data)
      }
    });

    appInsights.startTrackEvent(Action[action]);
    return validTimestamp;
  }

  public static traceMark(action: Action, data?: any, timestamp?: number): number {
    const validTimestamp = timestamp || Date.now();
    sendMessage({
      type: MessageTypes.TelemetryInfo,
      data: {
        action: Action[action],
        actionModifier: ActionModifiers.Mark,
        timestamp: validTimestamp,
        data: JSON.stringify(data)
      }
    });

    appInsights.startTrackEvent(Action[action]);
    return validTimestamp;
  }

  private static getData(data?: any): any {
    return {
      platform: config.platform,
      ...(data ? data : [])
    };
  }
}
