/**
 * Data Explorer tab kinds
 */
export enum TabKind {
  SQLDocuments,
  MongoDocuments,
  SchemaAnalyzer,
  TableEntities,
  Graph,
  SQLQuery,
  ScaleSettings,
  MongoQuery,
}

/**
 * Data Explorer pane kinds
 */
export enum PaneKind {
  AddCollection,
  CassandraAddCollection,
  DeleteCollection,
  DeleteDatabase,
  GlobalSettings,
  AdHocAccess,
  SwitchDirectory,
}

/**
 * Parameters to pass to DataExplorer in order to have it perform a given action
 */
export interface DataExplorerAction {
  actionType: ActionType | string;
}

/**
 * Open tab action
 */
export interface OpenTab extends DataExplorerAction {
  tabKind: TabKind | string;
}

/**
 * Open collection tab action
 */
export interface OpenCollectionTab extends OpenTab {
  databaseResourceId: string;
  collectionResourceId: string;
}

/**
 * Open query tab action
 */
export interface OpenQueryTab extends OpenCollectionTab {
  query: QueryInfo;
  splitterDirection?: "vertical" | "horizontal";
  queryViewSizePercent?: number;
}

/**
 * Query info will be looked at in the order given in this interface (i.e. if text is provided, everything else is ignored)
 */
export interface QueryInfo {
  text?: string;
  partitionKeys?: string[];
}

/**
 * Open pane action
 */
export interface OpenPane extends DataExplorerAction {
  paneKind: PaneKind | string;
}

export interface OpenSampleNotebook extends DataExplorerAction {
  path: string;
}

/**
 * The types of actions that the DataExplorer supports performing upon opening.
 */
export enum ActionType {
  OpenTab,
  OpenCollectionTab,
  OpenPane,
  TransmitCachedData,
  OpenSampleNotebook,
}
