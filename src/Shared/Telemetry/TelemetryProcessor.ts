import { Action, ActionModifiers } from "./TelemetryConstants";
import { sendMessage } from "../../Common/MessageHandler";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { appInsights } from "../appInsights";
import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";

/**
 * Class that persists telemetry data to the portal tables.
 */

export function trace(action: Action, actionModifier: string = ActionModifiers.Mark, data?: unknown): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: actionModifier,
      data: JSON.stringify(data)
    }
  });

  appInsights.trackEvent({ name: Action[action] }, getData(data));
}

export function traceStart(action: Action, data?: unknown): number {
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

export function traceSuccess(action: Action, data?: unknown, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Success,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(data)
    }
  });

  appInsights.stopTrackEvent(Action[action], getData(data));
}

export function traceFailure(action: Action, data?: unknown, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Failed,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(data)
    }
  });

  appInsights.stopTrackEvent(Action[action], getData(data));
}

export function traceCancel(action: Action, data?: unknown, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Cancel,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(data)
    }
  });

  appInsights.stopTrackEvent(Action[action], getData(data));
}

export function traceOpen(action: Action, data?: unknown, timestamp?: number): number {
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

export function traceMark(action: Action, data?: unknown, timestamp?: number): number {
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

function getData(data: unknown = {}): { [key: string]: string } | undefined {
  if (typeof data === "string") {
    data = { message: data };
  }
  if (typeof data === "object") {
    return {
      // TODO: Need to `any` here since the window imports Explorer which can't be in strict mode yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authType: (window as any).authType,
      subscriptionId: userContext.subscriptionId as string,
      platform: configContext.platform,
      env: process.env.NODE_ENV as string,
      ...data
    };
  }
  return undefined;
}
