/* 
  AUTOGENERATED FILE
  Do not manually edit
  Run "npm run generateARMClients" to regenerate

  Generated from: https://raw.githubusercontent.com/Azure/azure-rest-api-specs/master/specification/synapse/resource-manager/Microsoft.Synapse/stable/2021-03-01/bigDataPool.json
*/

/* Collection of Big Data pool information */
export interface BigDataPoolResourceInfoListResult {
  /* Link to the next page of results */
  nextLink?: string;
  /* List of Big Data pools */
  value?: BigDataPoolResourceInfo[];
}

/* Properties patch for a Big Data pool */
export interface BigDataPoolPatchInfo {
  /* Updated tags for the Big Data pool */
  tags?: unknown;
}

/* A Big Data pool */
export type BigDataPoolResourceInfo = unknown & {
  /* Big Data pool properties */
  properties?: BigDataPoolResourceProperties;
};

/* Properties of a Big Data pool powered by Apache Spark */
export interface BigDataPoolResourceProperties {
  /* The state of the Big Data pool. */
  provisioningState?: string;
  /* Auto-scaling properties */
  autoScale?: AutoScaleProperties;

  /* The time when the Big Data pool was created. */
  creationDate?: string;
  /* Auto-pausing properties */
  autoPause?: AutoPauseProperties;

  /* Whether compute isolation is required or not. */
  isComputeIsolationEnabled?: boolean;
  /* Whether session level packages enabled. */
  sessionLevelPackagesEnabled?: boolean;
  /* The cache size */
  cacheSize?: number;
  /* Dynamic Executor Allocation */
  dynamicExecutorAllocation?: DynamicExecutorAllocation;

  /* The Spark events folder */
  sparkEventsFolder?: string;
  /* The number of nodes in the Big Data pool. */
  nodeCount?: number;
  /* Library version requirements */
  libraryRequirements?: LibraryRequirements;

  /* List of custom libraries/packages associated with the spark pool. */
  customLibraries?: LibraryInfo[];

  /* Spark configuration file to specify additional properties */
  sparkConfigProperties?: LibraryRequirements;

  /* The Apache Spark version. */
  sparkVersion?: string;
  /* The default folder where Spark logs will be written. */
  defaultSparkLogFolder?: string;
  /* The level of compute power that each node in the Big Data pool has. */
  nodeSize?: "None" | "Small" | "Medium" | "Large" | "XLarge" | "XXLarge" | "XXXLarge";

  /* The kind of nodes that the Big Data pool provides. */
  nodeSizeFamily?: "None" | "MemoryOptimized";

  /* The time when the Big Data pool was updated successfully. */
  readonly lastSucceededTimestamp?: string;
}

/* Auto-scaling properties of a Big Data pool powered by Apache Spark */
export interface AutoScaleProperties {
  /* The minimum number of nodes the Big Data pool can support. */
  minNodeCount?: number;
  /* Whether automatic scaling is enabled for the Big Data pool. */
  enabled?: boolean;
  /* The maximum number of nodes the Big Data pool can support. */
  maxNodeCount?: number;
}

/* Auto-pausing properties of a Big Data pool powered by Apache Spark */
export interface AutoPauseProperties {
  /* Number of minutes of idle time before the Big Data pool is automatically paused. */
  delayInMinutes?: number;
  /* Whether auto-pausing is enabled for the Big Data pool. */
  enabled?: boolean;
}

/* Dynamic Executor Allocation Properties */
export interface DynamicExecutorAllocation {
  /* Indicates whether Dynamic Executor Allocation is enabled or not. */
  enabled?: boolean;
}

/* Library/package information of a Big Data pool powered by Apache Spark */
export interface LibraryInfo {
  /* Name of the library. */
  name?: string;
  /* Storage blob path of library. */
  path?: string;
  /* Storage blob container name. */
  containerName?: string;
  /* The last update time of the library. */
  readonly uploadedTimestamp?: string;
  /* Type of the library. */
  type?: string;
  /* Provisioning status of the library/package. */
  readonly provisioningStatus?: string;
  /* Creator Id of the library/package. */
  readonly creatorId?: string;
}

/* Library requirements for a Big Data pool powered by Apache Spark */
export interface LibraryRequirements {
  /* The last update time of the library requirements file. */
  readonly time?: string;
  /* The library requirements. */
  content?: string;
  /* The filename of the library requirements file. */
  filename?: string;
}
