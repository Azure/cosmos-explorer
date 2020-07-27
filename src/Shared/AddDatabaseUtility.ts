import * as DataExplorerConstants from "../Common/Constants";
import * as DataModels from "../Contracts/DataModels";
import { config } from "../Config";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { CosmosClient } from "../Common/CosmosClient";
import { HttpStatusCodes } from "../Common/Constants";
import { sendMessage } from "../Common/MessageHandler";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { NotificationConsoleUtils } from "../Utils/NotificationConsoleUtils";
import { ResourceProviderClient } from "../ResourceProvider/ResourceProviderClient";

export class AddDbUtilities {
  // todo - remove any
  public static async createMongoDatabaseWithARM(
    armEndpoint: string,
    params: DataModels.RpParameters,
    rpOptions: DataModels.RpOptions
  ): Promise<any> {
    const rpPayloadToCreateDatabase: DataModels.MongoCreationRequest = {
      properties: {
        resource: {
          id: params.db
        },
        options: {}
      }
    };

    if (params.st) {
      if (rpOptions) {
        rpPayloadToCreateDatabase.properties.options = rpOptions;
      } else {
        rpPayloadToCreateDatabase.properties.options["throughput"] =
          params.offerThroughput && params.offerThroughput.toString();
      }
    }

    try {
      await AddDbUtilities.getRpClient<DataModels.CreateDatabaseWithRpResponse>(armEndpoint).putAsync(
        AddDbUtilities._getMongoDatabaseUri(params),
        DataExplorerConstants.ArmApiVersions.publicVersion,
        rpPayloadToCreateDatabase
      );
    } catch (reason) {
      AddDbUtilities._handleCreationError(reason, params);
    }
  }

  // todo - remove any
  public static async createCassandraKeyspace(
    armEndpoint: string,
    params: DataModels.RpParameters,
    rpOptions: DataModels.RpOptions
  ): Promise<any> {
    const rpPayloadToCreateKeyspace: DataModels.CreationRequest = {
      properties: {
        resource: {
          id: params.db
        },
        options: {}
      }
    };

    if (params.st) {
      if (rpOptions) {
        rpPayloadToCreateKeyspace.properties.options = rpOptions;
      } else {
        rpPayloadToCreateKeyspace.properties.options["throughput"] =
          params.offerThroughput && params.offerThroughput.toString();
      }
    }

    try {
      await AddDbUtilities.getRpClient<DataModels.CreateDatabaseWithRpResponse>(armEndpoint).putAsync(
        AddDbUtilities._getCassandraKeyspaceUri(params),
        DataExplorerConstants.ArmApiVersions.publicVersion,
        rpPayloadToCreateKeyspace
      );
    } catch (reason) {
      AddDbUtilities._handleCreationError(reason, params, "keyspace");
    }
  }

  public static async createSqlDatabase(
    armEndpoint: string,
    params: DataModels.RpParameters,
    rpOptions: DataModels.RpOptions
  ): Promise<any> {
    const rpPayloadToCreateSqlDatabase: DataModels.CreationRequest = {
      properties: {
        resource: {
          id: params.db
        },
        options: {}
      }
    };

    if (params.st) {
      if (rpOptions) {
        rpPayloadToCreateSqlDatabase.properties.options = rpOptions;
      } else {
        rpPayloadToCreateSqlDatabase.properties.options["throughput"] =
          params.offerThroughput && params.offerThroughput.toString();
      }
    }

    try {
      await AddDbUtilities.getRpClient<DataModels.CreateDatabaseWithRpResponse>(armEndpoint).putAsync(
        AddDbUtilities.getSqlDatabaseUri(params),
        DataExplorerConstants.ArmApiVersions.publicVersion,
        rpPayloadToCreateSqlDatabase
      );
    } catch (reason) {
      AddDbUtilities._handleCreationError(reason, params, "database");
    }
  }

  public static getRpClient<T>(armEndpoint?: string): ResourceProviderClient<T> {
    return new ResourceProviderClient<T>(armEndpoint || config.ARM_ENDPOINT);
  }

  public static async createGremlinDatabase(
    armEndpoint: string,
    params: DataModels.RpParameters,
    autoPilotSettings: DataModels.RpOptions
  ): Promise<DataModels.CreateDatabaseWithRpResponse> {
    const rpPayloadToCreateDatabase: DataModels.CreationRequest = {
      properties: {
        resource: {
          id: params.db
        },
        options: {}
      }
    };

    const uri = AddDbUtilities.getGremlinDatabaseUri(params);

    if (params.st) {
      if (autoPilotSettings) {
        rpPayloadToCreateDatabase.properties.options = autoPilotSettings;
      } else {
        rpPayloadToCreateDatabase.properties.options["throughput"] =
          params.offerThroughput && params.offerThroughput.toString();
      }
    }

    return new Promise<DataModels.CreateDatabaseWithRpResponse>((resolve, reject) => {
      AddDbUtilities.getRpClient<DataModels.CreateDatabaseWithRpResponse>(armEndpoint)
        .putAsync(uri, DataExplorerConstants.ArmApiVersions.publicVersion, rpPayloadToCreateDatabase)
        .then(
          () => {
            resolve();
          },
          reason => {
            AddDbUtilities._handleCreationError(reason, params);
            reject();
          }
        );
    });
  }

  private static _handleCreationError(reason: any, params: DataModels.RpParameters, dbType: string = "database") {
    NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.Error,
      `Error creating ${dbType}: ${JSON.stringify(reason)}, Payload: ${params}`
    );
    if (reason.status === HttpStatusCodes.Forbidden) {
      sendMessage({ type: MessageTypes.ForbiddenError });
      return;
    }
    throw new Error(`Error creating ${dbType}`);
  }

  private static _getMongoDatabaseUri(params: DataModels.RpParameters): string {
    return `subscriptions/${params.sid}/resourceGroups/${params.rg}/providers/Microsoft.DocumentDB/databaseAccounts/${
      CosmosClient.databaseAccount().name
    }/mongodbDatabases/${params.db}`;
  }

  private static _getCassandraKeyspaceUri(params: DataModels.RpParameters): string {
    return `subscriptions/${params.sid}/resourceGroups/${params.rg}/providers/Microsoft.DocumentDB/databaseAccounts/${
      CosmosClient.databaseAccount().name
    }/cassandraKeyspaces/${params.db}`;
  }

  public static getGremlinDatabaseUri(params: DataModels.RpParameters): string {
    return `subscriptions/${params.sid}/resourceGroups/${params.rg}/providers/Microsoft.DocumentDB/databaseAccounts/${params.dba}/gremlinDatabases/${params.db}`;
  }

  public static getSqlDatabaseUri(params: DataModels.RpParameters): string {
    return `subscriptions/${params.sid}/resourceGroups/${params.rg}/providers/Microsoft.DocumentDB/databaseAccounts/${params.dba}/sqlDatabases/${params.db}`;
  }
}
