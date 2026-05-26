import { CosmosDbArtifactType } from "Contracts/FabricMessagesContract";
import { isFabric, isFabricMirroredKey, isFabricNative } from "Platform/Fabric/FabricUtil";
import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../Shared/Telemetry/TelemetryProcessor";
import { ApiType, FabricArtifactInfo, userContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { listCassandraKeyspaces } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { listGremlinDatabases } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { listMongoDBDatabases } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { listSqlDatabases } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { client } from "../CosmosClient";
import { handleError, stringifyError } from "../ErrorHandlingUtils";

export async function readDatabases(): Promise<DataModels.Database[]> {
  let databases: DataModels.Database[];
  const clearMessage = logConsoleProgress(`Querying databases`);
  const startKey = traceStart(Action.ReadDatabases, {
    dataExplorerArea: "ResourceTree",
    apiType: userContext.apiType,
  });

  if (
    isFabricMirroredKey() &&
    (userContext.fabricContext?.artifactInfo as FabricArtifactInfo[CosmosDbArtifactType.MIRRORED_KEY]).resourceTokenInfo
      .resourceTokens
  ) {
    console.log("{{cdbp}} in readDatabases(): isFabricMirroredKey && has resourceTokens"); //CTODO should not get here
    const tokensData = (userContext.fabricContext.artifactInfo as FabricArtifactInfo[CosmosDbArtifactType.MIRRORED_KEY])
      .resourceTokenInfo;

    const databaseIdsSet = new Set<string>(); // databaseId

    for (const collectionResourceId in tokensData.resourceTokens) {
      // Dictionary key looks like this: dbs/SampleDB/colls/Container
      const resourceIdObj = collectionResourceId.split("/");

      if (resourceIdObj.length !== 4) {
        handleError(`Resource key not recognized: ${resourceIdObj}`, "ReadDatabases", `Error while querying databases`);
        clearMessage();
        return [];
      }

      const databaseId = resourceIdObj[1];

      databaseIdsSet.add(databaseId);
    }

    const databases: DataModels.Database[] = Array.from(databaseIdsSet.values())
      .sort((a, b) => a.localeCompare(b))
      .map((databaseId) => ({
        _rid: "",
        _self: "",
        _etag: "",
        _ts: 0,
        id: databaseId,
        collections: [],
      }));
    clearMessage();
    return databases;
  } else if (isFabricNative() && userContext.fabricContext?.databaseName) {
    console.log("{{cdbp}} in readDatabases(): isFabricNative"); //CTODO should not get here
    const databaseId = userContext.fabricContext.databaseName;
    databases = [
      {
        _rid: "",
        _self: "",
        _etag: "",
        _ts: 0,
        id: databaseId,
        collections: [],
      },
    ];
    clearMessage();
    return databases;
  }

  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType !== "Tables" &&
      !isFabric()
    ) {
      console.log("{{cdbp}} in readDatabases(): authType == AAD, enableSDKOperations, apiType != Tables, !isFabric");
      console.log("{{cdbp}} in readDatabases(): databaseaccount: " + userContext.databaseAccount);
      console.log("{{cdbp}} in readDatabases(): calling readDatabasesWithARM");
      databases = await readDatabasesWithARM();
      console.log("{{cdbp}} in readDatabases(): done readDatabasesWithARM");
    } else {
      console.log("{{cdbp}} in readDatabases(): calling SDK");
      const sdkResponse = await client().databases.readAll().fetchAll();
      console.log("{{cdbp}} in readDatabases(): done SDK");
      databases = sdkResponse.resources as DataModels.Database[];
    }
  } catch (error) {
    traceFailure(Action.ReadDatabases, { error: error?.message }, startKey);
    handleError(error, "ReadDatabases", `Error while querying databases`);
    throw error;
  }
  traceSuccess(Action.ReadDatabases, { databaseCount: databases?.length }, startKey);
  clearMessage();
  return databases;
}

export async function readDatabasesWithARM(accountOverride?: {
  subscriptionId: string;
  resourceGroup: string;
  accountName: string;
  apiType?: ApiType;
}): Promise<DataModels.Database[]> {
  let rpResponse;
  const subscriptionId = accountOverride?.subscriptionId ?? userContext.subscriptionId ?? "";
  const resourceGroup = accountOverride?.resourceGroup ?? userContext.resourceGroup ?? "";
  const accountName = accountOverride?.accountName ?? userContext?.databaseAccount?.name ?? "";
  const apiType = accountOverride?.apiType ?? userContext.apiType;

  try {
    switch (apiType) {
      case "SQL":
        console.log("{{cdbp}} in readDatabasesWithARM(): calling listSqlDatabases");
        rpResponse = await listSqlDatabases(subscriptionId, resourceGroup, accountName);
        console.log("{{cdbp}} in readDatabasesWithARM(): done listSqlDatabases");
        break;
      case "Mongo":
        rpResponse = await listMongoDBDatabases(subscriptionId, resourceGroup, accountName);
        break;
      case "Cassandra":
        rpResponse = await listCassandraKeyspaces(subscriptionId, resourceGroup, accountName);
        break;
      case "Gremlin":
        rpResponse = await listGremlinDatabases(subscriptionId, resourceGroup, accountName);
        break;
      default:
        throw new Error(`Unsupported default experience type: ${apiType}`);
    }

    console.log("{{cdbp}} in readDatabasesWithARM(): response: " + JSON.stringify(rpResponse));
    return rpResponse?.value?.map((database) => database.properties?.resource as DataModels.Database) ?? [];
  } catch (error) {
    console.log("{{cdbp}} in readDatabasesWithARM(): ERROR: " + stringifyError(error));
    throw error;
  }
}
