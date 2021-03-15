import { sendMessage } from "../../Common/MessageHandler";
import { configContext } from "../../ConfigContext";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { userContext } from "../../UserContext";
import { appInsights } from "../appInsights";
import { Action, ActionModifiers } from "./TelemetryConstants";

// TODO: Remove this. It is perfectly find to pass any data to telemtry methods.
// This was added only to maintain stability while removing dependencies on explorer.databaseAccount and explorer.defaultExperience
type allowedKeys =
  | "notebookId"
  | "collectionId"
  | "collectionName"
  | "error"
  | "isSample"
  | "downloadCount"
  | "baseUrl"
  | "source"
  | "description"
  | "dataExplorerArea"
  | "databaseName"
  | "downloadCount"
  | "favoriteCount"
  | "abuseCategory"
  | "errorStack"
  | "tabTitle"
  | "tabId"
  | "conflictResourceType"
  | "conflictOperationType"
  | "conflictResourceId"
  | "message"
  | "files"
  | "notebooks"
  | "directories"
  | "tabName"
  | "databaseId"
  | "queryName"
  | "isPublishPending"
  | "label"
  | "scopesSelected"
  | "title"
  | "level"
  | "changedSelectedValueTo"
  | "area"
  | "area"
  | "paneTitle"
  | "notebookUrl"
  | "isNotebookEnabled"
  | "commandButtonClicked"
  | "count"
  | "publishedCount"
  | "underReviewCount"
  | "removedCount";

type TelemetryData = { [key in allowedKeys]?: unknown };

export function trace(action: Action, actionModifier: string = ActionModifiers.Mark, data: TelemetryData = {}): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: actionModifier,
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.trackEvent({ name: Action[action] }, decorateData(data, actionModifier));
}

export function traceStart(action: Action, data?: TelemetryData): number {
  const timestamp: number = Date.now();
  sendMessage({
    type: MessageTypes.TelemetryInfo,
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

export function traceSuccess(action: Action, data?: TelemetryData, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Success,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Success));
}

export function traceFailure(action: Action, data?: TelemetryData, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Failed,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Failed));
}

export function traceCancel(action: Action, data?: TelemetryData, timestamp?: number): void {
  sendMessage({
    type: MessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: ActionModifiers.Cancel,
      timestamp: timestamp || Date.now(),
      data: JSON.stringify(decorateData(data)),
    },
  });

  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Cancel));
}

export function traceOpen(action: Action, data?: TelemetryData, timestamp?: number): number {
  const validTimestamp = timestamp || Date.now();
  sendMessage({
    type: MessageTypes.TelemetryInfo,
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

export function traceMark(action: Action, data?: TelemetryData, timestamp?: number): number {
  const validTimestamp = timestamp || Date.now();
  sendMessage({
    type: MessageTypes.TelemetryInfo,
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

function decorateData(data: TelemetryData = {}, actionModifier?: string) {
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
