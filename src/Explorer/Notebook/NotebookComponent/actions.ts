import { CellId } from "@nteract/commutable";
import { ContentRef } from "@nteract/core";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";

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

export const UPDATE_NOTEBOOK_PARENT_DOM_ELTS = "UPDATE_NOTEBOOK_PARENT_DOM_ELTS";
export interface UpdateNotebookParentDomEltAction {
  type: "UPDATE_NOTEBOOK_PARENT_DOM_ELTS";
  payload: {
    contentRef: ContentRef;
    parentElt: HTMLElement;
  };
}

export const UpdateNotebookParentDomElt = (payload: {
  contentRef: ContentRef;
  parentElt: HTMLElement;
}): UpdateNotebookParentDomEltAction => {
  return {
    type: UPDATE_NOTEBOOK_PARENT_DOM_ELTS,
    payload,
  };
};
