import { sendMessage } from "../Common/MessageHandler";
import { configContext } from "../ConfigContext";
import { SelfServeMessageTypes } from "../Contracts/SelfServeContracts";
import { appInsights } from "../Shared/appInsights";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import { userContext } from "../UserContext";
import { SelfServeTelemetryMessage } from "./SelfServeTypes";

export function trace(action: Action, data: SelfServeTelemetryMessage): void {
  const actionModifier = ActionModifiers.Mark;
  sendMessage({
    type: SelfServeMessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: actionModifier,
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.trackEvent({ name: Action[action] }, decorateData(data, actionModifier));
}

export function traceStart(action: Action, data: SelfServeTelemetryMessage): number {
  const timestamp: number = Date.now();
  sendMessage({
    type: SelfServeMessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Start,
      timestamp: timestamp,
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.startTrackEvent(Action[action]);
  return timestamp;
}

export function traceSuccess(action: Action, data: SelfServeTelemetryMessage, timestamp?: number): void {
  sendMessage({
    type: SelfServeMessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Success,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Success));
}

export function traceFailure(action: Action, data: SelfServeTelemetryMessage, timestamp?: number): void {
  sendMessage({
    type: SelfServeMessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Failed,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Failed));
}

export function traceCancel(action: Action, data: SelfServeTelemetryMessage, timestamp?: number): void {
  sendMessage({
    type: SelfServeMessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Cancel,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Cancel));
}

export function traceOpen(action: Action, data: SelfServeTelemetryMessage, timestamp?: number): number {
  const validTimestamp = timestamp || Date.now();
  sendMessage({
    type: SelfServeMessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Open,
      timestamp: validTimestamp,
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.startTrackEvent(Action[action]);
  return validTimestamp;
}

export function traceMark(action: Action, data: SelfServeTelemetryMessage, timestamp?: number): number {
  const validTimestamp = timestamp || Date.now();
  sendMessage({
    type: SelfServeMessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Mark,
      timestamp: validTimestamp,
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.startTrackEvent(Action[action]);
  return validTimestamp;
}

function decorateData(data: SelfServeTelemetryMessage, actionModifier?: string) {
  return {
    databaseAccountName: userContext.databaseAccount?.name,
    defaultExperience: userContext.defaultExperience,
    authType: userContext.authType,
    subscriptionId: userContext.subscriptionId,
    platform: configContext.platform,
    env: process.env.NODE_ENV,
    actionModifier,
    ...data,
  } as { [key: string]: string };
}
