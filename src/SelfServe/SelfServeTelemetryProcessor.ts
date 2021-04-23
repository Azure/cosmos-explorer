/**
 * @module SelfServe/SelfServeTelemetryProcessor
 */

import { SelfServeMessageTypes } from "../Contracts/SelfServeContracts";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import { trace, traceCancel, traceFailure, traceStart, traceSuccess } from "../Shared/Telemetry/TelemetryProcessor";
import { SelfServeTelemetryMessage } from "./SelfServeTypes";

/**
 * Trace a self serve action.
 * @param data Data to be sent as part of the Self Serve Telemetry.
 */
export const selfServeTrace = (data: SelfServeTelemetryMessage): void => {
  trace(Action.SelfServe, ActionModifiers.Mark, data, SelfServeMessageTypes.TelemetryInfo);
};

/**
 * Start tracing a self serve action.
 * @param data Data to be sent as part of the Self Serve Telemetry.
 * @returns Timestamp of the trace start, that can be used in other trace actions.
 * The timestamp is used to identify all the traces associated with an action.
 */
export const selfServeTraceStart = (data: SelfServeTelemetryMessage): number => {
  return traceStart(Action.SelfServe, data, SelfServeMessageTypes.TelemetryInfo);
};

/**
 * Trace self serve action as a success.
 * @param data Data to be sent as part of the Self Serve Telemetry.
 * @param timestamp Timestamp of the action's start trace.
 */
export const selfServeTraceSuccess = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  traceSuccess(Action.SelfServe, data, timestamp, SelfServeMessageTypes.TelemetryInfo);
};

/**
 * Trace self serve action as a failure.
 * @param data Data to be sent as part of the Self Serve Telemetry.
 * @param timestamp Timestamp of the action's start trace.
 */
export const selfServeTraceFailure = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  traceFailure(Action.SelfServe, data, timestamp, SelfServeMessageTypes.TelemetryInfo);
};

/**
 * Trace self serve action as cancelled.
 * @param data Data to be sent as part of the Self Serve Telemetry.
 * @param timestamp Timestamp of the action's start trace.
 */
export const selfServeTraceCancel = (data: SelfServeTelemetryMessage, timestamp?: number): void => {
  traceCancel(Action.SelfServe, data, timestamp, SelfServeMessageTypes.TelemetryInfo);
};
