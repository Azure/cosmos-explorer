import * as Immutable from "immutable";
import { AppState } from "@nteract/core";

import { Notebook } from "../../../Common/Constants";
import { CellId } from "@nteract/commutable";

export interface CdbRecordProps {
  databaseAccountName: string;
  defaultExperience: string;
  kernelRestartDelayMs: number;
  hoveredCellId: CellId;
}

export type CdbRecord = Immutable.RecordOf<CdbRecordProps>;

export interface CdbAppState extends AppState {
  cdb: CdbRecord;
}

export const makeCdbRecord = Immutable.Record<CdbRecordProps>({
  databaseAccountName: undefined,
  defaultExperience: undefined,
  kernelRestartDelayMs: Notebook.kernelRestartInitialDelayMs,
  hoveredCellId: undefined
});
