jest.mock("../Graph/GraphExplorerComponent/GremlinClient");
jest.mock("../../Common/dataAccess/createCollection");
jest.mock("../../Common/dataAccess/createDocument");
import * as ko from "knockout";
import Q from "q";
import { createDocument } from "../../Common/dataAccess/createDocument";
import { DatabaseAccount } from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { updateUserContext } from "../../UserContext";
import Explorer from "../Explorer";
import { ContainerSampleGenerator } from "./ContainerSampleGenerator";

describe("ContainerSampleGenerator", () => {
  const createExplorerStub = (database: ViewModels.Database): Explorer => {
    const explorerStub = {} as Explorer;
    explorerStub.databases = ko.observableArray<ViewModels.Database>([database]);
    explorerStub.isPreferredApiMongoDB = ko.computed<boolean>(() => false);
    explorerStub.isPreferredApiDocumentDB = ko.computed<boolean>(() => false);
    explorerStub.isPreferredApiTable = ko.computed<boolean>(() => false);
    explorerStub.isPreferredApiCassandra = ko.computed<boolean>(() => false);
    explorerStub.canExceedMaximumValue = ko.computed<boolean>(() => false);
    explorerStub.findDatabaseWithId = () => database;
    explorerStub.refreshAllDatabases = () => Q.resolve();
    return explorerStub;
  };

  beforeEach(() => {
    (createDocument as jest.Mock).mockResolvedValue(undefined);
  });

  it("should insert documents for sql API account", async () => {
    const sampleCollectionId = "SampleCollection";
    const sampleDatabaseId = "SampleDB";

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

    const explorerStub = createExplorerStub(database);
    explorerStub.isPreferredApiDocumentDB = ko.computed<boolean>(() => true);
    const generator = await ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub);
    generator.setData(sampleData);

    await generator.createSampleContainerAsync();

    expect(createDocument).toHaveBeenCalled();
  });

  it("should send gremlin queries for Graph API account", async () => {
    updateUserContext({
      databaseAccount: {
        id: "foo",
        name: "foo",
        location: "foo",
        type: "foo",
        kind: "foo",
        tags: [],
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

    const explorerStub = createExplorerStub(database);
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
    const experience = "not supported api";
    const explorerStub = createExplorerStub(undefined);
    explorerStub.isPreferredApiMongoDB = ko.computed<boolean>(() => true);
    explorerStub.defaultExperience = ko.observable<string>(experience);

    // Rejects with error that contains experience
    expect(ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub)).rejects.toMatch(experience);
  });

  it("should not create any sample for Table API account", async () => {
    const experience = "Sample generation not supported for this API Tables";
    const explorerStub = createExplorerStub(undefined);
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
    const experience = "Sample generation not supported for this API Tables";
    const explorerStub = createExplorerStub(undefined);
    explorerStub.isPreferredApiCassandra = ko.computed<boolean>(() => true);
    explorerStub.defaultExperience = ko.observable<string>(experience);

    // Rejects with error that contains experience
    await expect(ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub)).rejects.toMatch(experience);
  });
});
