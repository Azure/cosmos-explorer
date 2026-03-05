import { useDataplaneRbacAuthorization } from "Utils/AuthorizationUtils";
import { createCollection } from "../../Common/dataAccess/createCollection";
import { createDocument } from "../../Common/dataAccess/createDocument";
import { createDocument as createMongoDocument } from "../../Common/MongoProxyClient";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import GraphTab from ".././Tabs/GraphTab";
import Explorer from "../Explorer";
import { GremlinClient } from "../Graph/GraphExplorerComponent/GremlinClient";
import { useDatabases } from "../useDatabases";

interface SampleDataFile extends DataModels.CreateCollectionParams {
  data: any[];
}

export class ContainerSampleGenerator {
  private sampleDataFile: SampleDataFile;

  private constructor(private container: Explorer) {}

  /**
   * Factory function to load the json data file
   */
  public static async createSampleGeneratorAsync(
    container: Explorer,
    isCopilot?: boolean,
  ): Promise<ContainerSampleGenerator> {
    const generator = new ContainerSampleGenerator(container);
    let dataFileContent: any;
    if (isCopilot) {
      dataFileContent = await import(
        /* webpackChunkName: "queryCopilotSampleData" */ "../../../sampleData/queryCopilotSampleData.json"
      );
    } else if (userContext.apiType === "Gremlin") {
      dataFileContent = await import(
        /* webpackChunkName: "gremlinSampleJsonData" */ "../../../sampleData/gremlinSampleData.json"
      );
    } else if (userContext.apiType === "SQL" || userContext.apiType === "Mongo") {
      dataFileContent = await import(
        /* webpackChunkName: "sqlSampleJsonData" */ "../../../sampleData/sqlSampleData.json"
      );
    } else {
      return Promise.reject(`Sample generation not supported for this API ${userContext.apiType}`);
    }

    generator.setData(dataFileContent);
    return generator;
  }

  public async createSampleContainerAsync(): Promise<void> {
    const collection = await this.createContainerAsync();
    this.populateContainerAsync(collection);
  }

  public getDatabaseId(): string {
    return this.sampleDataFile.databaseId;
  }

  public getCollectionId(): string {
    return this.sampleDataFile.collectionId;
  }

  private async createContainerAsync(): Promise<ViewModels.Collection> {
    const createRequest: DataModels.CreateCollectionParams = {
      ...this.sampleDataFile,
    };

    await createCollection(createRequest);
    await this.container.refreshAllDatabases();
    const database = useDatabases.getState().findDatabaseWithId(this.sampleDataFile.databaseId);
    if (!database) {
      return undefined;
    }
    await database.loadCollections();
    return database.findCollectionWithId(this.sampleDataFile.collectionId);
  }

  public async populateContainerAsync(collection: ViewModels.Collection, shardKey?: string): Promise<void> {
    if (!collection) {
      throw new Error("No container to populate");
    }

    if (userContext.apiType === "Gremlin") {
      // For Gremlin, all queries are executed sequentially, because some queries might be dependent on other queries
      // (e.g. adding edge requires vertices to be present)
      const queries: string[] = this.sampleDataFile.data;
      if (!queries || queries.length < 1) {
        return;
      }
      const { databaseAccount: account } = userContext;
      const databaseId = collection.databaseId;

      const gremlinClient = new GremlinClient();
      gremlinClient.initialize({
        endpoint: `wss://${GraphTab.getGremlinEndpoint(account)}`,
        databaseId: databaseId,
        collectionId: collection.id(),
        password: useDataplaneRbacAuthorization(userContext) ? userContext.aadToken : userContext.masterKey || "",
        maxResultSize: 100,
      });

      await queries
        .map((query) => () => gremlinClient.execute(query))
        .reduce((previous, current) => previous.then(current), Promise.resolve());
    } else {
      // For SQL all queries are executed at the same time
      await Promise.all(
        this.sampleDataFile.data.map(async (doc) => {
          try {
            userContext.apiType === "Mongo"
              ? await createMongoDocument(collection.databaseId, collection, shardKey, doc)
              : await createDocument(collection, doc);
          } catch (error) {
            NotificationConsoleUtils.logConsoleError(error instanceof Error ? error.message : String(error));
          }
        }),
      );
    }
  }

  /**
   * public for unit testing
   * @param data
   */
  public setData(data: SampleDataFile) {
    this.sampleDataFile = data;
  }
}
