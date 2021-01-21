export interface NotebookContentItem {
  name: string;
  path: string;
  type: NotebookContentItemType;
  children?: NotebookContentItem[];
  parent?: NotebookContentItem;
  timestamp?: number;
}

export enum NotebookContentItemType {
  Notebook,
  File,
  Directory,
}
