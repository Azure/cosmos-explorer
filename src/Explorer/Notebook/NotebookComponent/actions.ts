import { CellId } from "@nteract/commutable";
import { ContentRef } from "@nteract/core";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { SnapshotFragment, SnapshotRequest } from "./types";

export const CLOSE_NOTEBOOK = "CLOSE_NOTEBOOK";
export interface CloseNotebookAction {
  type: "CLOSE_NOTEBOOK";
  payload: {
    contentRef: ContentRef;
  };
}

export const closeNotebook = (payload: { contentRef: ContentRef }): CloseNotebookAction => {
  return {
    type: CLOSE_NOTEBOOK,
    payload,
  };
};

export const EXECUTE_FOCUSED_CELL_AND_FOCUS_NEXT = "EXECUTE_FOCUSED_CELL_AND_FOCUS_NEXT";
export interface ExecuteFocusedCellAndFocusNextAction {
  type: "EXECUTE_FOCUSED_CELL_AND_FOCUS_NEXT";
  payload: {
    contentRef: ContentRef;
  };
}

export const executeFocusedCellAndFocusNext = (payload: {
  contentRef: ContentRef;
}): ExecuteFocusedCellAndFocusNextAction => {
  return {
    type: EXECUTE_FOCUSED_CELL_AND_FOCUS_NEXT,
    payload,
  };
};

export const UPDATE_KERNEL_RESTART_DELAY = "UPDATE_KERNEL_RESTART_DELAY";
export interface UpdateKernelRestartDelayAction {
  type: "UPDATE_KERNEL_RESTART_DELAY";
  payload: {
    delayMs: number;
  };
}

export const UpdateKernelRestartDelay = (payload: { delayMs: number }): UpdateKernelRestartDelayAction => {
  return {
    type: UPDATE_KERNEL_RESTART_DELAY,
    payload,
  };
};

export const SET_HOVERED_CELL = "SET_HOVERED_CELL";
export interface SetHoveredCellAction {
  type: "SET_HOVERED_CELL";
  payload: {
    cellId: CellId;
  };
}

export const setHoveredCell = (payload: { cellId: CellId }): SetHoveredCellAction => {
  return {
    type: SET_HOVERED_CELL,
    payload,
  };
};

export const TRACE_NOTEBOOK_TELEMETRY = "TRACE_NOTEBOOK_TELEMETRY";
export interface TraceNotebookTelemetryAction {
  type: "TRACE_NOTEBOOK_TELEMETRY";
  payload: {
    action: Action;
    actionModifier?: string;
    data?: any;
  };
}

export const traceNotebookTelemetry = (payload: {
  action: Action;
  actionModifier?: string;
  data?: any;
}): TraceNotebookTelemetryAction => {
  return {
    type: TRACE_NOTEBOOK_TELEMETRY,
    payload,
  };
};

export const STORE_CELL_OUTPUT_SNAPSHOT = "STORE_CELL_OUTPUT_SNAPSHOT";
export interface StoreCellOutputSnapshotAction {
  type: "STORE_CELL_OUTPUT_SNAPSHOT";
  payload: {
    cellId: string;
    snapshot: SnapshotFragment;
  };
}

export const storeCellOutputSnapshot = (payload: {
  cellId: string;
  snapshot: SnapshotFragment;
}): StoreCellOutputSnapshotAction => {
  return {
    type: STORE_CELL_OUTPUT_SNAPSHOT,
    payload,
  };
};

export const STORE_NOTEBOOK_SNAPSHOT = "STORE_NOTEBOOK_SNAPSHOT";
export interface StoreNotebookSnapshotAction {
  type: "STORE_NOTEBOOK_SNAPSHOT";
  payload: {
    imageSrc: string;
    requestId: string;
  };
}

export const storeNotebookSnapshot = (payload: {
  imageSrc: string;
  requestId: string;
}): StoreNotebookSnapshotAction => {
  return {
    type: STORE_NOTEBOOK_SNAPSHOT,
    payload,
  };
};

export const TAKE_NOTEBOOK_SNAPSHOT = "TAKE_NOTEBOOK_SNAPSHOT";
export interface TakeNotebookSnapshotAction {
  type: "TAKE_NOTEBOOK_SNAPSHOT";
  payload: SnapshotRequest;
}

export const takeNotebookSnapshot = (payload: SnapshotRequest): TakeNotebookSnapshotAction => {
  return {
    type: TAKE_NOTEBOOK_SNAPSHOT,
    payload,
  };
};

export const NOTEBOOK_SNAPSHOT_ERROR = "NOTEBOOK_SNAPSHOT_ERROR";
export interface NotebookSnapshotErrorAction {
  type: "NOTEBOOK_SNAPSHOT_ERROR";
  payload: {
    error: string;
  };
}

export const notebookSnapshotError = (payload: { error: string }): NotebookSnapshotErrorAction => {
  return {
    type: NOTEBOOK_SNAPSHOT_ERROR,
    payload,
  };
};
