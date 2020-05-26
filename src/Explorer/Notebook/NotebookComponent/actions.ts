import { ContentRef } from "@nteract/core";
import { CellId } from "@nteract/commutable";

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
    payload
  };
};

export const UPDATE_LAST_MODIFIED = "UPDATE_LAST_MODIFIED";
export interface UpdateLastModifiedAction {
  type: "UPDATE_LAST_MODIFIED";
  payload: {
    contentRef: ContentRef;
    lastModified: string;
  };
}

export const updateLastModified = (payload: {
  contentRef: ContentRef;
  lastModified: string;
}): UpdateLastModifiedAction => {
  return {
    type: UPDATE_LAST_MODIFIED,
    payload
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
    payload
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
    payload
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
    payload
  };
};
