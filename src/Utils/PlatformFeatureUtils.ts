import { Platform, configContext } from "../ConfigContext";

/**
 * Feature flags enumeration - centralized feature definitions
 */
export enum PlatformFeature {
  // UI/Core Features
  Queries = "Queries",
  Notebooks = "Notebooks",
  SynapseLink = "SynapseLink",
  VSCodeIntegration = "VSCodeIntegration",
  GlobalSecondaryIndex = "GlobalSecondaryIndex",
  DataPlaneRbac = "DataPlaneRbac",
  EntraIDLogin = "EntraIDLogin",
  EntreIDRbac = "EntreIDRbac",
  RetrySettings = "RetrySettings",
  GraphAutoVizOption = "GraphAutoVizOption",
  CrossPartitionOption = "CrossPartitionOption",
  EnhancedQueryControl = "EnhancedQueryControl",
  ParallelismOption = "ParallelismOption",
  EnableEntraIdRbac = "EnableEntraIdRbac",
  PriorityBasedExecution = "PriorityBasedExecution",
  RegionSelection = "RegionSelection",
  Copilot = "Copilot",
  CloudShell = "CloudShell",
  ContainerPagination = "ContainerPagination",
  FullTextSearch = "FullTextSearch",
  VectorSearch = "VectorSearch",
  ThroughputBucketing = "ThroughputBucketing",
  ComputedProperties = "ComputedProperties",
  AnalyticalStore = "AnalyticalStore",
  UniqueKeys = "UniqueKeys",
  ContainerThroughput = "ContainerThroughput",
  AdvancedContainerSettings = "AdvancedContainerSettings",

  // CRUD Operations - Database
  CreateDatabase = "CreateDatabase",
  ReadDatabase = "ReadDatabase",
  DeleteDatabase = "DeleteDatabase",

  // CRUD Operations - Collection
  CreateCollection = "CreateCollection",
  ReadCollection = "ReadCollection",
  UpdateCollection = "UpdateCollection",
  DeleteCollection = "DeleteCollection",

  // CRUD Operations - Document
  CreateDocument = "CreateDocument",
  ReadDocument = "ReadDocument",
  UpdateDocument = "UpdateDocument",
  DeleteDocument = "DeleteDocument",

  // Advanced Database Features
  StoredProcedures = "StoredProcedures",
  UDF = "UDF",
  Trigger = "Trigger",
}

/**
 * Feature matrix per platform.
 * - Only list platforms that have restrictions. If a platform is not present, all features are considered supported.
 * - Start with VNextEmulator today; add more platforms/flags here later without touching calling code.
 */
const FEATURE_MATRIX: ReadonlyMap<Platform, ReadonlySet<PlatformFeature>> = new Map([
  [
    Platform.VNextEmulator,
    new Set<PlatformFeature>([
      PlatformFeature.Queries,
      PlatformFeature.UniqueKeys,

      PlatformFeature.CreateDatabase,
      PlatformFeature.ReadDatabase,
      PlatformFeature.DeleteDatabase,

      PlatformFeature.CreateCollection,
      PlatformFeature.ReadCollection,
      PlatformFeature.UpdateCollection,
      PlatformFeature.DeleteCollection,

      PlatformFeature.CreateDocument,
      PlatformFeature.ReadDocument,
      PlatformFeature.UpdateDocument,
      PlatformFeature.DeleteDocument,
    ]),
  ],
]);

/**
 * Central feature flag function - checks if a feature is enabled for current platform
 * @param feature The feature to check
 * @param platform Optional platform override, defaults to current platform
 * @returns True if the feature is enabled for the platform, false otherwise
 */
export const isFeatureSupported = (feature: PlatformFeature, platform?: Platform): boolean => {
  const currentPlatform = platform ?? configContext.platform;
  if (currentPlatform !== Platform.VNextEmulator) {
    return true;
  }
  // VNextEmulator: check from the feature matrix
  const vnextFeatures = FEATURE_MATRIX.get(Platform.VNextEmulator);
  return vnextFeatures?.has(feature) ?? false;
};

export const areAdvancedScriptsSupported = (platform?: Platform): boolean => {
  const currentPlatform = platform ?? configContext.platform;
  if (currentPlatform !== Platform.VNextEmulator) {
    return true;
  }

  // Otherwise, require all script features to be enabled
  return (
    isFeatureSupported(PlatformFeature.StoredProcedures, currentPlatform) &&
    isFeatureSupported(PlatformFeature.UDF, currentPlatform) &&
    isFeatureSupported(PlatformFeature.Trigger, currentPlatform)
  );
};
