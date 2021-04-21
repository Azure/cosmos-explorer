import { CellId } from "@nteract/commutable";
import { AppState, ContentRef } from "@nteract/core";
import * as Immutable from "immutable";
import { Notebook } from "../../../Common/Constants";

export interface SnapshotFragment {
  image: HTMLImageElement;
  boundingClientRect: DOMRect;
  requestId: string;
}

export interface CdbRecordProps {
  databaseAccountName: string | undefined;
  defaultExperience: string | undefined;
  kernelRestartDelayMs: number;
  hoveredCellId: CellId | undefined;
  currentNotebookParentElements: Map<ContentRef, HTMLElement>;
  cellOutputSnapshots: Map<string, SnapshotFragment>;
  notebookSnapshot: { imageSrc: string; requestId: string };
  pendingSnapshotRequest: {
    requestId: string;
    viewport: DOMRect;
  };
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
  currentNotebookParentElements: new Map<ContentRef, HTMLElement>(),
  cellOutputSnapshots: new Map(),
  notebookSnapshot: undefined,
  pendingSnapshotRequest: undefined,
});
