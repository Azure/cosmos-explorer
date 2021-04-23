import { CellId } from "@nteract/commutable";
import { AppState } from "@nteract/core";
import * as Immutable from "immutable";
import { Notebook } from "../../../Common/Constants";

export interface SnapshotFragment {
  image: HTMLImageElement;
  boundingClientRect: DOMRect;
  requestId: string;
}

export interface SnapshotRequest {
  requestId: string;
  aspectRatio: number;
  type: "notebook" | "celloutput";
  cellId: string; // if type is "celloutput"
}
export interface CdbRecordProps {
  databaseAccountName: string | undefined;
  defaultExperience: string | undefined;
  kernelRestartDelayMs: number;
  hoveredCellId: CellId | undefined;
  cellOutputSnapshots: Map<string, SnapshotFragment>;
  notebookSnapshot: { imageSrc: string; requestId: string };
  pendingSnapshotRequest: SnapshotRequest;
  notebookSnapshotError: string;
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
  cellOutputSnapshots: new Map(),
  notebookSnapshot: undefined,
  pendingSnapshotRequest: undefined,
  notebookSnapshotError: undefined,
});
