import * as _ from "underscore";
import * as DataExplorerConstants from "../Common/Constants";
import * as DataModels from "../Contracts/DataModels";
import * as SharedConstants from "./Constants";
import * as ViewModels from "../Contracts/ViewModels";
import { AddDbUtilities } from "../Shared/AddDatabaseUtility";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { CosmosClient } from "../Common/CosmosClient";
import { HttpStatusCodes } from "../Common/Constants";
import { MessageHandler } from "../Common/MessageHandler";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { NotificationConsoleUtils } from "../Utils/NotificationConsoleUtils";
import { ResourceProviderClient } from "../ResourceProvider/ResourceProviderClient";
import { SubscriptionType } from "../Contracts/ViewModels";

export class CreateSqlCollectionUtilities {
  public static createSqlCollection(
    armEndpoint: string,
    databaseId: string,
    analyticalStorageTtl: number,
    collectionId: string,
    offerThroughput: number,
    partitionKey: string,
    partitionKeyVersion: number,
    createDatabase: boolean,
    useDatabaseSharedOffer: boolean,
    sid: string,
    rg: string,
    dba: string,
    uniqueKeyPolicy: DataModels.UniqueKeyPolicy,
    additionalOptions: DataModels.RpOptions
  ): Promise<DataModels.CreateCollectionWithRpResponse> {
    const params: DataModels.SqlCollectionParameters = {
      uniqueKeyPolicy,
      db: databaseId,
      coll: collectionId,
      pk: partitionKey,
      offerThroughput,
      cd: createDatabase,
      st: useDatabaseSharedOffer,
      sid,
      rg,
      dba,
      analyticalStorageTtl,
      partitionKeyVersion
    };

    if (params.cd) {
      return AddDbUtilities.createSqlDatabase(armEndpoint, params, additionalOptions).then(() => {
        return CreateSqlCollectionUtilities.createSqlCollectionWithARM(armEndpoint, params, additionalOptions);
      });
    }
    return CreateSqlCollectionUtilities.createSqlCollectionWithARM(armEndpoint, params, additionalOptions);
  }

  public static async createSqlCollectionWithARM(
    armEndpoint: string,
    params: DataModels.SqlCollectionParameters,
    rpOptions: DataModels.RpOptions
  ): Promise<DataModels.CreateCollectionWithRpResponse> {
    const rpPayloadToCreateCollection: DataModels.SqlCollectionCreationRequest = {
      properties: {
        resource: {
          id: params.coll,
          partitionKey: {
            paths: [params.pk],
            kind: "Hash",
            version: params.partitionKeyVersion
          }
        },
        options: {}
      }
    };

    if (params.analyticalStorageTtl) {
      rpPayloadToCreateCollection.properties.resource.analyticalStorageTtl = params.analyticalStorageTtl;
    }

    if (!params.st) {
      if (rpOptions) {
        rpPayloadToCreateCollection.properties.options = rpOptions;
      } else {
        rpPayloadToCreateCollection.properties.options["throughput"] =
          params.offerThroughput && params.offerThroughput.toString();
      }
    }

    if (params.uniqueKeyPolicy) {
      rpPayloadToCreateCollection.properties.resource.uniqueKeyPolicy = params.uniqueKeyPolicy;
    }

    try {
      let response = await new ResourceProviderClient<DataModels.CreateCollectionWithRpResponse>(armEndpoint).putAsync(
        CreateSqlCollectionUtilities.getSqlCollectionUri(params),
        DataExplorerConstants.ArmApiVersions.publicVersion,
        rpPayloadToCreateCollection
      );
      return response;
    } catch (response) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Error creating collection: ${JSON.stringify(response)}`
      );
      if (response.status === HttpStatusCodes.Forbidden) {
        MessageHandler.sendMessage({ type: MessageTypes.ForbiddenError });
      }
      throw new Error(`Error creating collection`);
    }
  }

  public static getSqlCollectionUri(params: DataModels.SqlCollectionParameters): string {
    return `subscriptions/${params.sid}/resourceGroups/${params.rg}/providers/Microsoft.DocumentDB/databaseAccounts/${params.dba}/sqlDatabases/${params.db}/containers/${params.coll}`;
  }
}

export class CreateCollectionUtilities {
  public static createGremlinGraph(
    armEndpoint: string,
    databaseId: string,
    collectionId: string,
    offerThroughput: number,
    partitionKey: string,
    partitionKeyVersion: number,
    createDatabase: boolean,
    useDatabaseSharedOffer: boolean,
    sid: string,
    rg: string,
    dba: string,
    additionalOptions: DataModels.RpOptions
  ): Promise<DataModels.CreateCollectionWithRpResponse> {
    const params: DataModels.GraphParameters = {
      db: databaseId,
      coll: collectionId,
      pk: partitionKey,
      offerThroughput,
      cd: createDatabase,
      st: useDatabaseSharedOffer,
      sid,
      rg,
      dba,
      partitionKeyVersion
    };

    if (params.cd) {
      return AddDbUtilities.createGremlinDatabase(armEndpoint, params, additionalOptions).then(() => {
        return CreateCollectionUtilities.createGremlinGraphWithARM(armEndpoint, params, additionalOptions);
      });
    }
    return CreateCollectionUtilities.createGremlinGraphWithARM(armEndpoint, params, additionalOptions);
  }

  public static async createGremlinGraphWithARM(
    armEndpoint: string,
    params: DataModels.GraphParameters,
    rpOptions: DataModels.RpOptions
  ): Promise<DataModels.CreateCollectionWithRpResponse> {
    const rpPayloadToCreateCollection: DataModels.GraphCreationRequest = {
      properties: {
        resource: {
          id: params.coll,
          partitionKey: {
            paths: [params.pk],
            kind: "Hash",
            version: params.partitionKeyVersion
          }
        },
        options: {}
      }
    };

    if (!params.st) {
      if (rpOptions) {
        rpPayloadToCreateCollection.properties.options = rpOptions;
      } else {
        rpPayloadToCreateCollection.properties.options["throughput"] =
          params.offerThroughput && params.offerThroughput.toString();
      }
    }

    try {
      let response = await new ResourceProviderClient<DataModels.CreateCollectionWithRpResponse>(armEndpoint).putAsync(
        CreateCollectionUtilities.getGremlinGraphUri(params),
        DataExplorerConstants.ArmApiVersions.publicVersion,
        rpPayloadToCreateCollection
      );
      return response;
    } catch (response) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Error creating graph: ${JSON.stringify(response)}`
      );
      if (response.status === HttpStatusCodes.Forbidden) {
        MessageHandler.sendMessage({ type: MessageTypes.ForbiddenError });
      }
      throw new Error(`Error creating graph`);
    }
  }

  public static getGremlinGraphUri(params: DataModels.GraphParameters): string {
    return `subscriptions/${params.sid}/resourceGroups/${params.rg}/providers/Microsoft.DocumentDB/databaseAccounts/${params.dba}/gremlinDatabases/${params.db}/graphs/${params.coll}`;
  }
}
export class Utilities {
  public static async createAzureTableWithARM(
    armEndpoint: string,
    params: DataModels.CreateDatabaseAndCollectionRequest,
    rpOptions: DataModels.RpOptions
  ): Promise<any> {
    const rpPayloadToCreateDatabase: DataModels.CreationRequest = {
      properties: {
        resource: {
          id: params.collectionId
        },
        options: {}
      }
    };

    if (!params.databaseLevelThroughput) {
      if (rpOptions) {
        rpPayloadToCreateDatabase.properties.options = rpOptions;
      } else {
        rpPayloadToCreateDatabase.properties.options["throughput"] =
          params.offerThroughput && params.offerThroughput.toString();
      }
    }

    try {
      await new ResourceProviderClient(armEndpoint).putAsync(
        Utilities._getAzureTableUri(params),
        DataExplorerConstants.ArmApiVersions.publicVersion,
        rpPayloadToCreateDatabase
      );
    } catch (reason) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Error creating table: ${JSON.stringify(reason)}, Payload: ${params}`
      );
      if (reason.status === HttpStatusCodes.Forbidden) {
        MessageHandler.sendMessage({ type: MessageTypes.ForbiddenError });
        return;
      }
      throw new Error(`Error creating table`);
    }
  }

  public static getDefaultStorage(flight: string, subscriptionType: SubscriptionType): string {
    const flightDefaults: string = Utilities._getDefaults(flight, subscriptionType).storage;
    return flightDefaults;
  }

  public static getDefaultThroughput(flight: string, subscriptionType: SubscriptionType): ThroughputDefaults {
    const flightDefaults: ThroughputDefaults = Utilities._getDefaults(flight, subscriptionType).throughput;
    return flightDefaults;
  }

  public static getMaxRUForStorageOption(
    subscriptionType = SharedConstants.CollectionCreation.DefaultSubscriptionType,
    flight = SharedConstants.CollectionCreation.DefaultAddCollectionDefaultFlight,
    storageOption: string
  ): number {
    if (storageOption === SharedConstants.CollectionCreation.storage10Gb) {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs10K;
    }

    const defaults = Utilities._getDefaults(flight, subscriptionType);
    return defaults.throughput.unlimitedmax;
  }

  public static getMinRUForStorageOption(
    subscriptionType = SharedConstants.CollectionCreation.DefaultSubscriptionType,
    flight = SharedConstants.CollectionCreation.DefaultAddCollectionDefaultFlight,
    storageOption: string
  ): number {
    if (storageOption === SharedConstants.CollectionCreation.storage10Gb) {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
    }

    const collectionDefaults = Utilities._getCollectionDefaults(subscriptionType, flight);

    return collectionDefaults.throughput.unlimitedmin;
  }

  public static _getDefaults(flight: string, subscriptionType: SubscriptionType): CollectionDefaults {
    return Utilities._getCollectionDefaults(subscriptionType, flight);
  }

  private static _getCollectionDefaults(
    subscriptionType = SharedConstants.CollectionCreation.DefaultSubscriptionType,
    flight = SharedConstants.CollectionCreation.DefaultAddCollectionDefaultFlight
  ): CollectionDefaults {
    if (!(flight in Utilities._defaultsMap)) {
      flight = SharedConstants.CollectionCreation.DefaultAddCollectionDefaultFlight;
    }

    return Utilities._defaultsMap[flight][SubscriptionType[subscriptionType]];
  }

  private static _exceedsThreshold(container: ViewModels.Explorer): boolean {
    const unlimitedThreshold: number = 5;

    const databases = (container && container.databases && container.databases()) || [];
    return _.any(
      databases,
      database =>
        database && database.collections && database.collections() && database.collections().length > unlimitedThreshold
    );
  }

  private static _defaultsMap: { [flight: string]: { [subscriptionType: string]: CollectionDefaults } } = {
    "0": {
      Benefits: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Free: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      EA: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Internal: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      PAYG: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      }
    },
    "1": {
      Benefits: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Free: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      EA: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Internal: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      PAYG: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      }
    },
    "2": {
      Benefits: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Free: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      EA: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Internal: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      PAYG: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      }
    },
    "3": {
      Benefits: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Free: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      EA: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Internal: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      PAYG: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      }
    },
    "20190618.1": {
      Benefits: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Free: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      EA: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: container =>
            Utilities._exceedsThreshold(container)
              ? SharedConstants.CollectionCreation.DefaultCollectionRUs1000
              : SharedConstants.CollectionCreation.DefaultCollectionRUs10K,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs20000
        }
      },
      Internal: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      PAYG: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      }
    },
    "20190618.2": {
      Benefits: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      Free: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      EA: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs1000,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs5000
        }
      },
      Internal: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs100K,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      },
      PAYG: {
        storage: SharedConstants.CollectionCreation.storage100Gb,
        throughput: {
          fixed: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimited: () => SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          unlimitedmax: SharedConstants.CollectionCreation.DefaultCollectionRUs1Million,
          unlimitedmin: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
          shared: SharedConstants.CollectionCreation.DefaultCollectionRUs400
        }
      }
    }
  };

  private static _getAzureTableUri(params: DataModels.CreateDatabaseAndCollectionRequest): string {
    return `subscriptions/${CosmosClient.subscriptionId()}/resourceGroups/${CosmosClient.resourceGroup()}/providers/Microsoft.DocumentDB/databaseAccounts/${
      CosmosClient.databaseAccount().name
    }/tables/${params.collectionId}`;
  }
}

export interface CollectionDefaults {
  storage: string;
  throughput: ThroughputDefaults;
}

export interface ThroughputDefaults {
  fixed: number;
  unlimited: (explorer: ViewModels.Explorer) => number;
  unlimitedmax: number;
  unlimitedmin: number;
  shared: number;
}
