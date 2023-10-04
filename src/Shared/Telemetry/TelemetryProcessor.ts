import { sendMessage } from "../../Common/MessageHandler";
import { configContext } from "../../ConfigContext";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { SelfServeMessageTypes } from "../../Contracts/SelfServeContracts";
import { userContext } from "../../UserContext";
import { startTrackEvent, stopTrackEvent, trackEvent } from "../appInsights";
import { Action, ActionModifiers } from "./TelemetryConstants";

// Right now, the ExplorerContracts has MessageTypes as a numeric enum (TelemetryInfo = 0) while the SelfServeContracts
// has MessageTypes as a string enum (TelemetryInfo = "TelemetryInfo"). We should move to string enums for all use cases.
type TelemetryType = MessageTypes.TelemetryInfo | SelfServeMessageTypes.TelemetryInfo;

export type TelemetryData = { [key: string]: unknown };

export function trace(
  action: Action,
  actionModifier: string = ActionModifiers.Mark,
  data: TelemetryData = {},
  type: TelemetryType = MessageTypes.TelemetryInfo,
): void {
  sendMessage({
    type: type,
    data: {
      action: Action[action],
      actionModifier: actionModifier,
      data: JSON.stringify(decorateData(data)),
    },
  });

  trackEvent({ name: Action[action] }, decorateData(data, actionModifier));
}

export function traceStart(
  action: Action,
  data?: TelemetryData,
  type: TelemetryType = MessageTypes.TelemetryInfo,
): number {
  const timestamp: number = Date.now();
  sendMessage({
    type: type,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Start,
      timestamp: timestamp,
      data: JSON.stringify(decorateData(data)),
    },
  });

  startTrackEvent(Action[action]);
  return timestamp;
}

export function traceSuccess(
  action: Action,
  data?: TelemetryData,
  timestamp?: number,
  type: TelemetryType = MessageTypes.TelemetryInfo,
): void {
  sendMessage({
    type: type,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Success,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Success));
}

export function traceFailure(
  action: Action,
  data?: TelemetryData,
  timestamp?: number,
  type: TelemetryType = MessageTypes.TelemetryInfo,
): void {
  sendMessage({
    type: type,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Failed,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Failed));
}

export function traceCancel(
  action: Action,
  data?: TelemetryData,
  timestamp?: number,
  type: TelemetryType = MessageTypes.TelemetryInfo,
): void {
  sendMessage({
    type: type,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Cancel,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Cancel));
}

export function traceOpen(
  action: Action,
  data?: TelemetryData,
  timestamp?: number,
  type: TelemetryType = MessageTypes.TelemetryInfo,
): number {
  const validTimestamp = timestamp || Date.now();
  sendMessage({
    type: type,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Open,
      timestamp: validTimestamp,
      data: JSON.stringify(decorateData(data)),
    },
  });

  startTrackEvent(Action[action]);
  return validTimestamp;
}

export function traceMark(
  action: Action,
  data?: TelemetryData,
  timestamp?: number,
  type: TelemetryType = MessageTypes.TelemetryInfo,
): number {
  const validTimestamp = timestamp || Date.now();
  sendMessage({
    type: type,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Mark,
      timestamp: validTimestamp,
      data: JSON.stringify(decorateData(data)),
    },
  });

  startTrackEvent(Action[action]);
  return validTimestamp;
}

function decorateData(data: TelemetryData = {}, actionModifier?: string) {
  return {
    databaseAccountName: userContext.databaseAccount?.name,
    defaultExperience: userContext.apiType,
    authType: userContext.authType,
    subscriptionId: userContext.subscriptionId,
    platform: configContext.platform,
    env: process.env.NODE_ENV,
    actionModifier,
    ...data,
  } as { [key: string]: string };
}
