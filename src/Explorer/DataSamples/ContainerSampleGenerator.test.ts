/*eslint-disable @typescript-eslint/no-empty-function*/
jest.mock("../Graph/GraphExplorerComponent/GremlinClient");
jest.mock("../../Common/dataAccess/createCollection");
jest.mock("../../Common/dataAccess/createDocument");
import * as ko from "knockout";
import { createDocument } from "../../Common/dataAccess/createDocument";
import { DatabaseAccount } from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { updateUserContext } from "../../UserContext";
import Explorer from "../Explorer";
import { useDatabases } from "../useDatabases";
import { ContainerSampleGenerator } from "./ContainerSampleGenerator";

describe("ContainerSampleGenerator", () => {
  let explorerStub: Explorer;

  beforeAll(() => {
    explorerStub = {
      refreshAllDatabases: () => {},
    } as Explorer;
  });

  beforeEach(() => {
    (createDocument as jest.Mock).mockResolvedValue(undefined);
  });

  it("should insert documents for sql API account", async () => {
    const sampleCollectionId = "SampleCollection";
    const sampleDatabaseId = "SampleDB";
    updateUserContext({});
    const sampleData = {
      databaseId: sampleDatabaseId,
      offerThroughput: 400,
      databaseLevelThroughput: false,
      createNewDatabase: true,
      collectionId: sampleCollectionId,
      data: [
        {
          firstname: "Eva",
          age: 44,
        },
        {
          firstname: "Véronique",
          age: 50,
        },
        {
          firstname: "亜妃子",
          age: 5,
        },
        {
          firstname: "John",
          age: 23,
        },
      ],
    };
    const collection = { id: ko.observable(sampleCollectionId) } as ViewModels.Collection;
    const database = {
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray<ViewModels.Collection>([collection]),
      loadCollections: () => {},
    } as ViewModels.Database;
    database.findCollectionWithId = () => collection;
    useDatabases.getState().addDatabases([database]);

    const generator = await ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub);
    generator.setData(sampleData);

    await generator.createSampleContainerAsync();

    expect(createDocument).toHaveBeenCalled();
  });

  // eslint-disable-next-line jest/expect-expect
  it("should send gremlin queries for Graph API account", async () => {
    updateUserContext({
      databaseAccount: {
        id: "foo",
        name: "foo",
        location: "foo",
        type: "foo",
        kind: "foo",
        properties: {
          documentEndpoint: "bar",
          gremlinEndpoint: "foo",
          tableEndpoint: "foo",
          cassandraEndpoint: "foo",
        },
      },
    });

    const sampleCollectionId = "SampleCollection";
    const sampleDatabaseId = "SampleDB";

    const sampleData = {
      databaseId: sampleDatabaseId,
      offerThroughput: 400,
      databaseLevelThroughput: false,
      createNewDatabase: true,
      collectionId: sampleCollectionId,
      data: [
        "g.addV('person').property(id, '1').property('_partitionKey','pk').property('name', 'Eva').property('age', 44)",
      ],
    };
    const collection = { id: ko.observable(sampleCollectionId) } as ViewModels.Collection;
    const database = {
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray<ViewModels.Collection>([collection]),
      loadCollections: () => {},
    } as ViewModels.Database;
    database.findCollectionWithId = () => collection;
    collection.databaseId = database.id();
    useDatabases.getState().addDatabases([database]);

    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableGremlin" }],
        },
      } as DatabaseAccount,
    });

    const generator = await ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub);
    generator.setData(sampleData);

    await generator.createSampleContainerAsync();
  });

  it("should not create any sample for Mongo API account", async () => {
    const experience = "Sample generation not supported for this API Mongo";
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableMongo" }],
        },
      } as DatabaseAccount,
    });

    // Rejects with error that contains experience
    // eslint-disable-next-line jest/valid-expect
    expect(ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub)).rejects.toMatch(experience);
  });

  it("should not create any sample for Table API account", async () => {
    const experience = "Sample generation not supported for this API Tables";
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableTable" }],
        },
      } as DatabaseAccount,
    });

    // Rejects with error that contains experience
    await expect(ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub)).rejects.toMatch(experience);
  });

  it("should not create any sample for Cassandra API account", async () => {
    const experience = "Sample generation not supported for this API Cassandra";
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableCassandra" }],
        },
      } as DatabaseAccount,
    });
    // Rejects with error that contains experience
    await expect(ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub)).rejects.toMatch(experience);
  });
});
