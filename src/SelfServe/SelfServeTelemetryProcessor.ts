import { SelfServeMessageTypes } from "../Contracts/SelfServeContracts";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import { trace, traceCancel, traceFailure, traceStart, traceSuccess } from "../Shared/Telemetry/TelemetryProcessor";
import { SelfServeTelemetryMessage } from "./SelfServeTypes";

export const selfServeTrace = (data: SelfServeTelemetryMessage): void => {
  trace(Action.SelfServe, ActionModifiers.Mark, data, SelfServeMessageTypes.TelemetryInfo);
};

export const selfServeTraceStart = (data: SelfServeTelemetryMessage): number => {
  return traceStart(Action.SelfServe, data, SelfServeMessageTypes.TelemetryInfo);
};

export const selfServeTraceSuccess = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  traceSuccess(Action.SelfServe, data, timestamp, SelfServeMessageTypes.TelemetryInfo);
};

export const selfServeTraceFailure = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  traceFailure(Action.SelfServe, data, timestamp, SelfServeMessageTypes.TelemetryInfo);
};

export const selfServeTraceCancel = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  traceCancel(Action.SelfServe, data, timestamp, SelfServeMessageTypes.TelemetryInfo);
};
