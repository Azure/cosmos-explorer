import { Constants as CosmosSDKConstants } from "@azure/cosmos";
import queryString from "querystring";
import { getAccessTokenAuthorizationHeaders } from "Utils/AuthorizationUtils";
import { allowedMongoProxyEndpoints, validateEndpoint } from "Utils/EndpointValidation";
import { AuthType } from "../AuthType";
import { configContext } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { Collection } from "../Contracts/ViewModels";
import DocumentId from "../Explorer/Tree/DocumentId";
import { hasFlag } from "../Platform/Hosted/extractFeatures";
import { userContext } from "../UserContext";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import { ApiType, HttpHeaders, HttpStatusCodes } from "./Constants";
import { MinimalQueryIterator } from "./IteratorUtilities";
import { sendMessage } from "./MessageHandler";

const defaultHeaders = {
  [HttpHeaders.apiType]: ApiType.MongoDB.toString(),
  [CosmosSDKConstants.HttpHeaders.MaxEntityCount]: "100",
  [CosmosSDKConstants.HttpHeaders.Version]: "2017-11-15",
};

function authHeaders() {
  if (userContext.authType === AuthType.EncryptedToken) {
    return getAccessTokenAuthorizationHeaders(userContext.accessToken);
  } else {
    return { [HttpHeaders.authorization]: userContext.authorizationToken };
  }
}

export function queryIterator(databaseId: string, collection: Collection, query: string): MinimalQueryIterator {
  let continuationToken: string;
  return {
    fetchNext: () => {
      return queryDocuments(databaseId, collection, false, query).then((response) => {
        continuationToken = response.continuationToken;
        const headers: { [key: string]: string | number } = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          resources: response.documents,
          headers,
          requestCharge: Number(headers[CosmosSDKConstants.HttpHeaders.RequestCharge]),
          activityId: String(headers[CosmosSDKConstants.HttpHeaders.ActivityId]),
          hasMoreResults: !!continuationToken,
        };
      });
    },
  };
}

interface QueryResponse {
  continuationToken: string;
  documents: DataModels.DocumentId[];
  headers: Headers;
}

export function queryDocuments(
  databaseId: string,
  collection: Collection,
  isResourceList: boolean,
  query: string,
  continuationToken?: string
): Promise<QueryResponse> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const params = {
    db: databaseId,
    coll: collection.id(),
    resourceUrl: `${resourceEndpoint}dbs/${databaseId}/colls/${collection.id()}/docs/`,
    rid: collection.rid,
    rtype: "docs",
    sid: userContext.subscriptionId,
    rg: userContext.resourceGroup,
    dba: databaseAccount.name,
    pk:
      collection && collection.partitionKey && !collection.partitionKey.systemKey
        ? collection.partitionKeyProperties?.[0]
        : "",
  };

  const endpoint = getFeatureEndpointOrDefault("resourcelist") || "";

  const headers = {
    ...defaultHeaders,
    ...authHeaders(),
    [CosmosSDKConstants.HttpHeaders.IsQuery]: "true",
    [CosmosSDKConstants.HttpHeaders.PopulateQueryMetrics]: "true",
    [CosmosSDKConstants.HttpHeaders.EnableScanInQuery]: "true",
    [CosmosSDKConstants.HttpHeaders.EnableCrossPartitionQuery]: "true",
    [CosmosSDKConstants.HttpHeaders.ParallelizeCrossPartitionQuery]: "true",
    [HttpHeaders.contentType]: "application/query+json",
  };

  if (continuationToken) {
    headers[CosmosSDKConstants.HttpHeaders.Continuation] = continuationToken;
  }

  const path = isResourceList ? "/resourcelist" : "";

  return window
    .fetch(`${endpoint}${path}?${queryString.stringify(params)}`, {
      method: "POST",
      body: JSON.stringify({ query }),
      headers,
    })
    .then(async (response) => {
      if (response.ok) {
        return {
          continuationToken: response.headers.get(CosmosSDKConstants.HttpHeaders.Continuation),
          documents: (await response.json()).Documents as DataModels.DocumentId[],
          headers: response.headers,
        };
      }
      await errorHandling(response, "querying documents", params);
      return undefined;
    });
}

export function readDocument(
  databaseId: string,
  collection: Collection,
  documentId: DocumentId
): Promise<DataModels.DocumentId> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const idComponents = documentId.self.split("/");
  const path = idComponents.slice(0, 4).join("/");
  const rid = encodeURIComponent(idComponents[5]);
  const params = {
    db: databaseId,
    coll: collection.id(),
    resourceUrl: `${resourceEndpoint}${path}/${rid}`,
    rid,
    rtype: "docs",
    sid: userContext.subscriptionId,
    rg: userContext.resourceGroup,
    dba: databaseAccount.name,
    pk:
      documentId && documentId.partitionKey && !documentId.partitionKey.systemKey
        ? documentId.partitionKeyProperties?.[0]
        : "",
  };

  const endpoint = getFeatureEndpointOrDefault("readDocument");

  return window
    .fetch(`${endpoint}?${queryString.stringify(params)}`, {
      method: "GET",
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
        [CosmosSDKConstants.HttpHeaders.PartitionKey]: encodeURIComponent(
          JSON.stringify(documentId.partitionKeyHeader())
        ),
      },
    })
    .then(async (response) => {
      if (response.ok) {
        return response.json();
      }
      return await errorHandling(response, "reading document", params);
    });
}

export function createDocument(
  databaseId: string,
  collection: Collection,
  partitionKeyProperty: string,
  documentContent: unknown
): Promise<DataModels.DocumentId> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const params = {
    db: databaseId,
    coll: collection.id(),
    resourceUrl: `${resourceEndpoint}dbs/${databaseId}/colls/${collection.id()}/docs/`,
    rid: collection.rid,
    rtype: "docs",
    sid: userContext.subscriptionId,
    rg: userContext.resourceGroup,
    dba: databaseAccount.name,
    pk: collection && collection.partitionKey && !collection.partitionKey.systemKey ? partitionKeyProperty : "",
  };

  const endpoint = getFeatureEndpointOrDefault("createDocument");

  return window
    .fetch(`${endpoint}/resourcelist?${queryString.stringify(params)}`, {
      method: "POST",
      body: JSON.stringify(documentContent),
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
      },
    })
    .then(async (response) => {
      if (response.ok) {
        return response.json();
      }
      return await errorHandling(response, "creating document", params);
    });
}

export function updateDocument(
  databaseId: string,
  collection: Collection,
  documentId: DocumentId,
  documentContent: string
): Promise<DataModels.DocumentId> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const idComponents = documentId.self.split("/");
  const path = idComponents.slice(0, 5).join("/");
  const rid = encodeURIComponent(idComponents[5]);
  const params = {
    db: databaseId,
    coll: collection.id(),
    resourceUrl: `${resourceEndpoint}${path}/${rid}`,
    rid,
    rtype: "docs",
    sid: userContext.subscriptionId,
    rg: userContext.resourceGroup,
    dba: databaseAccount.name,
    pk:
      documentId && documentId.partitionKey && !documentId.partitionKey.systemKey
        ? documentId.partitionKeyProperties?.[0]
        : "",
  };
  const endpoint = getFeatureEndpointOrDefault("updateDocument");

  return window
    .fetch(`${endpoint}?${queryString.stringify(params)}`, {
      method: "PUT",
      body: documentContent,
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
        [HttpHeaders.contentType]: "application/json",
        [CosmosSDKConstants.HttpHeaders.PartitionKey]: JSON.stringify(documentId.partitionKeyHeader()),
      },
    })
    .then(async (response) => {
      if (response.ok) {
        return response.json();
      }
      return await errorHandling(response, "updating document", params);
    });
}

export function deleteDocument(databaseId: string, collection: Collection, documentId: DocumentId): Promise<void> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const idComponents = documentId.self.split("/");
  const path = idComponents.slice(0, 5).join("/");
  const rid = encodeURIComponent(idComponents[5]);
  const params = {
    db: databaseId,
    coll: collection.id(),
    resourceUrl: `${resourceEndpoint}${path}/${rid}`,
    rid,
    rtype: "docs",
    sid: userContext.subscriptionId,
    rg: userContext.resourceGroup,
    dba: databaseAccount.name,
    pk:
      documentId && documentId.partitionKey && !documentId.partitionKey.systemKey
        ? documentId.partitionKeyProperties?.[0]
        : "",
  };
  const endpoint = getFeatureEndpointOrDefault("deleteDocument");

  return window
    .fetch(`${endpoint}?${queryString.stringify(params)}`, {
      method: "DELETE",
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
        [HttpHeaders.contentType]: "application/json",
        [CosmosSDKConstants.HttpHeaders.PartitionKey]: JSON.stringify(documentId.partitionKeyHeader()),
      },
    })
    .then(async (response) => {
      if (response.ok) {
        return undefined;
      }
      return await errorHandling(response, "deleting document", params);
    });
}

export function createMongoCollectionWithProxy(
  params: DataModels.CreateCollectionParams
): Promise<DataModels.Collection> {
  const { databaseAccount } = userContext;
  const shardKey: string = params.partitionKey?.paths[0];
  const mongoParams: DataModels.MongoParameters = {
    resourceUrl: databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint,
    db: params.databaseId,
    coll: params.collectionId,
    pk: shardKey,
    offerThroughput: params.autoPilotMaxThroughput || params.offerThroughput,
    cd: params.createNewDatabase,
    st: params.databaseLevelThroughput,
    is: !!shardKey,
    rid: "",
    rtype: "colls",
    sid: userContext.subscriptionId,
    rg: userContext.resourceGroup,
    dba: databaseAccount.name,
    isAutoPilot: !!params.autoPilotMaxThroughput,
  };

  const endpoint = getFeatureEndpointOrDefault("createCollectionWithProxy");

  return window
    .fetch(
      `${endpoint}/createCollection?${queryString.stringify(
        (mongoParams as unknown) as queryString.ParsedUrlQueryInput
      )}`,
      {
        method: "POST",
        headers: {
          ...defaultHeaders,
          ...authHeaders(),
          [HttpHeaders.contentType]: "application/json",
        },
      }
    )
    .then(async (response) => {
      if (response.ok) {
        return response.json();
      }
      return await errorHandling(response, "creating collection", mongoParams);
    });
}

export function getFeatureEndpointOrDefault(feature: string): string {
  const endpoint =
    hasFlag(userContext.features.mongoProxyAPIs, feature) &&
    validateEndpoint(userContext.features.mongoProxyEndpoint, allowedMongoProxyEndpoints)
      ? userContext.features.mongoProxyEndpoint
      : configContext.MONGO_BACKEND_ENDPOINT || configContext.BACKEND_ENDPOINT;

  return getEndpoint(endpoint);
}

export function getEndpoint(endpoint: string): string {
  let url = endpoint + "/api/mongo/explorer";

  if (userContext.authType === AuthType.EncryptedToken) {
    url = url.replace("api/mongo", "api/guest/mongo");
  }
  return url;
}

// TODO: This function throws most of the time except on Forbidden which is a bit strange
// It causes problems for TypeScript understanding the types
async function errorHandling(response: Response, action: string, params: unknown): Promise<void> {
  const errorMessage = await response.text();
  // Log the error where the user can see it
  logConsoleError(`Error ${action}: ${errorMessage}, Payload: ${JSON.stringify(params)}`);
  if (response.status === HttpStatusCodes.Forbidden) {
    sendMessage({ type: MessageTypes.ForbiddenError, reason: errorMessage });
    return;
  }
  throw new Error(errorMessage);
}

export function getARMCreateCollectionEndpoint(params: DataModels.MongoParameters): string {
  return `subscriptions/${params.sid}/resourceGroups/${params.rg}/providers/Microsoft.DocumentDB/databaseAccounts/${userContext.databaseAccount.name}/mongodbDatabases/${params.db}/collections/${params.coll}`;
}
