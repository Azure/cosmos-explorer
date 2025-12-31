import { Constants as CosmosSDKConstants } from "@azure/cosmos";
import { getMongoGuidRepresentation } from "Shared/StorageUtility";
import { AuthType } from "../AuthType";
import { configContext } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { Collection } from "../Contracts/ViewModels";
import DocumentId from "../Explorer/Tree/DocumentId";
import { userContext } from "../UserContext";
import { isDataplaneRbacEnabledForProxyApi } from "../Utils/AuthorizationUtils";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import { ApiType, ContentType, HttpHeaders, HttpStatusCodes } from "./Constants";
import { MinimalQueryIterator } from "./IteratorUtilities";
import { sendMessage } from "./MessageHandler";

const defaultHeaders = {
  [HttpHeaders.apiType]: ApiType.MongoDB.toString(),
  [CosmosSDKConstants.HttpHeaders.MaxEntityCount]: "100",
  [CosmosSDKConstants.HttpHeaders.Version]: "2017-11-15",
  [HttpHeaders.sessionId]: userContext.sessionId,
};

function authHeaders() {
  if (userContext.authType === AuthType.EncryptedToken) {
    return { [HttpHeaders.guestAccessToken]: userContext.accessToken };
  } else {
    const headers: { [key: string]: string } = {
      [HttpHeaders.authorization]: userContext.authorizationToken,
    };
    if (isDataplaneRbacEnabledForProxyApi(userContext)) {
      headers[HttpHeaders.entraIdToken] = userContext.aadToken;
    }
    return headers;
  }
}

export function queryIterator(databaseId: string, collection: Collection, query: string): MinimalQueryIterator {
  let continuationToken: string;
  return {
    fetchNext: () => {
      return queryDocuments(databaseId, collection, false, query, continuationToken).then((response) => {
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
  continuationToken?: string,
): Promise<QueryResponse> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const params = {
    databaseID: databaseId,
    collectionID: collection.id(),
    resourceUrl: `${resourceEndpoint}dbs/${databaseId}/colls/${collection.id()}/docs/`,
    resourceID: collection.rid,
    resourceType: "docs",
    subscriptionID: userContext.subscriptionId,
    resourceGroup: userContext.resourceGroup,
    databaseAccountName: databaseAccount.name,
    partitionKey:
      collection && collection.partitionKey && !collection.partitionKey.systemKey
        ? collection.partitionKeyProperties?.[0]
        : "",
    query,
  };

  const endpoint = getEndpoint(configContext.MONGO_PROXY_ENDPOINT) || "";

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

  const path = isResourceList ? "/resourcelist" : "/queryDocuments";

  return window
    .fetch(`${endpoint}${path}`, {
      method: "POST",
      body: JSON.stringify(params),
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
  documentId: DocumentId,
): Promise<DataModels.DocumentId> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const idComponents = documentId.self.split("/");
  const path = idComponents.slice(0, 4).join("/");
  const rid = encodeURIComponent(idComponents[5]);
  const params = {
    databaseID: databaseId,
    collectionID: collection.id(),
    resourceUrl: `${resourceEndpoint}${path}/${rid}`,
    resourceID: rid,
    resourceType: "docs",
    subscriptionID: userContext.subscriptionId,
    resourceGroup: userContext.resourceGroup,
    databaseAccountName: databaseAccount.name,
    partitionKey:
      documentId && documentId.partitionKey && !documentId.partitionKey.systemKey
        ? documentId.partitionKeyProperties?.[0]
        : "",
    clientSettings: {
      guidRepresentation: getMongoGuidRepresentation(),
    },
  };

  const endpoint = getEndpoint(configContext.MONGO_PROXY_ENDPOINT);

  return window
    .fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
        [HttpHeaders.contentType]: ContentType.applicationJson,
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
  documentContent: unknown,
): Promise<DataModels.DocumentId> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const params = {
    databaseID: databaseId,
    collectionID: collection.id(),
    resourceUrl: `${resourceEndpoint}dbs/${databaseId}/colls/${collection.id()}/docs/`,
    resourceID: collection.rid,
    resourceType: "docs",
    subscriptionID: userContext.subscriptionId,
    resourceGroup: userContext.resourceGroup,
    databaseAccountName: databaseAccount.name,
    partitionKey:
      collection && collection.partitionKey && !collection.partitionKey.systemKey ? partitionKeyProperty : "",
    documentContent: JSON.stringify(documentContent),
    clientSettings: {
      guidRepresentation: getMongoGuidRepresentation(),
    },
  };

  const endpoint = getEndpoint(configContext.MONGO_PROXY_ENDPOINT);

  return window
    .fetch(`${endpoint}/createDocument`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
        [HttpHeaders.contentType]: ContentType.applicationJson,
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
  documentContent: string,
): Promise<DataModels.DocumentId> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;
  const idComponents = documentId.self.split("/");
  const path = idComponents.slice(0, 5).join("/");
  const rid = encodeURIComponent(idComponents[5]);
  const params = {
    databaseID: databaseId,
    collectionID: collection.id(),
    resourceUrl: `${resourceEndpoint}${path}/${rid}`,
    resourceID: rid,
    resourceType: "docs",
    subscriptionID: userContext.subscriptionId,
    resourceGroup: userContext.resourceGroup,
    databaseAccountName: databaseAccount.name,
    partitionKey:
      documentId && documentId.partitionKey && !documentId.partitionKey.systemKey
        ? documentId.partitionKeyProperties?.[0]
        : "",
    documentContent,
    clientSettings: {
      guidRepresentation: getMongoGuidRepresentation(),
    },
  };
  const endpoint = getEndpoint(configContext.MONGO_PROXY_ENDPOINT);

  return window
    .fetch(endpoint, {
      method: "PUT",
      body: JSON.stringify(params),
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
        [HttpHeaders.contentType]: ContentType.applicationJson,
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

export function deleteDocuments(
  databaseId: string,
  collection: Collection,
  documentIds: DocumentId[],
): Promise<{
  deletedCount: number;
  isAcknowledged: boolean;
}> {
  const { databaseAccount } = userContext;
  const resourceEndpoint = databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint;

  const rids: string[] = documentIds.map((documentId) => {
    const idComponents = documentId.self.split("/");
    return idComponents[5];
  });

  const params = {
    databaseID: databaseId,
    collectionID: collection.id(),
    resourceUrl: `${resourceEndpoint}`,
    resourceIDs: rids,
    subscriptionID: userContext.subscriptionId,
    resourceGroup: userContext.resourceGroup,
    databaseAccountName: databaseAccount.name,
    clientSettings: {
      guidRepresentation: getMongoGuidRepresentation(),
    },
  };
  const endpoint = getEndpoint(configContext.MONGO_PROXY_ENDPOINT);

  return window
    .fetch(`${endpoint}/bulkdelete`, {
      method: "DELETE",
      body: JSON.stringify(params),
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
        [HttpHeaders.contentType]: ContentType.applicationJson,
      },
    })
    .then(async (response) => {
      if (response.ok) {
        const result = await response.json();
        return result;
      }
      return await errorHandling(response, "deleting documents", params);
    });
}

export function createMongoCollectionWithProxy(
  params: DataModels.CreateCollectionParams,
): Promise<DataModels.Collection> {
  const { databaseAccount } = userContext;
  const shardKey: string = params.partitionKey?.paths[0];

  const createCollectionParams = {
    databaseID: params.databaseId,
    collectionID: params.collectionId,
    resourceUrl: databaseAccount.properties.mongoEndpoint || databaseAccount.properties.documentEndpoint,
    resourceID: "",
    resourceType: "colls",
    subscriptionID: userContext.subscriptionId,
    resourceGroup: userContext.resourceGroup,
    databaseAccountName: databaseAccount.name,
    partitionKey: shardKey,
    isAutoscale: !!params.autoPilotMaxThroughput,
    hasSharedThroughput: params.databaseLevelThroughput,
    offerThroughput: params.autoPilotMaxThroughput || params.offerThroughput,
    createDatabase: params.createNewDatabase,
    isSharded: !!shardKey,
  };

  const endpoint = getEndpoint(configContext.MONGO_PROXY_ENDPOINT);

  return window
    .fetch(`${endpoint}/createCollection`, {
      method: "POST",
      body: JSON.stringify(createCollectionParams),
      headers: {
        ...defaultHeaders,
        ...authHeaders(),
        [HttpHeaders.contentType]: ContentType.applicationJson,
      },
    })
    .then(async (response) => {
      if (response.ok) {
        return response.json();
      }
      return await errorHandling(response, "creating collection", createCollectionParams);
    });
}

export function getEndpoint(endpoint: string): string {
  let url = endpoint + "/api/mongo/explorer";

  if (userContext.authType === AuthType.EncryptedToken) {
    if (endpoint === configContext.MONGO_PROXY_ENDPOINT) {
      url = url.replace("api/mongo", "api/connectionstring/mongo");
    } else {
      url = url.replace("api/mongo", "api/guest/mongo");
    }
  }
  return url;
}

export class ThrottlingError extends Error {
  constructor(message: string) {
    super(message);
  }
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
  } else if (
    response.status === HttpStatusCodes.BadRequest &&
    errorMessage.includes("Error=16500") &&
    errorMessage.includes("RetryAfterMs=")
  ) {
    // If throttling is happening, Cosmos DB will return a 400 with a body of:
    // A write operation resulted in an error. Error=16500, RetryAfterMs=4, Details='Batch write error.
    throw new ThrottlingError(errorMessage);
  }
  throw new Error(errorMessage);
}

export function getARMCreateCollectionEndpoint(params: DataModels.MongoParameters): string {
  return `subscriptions/${params.sid}/resourceGroups/${params.rg}/providers/Microsoft.DocumentDB/databaseAccounts/${userContext.databaseAccount.name}/mongodbDatabases/${params.db}/collections/${params.coll}`;
}
