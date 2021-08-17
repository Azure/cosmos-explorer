import * as AfecFeatures from "./AfecFeatures";
import * as AnalyticalStorageTtl from "./AnalyticalStorageTtl";
import * as ApiEndpoints from "./ApiEndpoints";
import * as ApiType from "./ApiType";
import * as Areas from "./Areas";
import * as ArmApiVersions from "./ArmApiVersions";
import * as ArmResourceTypes from "./ArmResourceTypes";
import * as BackendDefaults from "./BackendDefaults";
import * as CapabilityNames from "./CapabilityNames";
import * as CassandraBackend from "./CassandraBackend";
import * as ClientDefaults from "./ClientDefaults";
import * as CodeOfConductEndpoints from "./CodeOfConductEndpoints";
import * as ConfigurationOverridesValues from "./ConfigurationOverridesValues";
import * as CorrelationBackend from "./CorrelationBackend";
import * as DocumentsGridMetrics from "./DocumentsGridMetrics";
import * as EndpointsRegex from "./EndpointsRegex";
import * as Flights from "./Flights";
import * as HashRoutePrefixes from "./HashRoutePrefixes";
import * as HttpHeaders from "./HttpHeaders";
import * as HttpStatusCodes from "./HttpStatusCodes";
import * as KeyCodes from "./KeyCodes";
import * as MongoDBAccounts from "./MongoDBAccounts";
import * as NormalizedEventKey from "./NormalizedEventKey";
import * as Notebook from "./Notebook";
import * as OfferVersions from "./OfferVersions";
import * as Queries from "./Queries";
import * as SavedQueries from "./SavedQueries";
import * as ServerIds from "./ServerIds";
import * as SparkLibrary from "./SparkLibrary";
import * as TagNames from "./TagNames";
import * as TerminalQueryParams from "./TerminalQueryParams";
import * as TryCosmosExperience from "./TryCosmosExperience";
import * as Urls from "./Urls";

const StyleConstants = require("less-vars-loader!../../less/Common/Constants.less");

export {
  StyleConstants,
  SparkLibrary,
  ConfigurationOverridesValues,
  OfferVersions,
  AnalyticalStorageTtl,
  Notebook,
  TryCosmosExperience,
  NormalizedEventKey,
  KeyCodes,
  HashRoutePrefixes,
  Urls,
  HttpStatusCodes,
  ApiType,
  HttpHeaders,
  Areas,
  DocumentsGridMetrics,
  SavedQueries,
  Queries,
  CassandraBackend,
  MongoDBAccounts,
  TagNames,
  AfecFeatures,
  Flights,
  CorrelationBackend,
  CapabilityNames,
  ClientDefaults,
  BackendDefaults,
  ArmResourceTypes,
  ArmApiVersions,
  TerminalQueryParams,
  CodeOfConductEndpoints,
  ApiEndpoints,
  EndpointsRegex,
  ServerIds,
};

export enum ConflictOperationType {
  Replace = "replace",
  Create = "create",
  Delete = "delete",
}

export const EmulatorMasterKey =
  //[SuppressMessage("Microsoft.Security", "CS002:SecretInNextLine", Justification="Well known public masterKey for emulator")]
  "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

// A variable @MyVariable defined in Constants.less is accessible as StyleConstants.MyVariable

export enum AccountKind {
  DocumentDB = "DocumentDB",
  MongoDB = "MongoDB",
  Parse = "Parse",
  GlobalDocumentDB = "GlobalDocumentDB",
  Default = "DocumentDB",
}

export enum MongoBackendEndpointType {
  local,
  remote,
}
