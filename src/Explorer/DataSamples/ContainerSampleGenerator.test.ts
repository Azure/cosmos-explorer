import * as ko from "knockout";
import * as sinon from "sinon";
import * as ViewModels from "../../Contracts/ViewModels";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import Q from "q";
import { CollectionStub, DatabaseStub, ExplorerStub } from "../OpenActionsStubs";
import { ContainerSampleGenerator } from "./ContainerSampleGenerator";
import { CosmosClient } from "../../Common/CosmosClient";
import { GremlinClient } from "../Graph/GraphExplorerComponent/GremlinClient";

describe("ContainerSampleGenerator", () => {
  const createExplorerStub = (database: ViewModels.Database): ExplorerStub => {
    const explorerStub = new ExplorerStub();
    explorerStub.nonSystemDatabases = ko.computed(() => [database]);
    explorerStub.isPreferredApiGraph = ko.computed<boolean>(() => false);
    explorerStub.isPreferredApiMongoDB = ko.computed<boolean>(() => false);
    explorerStub.isPreferredApiDocumentDB = ko.computed<boolean>(() => false);
    explorerStub.isPreferredApiTable = ko.computed<boolean>(() => false);
    explorerStub.isPreferredApiCassandra = ko.computed<boolean>(() => false);
    explorerStub.canExceedMaximumValue = ko.computed<boolean>(() => false);
    explorerStub.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
    explorerStub.findDatabaseWithId = () => database;
    explorerStub.refreshAllDatabases = () => Q.resolve();
    return explorerStub;
  };

  it("should insert documents for sql API account", async () => {
    const sampleCollectionId = "SampleCollection";
    const sampleDatabaseId = "SampleDB";

    const sampleData = {
      databaseId: sampleDatabaseId,
      offerThroughput: 400,
      databaseLevelThroughput: false,
      collectionId: sampleCollectionId,
      rupmEnabled: false,
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
    const collection = new CollectionStub({ id: ko.observable(sampleCollectionId) });
    const database = new DatabaseStub({
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray([collection]),
    });
    database.findCollectionWithId = () => collection;

    const explorerStub = createExplorerStub(database);
    explorerStub.isPreferredApiDocumentDB = ko.computed<boolean>(() => true);

    const fakeDocumentClientUtility = sinon.createStubInstance(DocumentClientUtilityBase);
    fakeDocumentClientUtility.getOrCreateDatabaseAndCollection.returns(Q.resolve(collection));
    fakeDocumentClientUtility.createDocument.returns(Q.resolve());

    explorerStub.documentClientUtility = fakeDocumentClientUtility;

    const generator = await ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub);
    generator.setData(sampleData);

    await generator.createSampleContainerAsync();

    expect(fakeDocumentClientUtility.createDocument.called).toBe(true);
  });

  it("should send gremlin queries for Graph API account", async () => {
    sinon.stub(GremlinClient.prototype, "initialize").callsFake(() => {});
    const executeStub = sinon.stub(GremlinClient.prototype, "execute").returns(Q.resolve());

    sinon.stub(CosmosClient, "databaseAccount").returns({
      properties: {},
    });

    const sampleCollectionId = "SampleCollection";
    const sampleDatabaseId = "SampleDB";

    const sampleData = {
      databaseId: sampleDatabaseId,
      offerThroughput: 400,
      databaseLevelThroughput: false,
      collectionId: sampleCollectionId,
      rupmEnabled: false,
      data: [
        "g.addV('person').property(id, '1').property('_partitionKey','pk').property('name', 'Eva').property('age', 44)",
      ],
    };
    const collection = new CollectionStub({ id: ko.observable(sampleCollectionId) });
    const database = new DatabaseStub({
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray([collection]),
    });
    database.findCollectionWithId = () => collection;
    collection.databaseId = database.id();

    const explorerStub = createExplorerStub(database);
    explorerStub.isPreferredApiGraph = ko.computed<boolean>(() => true);

    const fakeDocumentClientUtility = sinon.createStubInstance(DocumentClientUtilityBase);
    fakeDocumentClientUtility.getOrCreateDatabaseAndCollection.returns(Q.resolve(collection));
    fakeDocumentClientUtility.createDocument.returns(Q.resolve());

    explorerStub.documentClientUtility = fakeDocumentClientUtility;

    const generator = await ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub);
    generator.setData(sampleData);

    await generator.createSampleContainerAsync();

    expect(fakeDocumentClientUtility.createDocument.called).toBe(false);
    expect(executeStub.called).toBe(true);
  });

  it("should not create any sample for Mongo API account", async () => {
    const experience = "not supported api";
    const explorerStub = createExplorerStub(undefined);
    explorerStub.isPreferredApiMongoDB = ko.computed<boolean>(() => true);
    explorerStub.defaultExperience = ko.observable<string>(experience);

    // Rejects with error that contains experience
    await expect(ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub)).rejects.toMatch(experience);
  });

  it("should not create any sample for Table API account", async () => {
    const experience = "not supported api";
    const explorerStub = createExplorerStub(undefined);
    explorerStub.isPreferredApiTable = ko.computed<boolean>(() => true);
    explorerStub.defaultExperience = ko.observable<string>(experience);

    // Rejects with error that contains experience
    await expect(ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub)).rejects.toMatch(experience);
  });

  it("should not create any sample for Cassandra API account", async () => {
    const experience = "not supported api";
    const explorerStub = createExplorerStub(undefined);
    explorerStub.isPreferredApiCassandra = ko.computed<boolean>(() => true);
    explorerStub.defaultExperience = ko.observable<string>(experience);

    // Rejects with error that contains experience
    await expect(ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub)).rejects.toMatch(experience);
  });
});
