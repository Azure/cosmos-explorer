import { Action, ActionModifiers } from "./TelemetryConstants";
import { sendMessage } from "../../Common/MessageHandler";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { appInsights } from "../appInsights";
import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";
import { getDataExplorerWindow } from "../../Utils/WindowUtils";

/**
 * Class that persists telemetry data to the portal tables.
 */

type TelemetryData = { [key: string]: unknown };

export function trace(action: Action, actionModifier: string = ActionModifiers.Mark, data?: TelemetryData): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: actionModifier,
      data: JSON.stringify(data),
    },
  });

  appInsights.trackEvent({ name: Action[action] }, getData(actionModifier, data));
}

export function traceStart(action: Action, data?: TelemetryData): number {
  const timestamp: number = Date.now();
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Start,
      timestamp: timestamp,
      data: JSON.stringify(data),
    },
  });

  appInsights.startTrackEvent(Action[action]);
  return timestamp;
}

export function traceSuccess(action: Action, data?: TelemetryData, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Success,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(data),
    },
  });

  appInsights.stopTrackEvent(Action[action], getData(ActionModifiers.Success, data));
}

export function traceFailure(action: Action, data?: TelemetryData, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Failed,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(data),
    },
  });

  appInsights.stopTrackEvent(Action[action], getData(ActionModifiers.Failed, data));
}

export function traceCancel(action: Action, data?: TelemetryData, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Cancel,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(data),
    },
  });

  appInsights.stopTrackEvent(Action[action], getData(ActionModifiers.Cancel, data));
}

export function traceOpen(action: Action, data?: TelemetryData, timestamp?: number): number {
  const validTimestamp = timestamp || Date.now();
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Open,
      timestamp: validTimestamp,
      data: JSON.stringify(data),
    },
  });

  appInsights.startTrackEvent(Action[action]);
  return validTimestamp;
}

export function traceMark(action: Action, data?: TelemetryData, timestamp?: number): number {
  const validTimestamp = timestamp || Date.now();
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Mark,
      timestamp: validTimestamp,
      data: JSON.stringify(data),
    },
  });

  appInsights.startTrackEvent(Action[action]);
  return validTimestamp;
}

function getData(actionModifier: string, data: TelemetryData = {}): { [key: string]: string } {
  const dataExplorerWindow = getDataExplorerWindow(window);
  return {
    // TODO: Need to `any` here since the window imports Explorer which can't be in strict mode yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authType: dataExplorerWindow && (dataExplorerWindow as any).authType,
    subscriptionId: userContext.subscriptionId as string,
    platform: configContext.platform,
    env: process.env.NODE_ENV as string,
    actionModifier,
    ...data,
  };
}
