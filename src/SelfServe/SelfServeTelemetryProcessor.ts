import { sendMessage } from "../Common/MessageHandler";
import { configContext } from "../ConfigContext";
import { SelfServeMessageTypes } from "../Contracts/SelfServeContracts";
import { appInsights } from "../Shared/appInsights";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import { userContext } from "../UserContext";
import { SelfServeTelemetryMessage } from "./SelfServeTypes";

const action = Action.SelfServe;

export const trace = (data: SelfServeTelemetryMessage): void => {
  sendSelfServeTelemetryMessage(ActionModifiers.Mark, data);
  appInsights.trackEvent({ name: Action[action] }, decorateData(data, ActionModifiers.Mark));
};

export const traceStart = (data: SelfServeTelemetryMessage): number => {
  const timestamp: number = Date.now();
  sendSelfServeTelemetryMessage(ActionModifiers.Start, data);
  appInsights.startTrackEvent(Action[action]);
  return timestamp;
};

export const traceSuccess = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  sendSelfServeTelemetryMessage(ActionModifiers.Success, data, timestamp || Date.now());
  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Success));
};

export const traceFailure = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  sendSelfServeTelemetryMessage(ActionModifiers.Failed, data, timestamp || Date.now());
  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Failed));
};

export const traceCancel = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  sendSelfServeTelemetryMessage(ActionModifiers.Cancel, data, timestamp || Date.now());
  appInsights.stopTrackEvent(Action[action], decorateData(data, ActionModifiers.Cancel));
};

const sendSelfServeTelemetryMessage = (
  actionModifier: string,
  data: SelfServeTelemetryMessage,
  timeStamp?: number
): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataToSend: any = {
    type: SelfServeMessageTypes.TelemetryInfo,
    data: {
      action: Action[action],
      actionModifier: actionModifier,
      data: JSON.stringify(decorateData(data)),
    },
  };
  if (timeStamp) {
    dataToSend.data.timeStamp = timeStamp;
  }
  sendMessage(dataToSend);
};

const decorateData = (data: SelfServeTelemetryMessage, actionModifier?: string) => {
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
};
