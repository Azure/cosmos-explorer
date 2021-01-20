/**
 * Message handling with iframe parent
 */
export interface UpdateMessage {
  command: string;
  arg?: any;
}
export declare type ContentType = "notebook" | "file" | "directory";
export interface ContentItem {
  name: string;
  path: string;
  type: ContentType;
}
export interface UploadData {
  filepath: string;
  content: string;
}
export interface RenameFileData {
  sourcePath: string;
  targetPath: string;
}
export interface RenameFileResult {
  source: string;
  target: ContentItem;
}
export interface FromDataExplorerMessage {
  type: MessageTypes;
  params: any;
  id: string;
}
export declare type KernelStatusStates =
  | "unknown"
  | "starting"
  | "reconnecting"
  | "idle"
  | "busy"
  | "restarting"
  | "autorestarting"
  | "dead"
  | "connected";
/**
 * Unsolicited message
 */
export interface FromNotebookUpdateMessage {
  type: NotebookUpdateTypes;
  arg?: any;
}
/**
 * Response to a Data Explorer request
 */
export interface FromNotebookResponseMessage {
  id: string;
  data?: any;
  error?: any;
}
export interface FromNotebookMessage {
  actionType: ActionTypes;
  message: FromNotebookUpdateMessage | FromNotebookResponseMessage;
}
export declare type KernelOption = {
  name: string;
  displayName: string;
};
export interface KernelSpecs {
  defaultName: string;
  kernelSpecs: {
    [name: string]: KernelOption;
  };
}
export declare enum ActionTypes {
  Update = 0,
  Response = 1,
}
/**
 * Messages Data Explorer -> JupyterLabApp
 */
export declare enum MessageTypes {
  FileList = 0,
  CreateInDir = 1,
  DeleteFile = 2,
  UploadFile = 3,
  RenameFile = 4,
  ReadFileContent = 5,
  CreateDirectory = 6,
  InsertBelow = 7,
  RunAndAdvance = 8,
  Copy = 9,
  Cut = 10,
  Paste = 11,
  Undo = 12,
  ClearAllOutputs = 13,
  RunAll = 14,
  Redo = 15,
  Save = 16,
  RestartKernel = 17,
  ChangeCellType = 18,
  SwitchKernel = 19,
  ChangeKernel = 20,
  Status = 21,
  KernelList = 22,
  IsDirty = 23,
  Shutdown = 24,
}
export declare enum NotebookUpdateTypes {
  Ready = 0,
  ClickEvent = 1,
  ActiveCellType = 2,
  KernelChange = 3,
  FileSaved = 4,
  SessionStatusChange = 5,
}
