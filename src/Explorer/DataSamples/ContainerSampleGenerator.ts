import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import GraphTab from ".././Tabs/GraphTab";
import { GremlinClient } from "../Graph/GraphExplorerComponent/GremlinClient";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { createCollection } from "../../Common/dataAccess/createCollection";
import { createDocument } from "../../Common/dataAccess/createDocument";
import { userContext } from "../../UserContext";

interface SampleDataFile extends DataModels.CreateCollectionParams {
  data: any[];
}

export class ContainerSampleGenerator {
  private sampleDataFile: SampleDataFile;

  private constructor(private container: Explorer) {}

  /**
   * Factory function to load the json data file
   */
  public static async createSampleGeneratorAsync(container: Explorer): Promise<ContainerSampleGenerator> {
    const generator = new ContainerSampleGenerator(container);
    let dataFileContent: any;
    if (container.isPreferredApiGraph()) {
      dataFileContent = await import(
        /* webpackChunkName: "gremlinSampleJsonData" */ "../../../sampleData/gremlinSampleData.json"
      );
    } else if (container.isPreferredApiDocumentDB()) {
      dataFileContent = await import(
        /* webpackChunkName: "sqlSampleJsonData" */ "../../../sampleData/sqlSampleData.json"
      );
    } else {
      return Promise.reject(`Sample generation not supported for this API ${container.defaultExperience()}`);
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
    const database = this.container.findDatabaseWithId(this.sampleDataFile.databaseId);
    if (!database) {
      return undefined;
    }
    await database.loadCollections();
    return database.findCollectionWithId(this.sampleDataFile.collectionId);
  }

  private async populateContainerAsync(collection: ViewModels.Collection): Promise<void> {
    if (!collection) {
      throw new Error("No container to populate");
    }
    const promises: Q.Promise<any>[] = [];

    if (this.container.isPreferredApiGraph()) {
      // For Gremlin, all queries are executed sequentially, because some queries might be dependent on other queries
      // (e.g. adding edge requires vertices to be present)
      const queries: string[] = this.sampleDataFile.data;
      if (!queries || queries.length < 1) {
        return;
      }
      const account = userContext.databaseAccount;
      const databaseId = collection.databaseId;
      const gremlinClient = new GremlinClient();
      gremlinClient.initialize({
        endpoint: `wss://${GraphTab.getGremlinEndpoint(account)}`,
        databaseId: databaseId,
        collectionId: collection.id(),
        masterKey: userContext.masterKey || "",
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
            await createDocument(collection, doc);
          } catch (error) {
            NotificationConsoleUtils.logConsoleError(error);
          }
        })
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
