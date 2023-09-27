import { CellId } from "@nteract/commutable";
import { AppState } from "@nteract/core";
import { MessageType } from "@nteract/messaging";
import * as Immutable from "immutable";
import { Notebook } from "../../../Common/Constants";

export interface SnapshotFragment {
  image: HTMLImageElement;
  boundingClientRect: DOMRect;
  requestId: string;
}

export type SnapshotRequest = NotebookSnapshotRequest | CellSnapshotRequest;
interface NotebookSnapshotRequestBase {
  requestId: string;
  aspectRatio: number;
  notebookContentRef: string; // notebook redux contentRef
  downloadFilename?: string; // Optional: will download as a file
}

interface NotebookSnapshotRequest extends NotebookSnapshotRequestBase {
  type: "notebook";
}

interface CellSnapshotRequest extends NotebookSnapshotRequestBase {
  type: "celloutput";
  cellId: string;
}

export interface CdbRecordProps {
  databaseAccountName: string | undefined;
  defaultExperience: string | undefined;
  kernelRestartDelayMs: number;
  hoveredCellId: CellId | undefined;
  cellOutputSnapshots: Map<string, SnapshotFragment>;
  notebookSnapshot?: { imageSrc: string; requestId: string };
  pendingSnapshotRequest?: SnapshotRequest;
  notebookSnapshotError?: string;
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

export interface JupyterMessage<MT extends MessageType = MessageType, C = any> {
  header: JupyterMessageHeader<MT>;
  parent_header:
    | JupyterMessageHeader<any>
    | {
        msg_id?: string;
      };
  metadata: object;
  content: C;
  channel: string;
  buffers?: Uint8Array | null;
}

export interface JupyterMessageHeader<MT extends MessageType = MessageType> {
  msg_id: string;
  username: string;
  date: string;
  msg_type: MT;
  version: string;
  session: string;
  token: string;
}
