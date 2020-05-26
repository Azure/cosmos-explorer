import * as cdbActions from "./actions";
import { CdbRecord } from "./types";

import { Action } from "redux";
import { actions, CoreRecord, reducers as nteractReducers } from "@nteract/core";

export const coreReducer = (state: CoreRecord, action: Action) => {
  let typedAction;
  switch (action.type) {
    case cdbActions.CLOSE_NOTEBOOK: {
      typedAction = action as cdbActions.CloseNotebookAction;
      return state.setIn(
        ["entities", "contents", "byRef"],
        state.entities.contents.byRef.delete(typedAction.payload.contentRef)
      );
    }
    case actions.CHANGE_KERNEL_BY_NAME: {
      // Update content metadata
      typedAction = action as actions.ChangeKernelByName;
      const kernelSpecName = typedAction.payload.kernelSpecName;

      if (!state.currentKernelspecsRef) {
        return state;
      }

      const currentKernelspecs = state.entities.kernelspecs.byRef.get(state.currentKernelspecsRef);
      if (!currentKernelspecs) {
        return state;
      }

      // Find kernelspecs by name
      const kernelspecs = currentKernelspecs.byName.get(kernelSpecName);
      if (!kernelspecs) {
        return state;
      }

      const path = [
        "entities",
        "contents",
        "byRef",
        typedAction.payload.contentRef,
        "model",
        "notebook",
        "metadata",
        "kernelspec"
      ];
      // Update metadata
      return state
        .setIn(path.concat("name"), kernelspecs.name)
        .setIn(path.concat("displayName"), kernelspecs.displayName)
        .setIn(path.concat("language"), kernelspecs.language);
    }
    case cdbActions.UPDATE_LAST_MODIFIED: {
      typedAction = action as cdbActions.UpdateLastModifiedAction;
      const path = ["entities", "contents", "byRef", typedAction.payload.contentRef, "lastSaved"];
      return state.setIn(path, typedAction.payload.lastModified);
    }
    default:
      return nteractReducers.core(state as any, action as any);
  }
};

export const cdbReducer = (state: CdbRecord, action: Action) => {
  if (!state) {
    return null;
  }

  switch (action.type) {
    case cdbActions.UPDATE_KERNEL_RESTART_DELAY: {
      const typedAction = action as cdbActions.UpdateKernelRestartDelayAction;
      return state.set("kernelRestartDelayMs", typedAction.payload.delayMs);
    }

    case cdbActions.SET_HOVERED_CELL: {
      const typedAction = action as cdbActions.SetHoveredCellAction;
      return state.set("hoveredCellId", typedAction.payload.cellId);
    }
  }
  return state;
};
