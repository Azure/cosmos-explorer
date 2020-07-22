import * as Immutable from "immutable";
import { AppState, ContentRef } from "@nteract/core";

import { Notebook } from "../../../Common/Constants";
import { CellId } from "@nteract/commutable";

export interface CdbRecordProps {
  databaseAccountName: string | undefined;
  defaultExperience: string | undefined;
  kernelRestartDelayMs: number;
  hoveredCellId: CellId | undefined;
  currentNotebookParentElements: Map<ContentRef, HTMLElement>;
}

export type CdbRecord = Immutable.RecordOf<CdbRecordProps>;

export interface CdbAppState extends AppState {
  cdb: CdbRecord;
}

export const makeCdbRecord = Immutable.Record<CdbRecordProps>({
  databaseAccountName: undefined,
  defaultExperience: undefined,
  kernelRestartDelayMs: Notebook.kernelRestartInitialDelayMs,
  hoveredCellId: undefined,
  currentNotebookParentElements: new Map<ContentRef, HTMLElement>()
});
