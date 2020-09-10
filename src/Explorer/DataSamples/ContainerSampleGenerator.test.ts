jest.mock("../../Common/DocumentClientUtilityBase");
jest.mock("../../Common/dataAccess/createCollection");
import * as ko from "knockout";
import * as sinon from "sinon";
import * as ViewModels from "../../Contracts/ViewModels";
import Q from "q";
import { ContainerSampleGenerator } from "./ContainerSampleGenerator";
import * as DocumentClientUtility from "../../Common/DocumentClientUtilityBase";
import { GremlinClient } from "../Graph/GraphExplorerComponent/GremlinClient";
import Explorer from "../Explorer";
import { updateUserContext } from "../../UserContext";

describe("ContainerSampleGenerator", () => {
  const createExplorerStub = (database: ViewModels.Database): Explorer => {
    const explorerStub = {} as Explorer;
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
      createNewDatabase: true,
      collectionId: sampleCollectionId,
      data: [
        {
          firstname: "Eva",
          age: 44
        },
        {
          firstname: "Véronique",
          age: 50
        },
        {
          firstname: "亜妃子",
          age: 5
        },
        {
          firstname: "John",
          age: 23
        }
      ]
    };
    const collection = { id: ko.observable(sampleCollectionId) } as ViewModels.Collection;
    const database = {
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray<ViewModels.Collection>([collection])
    } as ViewModels.Database;
    database.findCollectionWithId = () => collection;

    const explorerStub = createExplorerStub(database);
    explorerStub.isPreferredApiDocumentDB = ko.computed<boolean>(() => true);
    const generator = await ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub);
    generator.setData(sampleData);

    await generator.createSampleContainerAsync();

    expect(DocumentClientUtility.createDocument).toHaveBeenCalled();
  });

  it("should send gremlin queries for Graph API account", async () => {
    sinon.stub(GremlinClient.prototype, "initialize").callsFake(() => {});
    const executeStub = sinon.stub(GremlinClient.prototype, "execute").returns(Q.resolve());

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
          cassandraEndpoint: "foo"
        }
      }
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
        "g.addV('person').property(id, '1').property('_partitionKey','pk').property('name', 'Eva').property('age', 44)"
      ]
    };
    const collection = { id: ko.observable(sampleCollectionId) } as ViewModels.Collection;
    const database = {
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray<ViewModels.Collection>([collection])
    } as ViewModels.Database;
    database.findCollectionWithId = () => collection;
    collection.databaseId = database.id();

    const explorerStub = createExplorerStub(database);
    explorerStub.isPreferredApiGraph = ko.computed<boolean>(() => true);

    const generator = await ContainerSampleGenerator.createSampleGeneratorAsync(explorerStub);
    generator.setData(sampleData);

    await generator.createSampleContainerAsync();

    expect(DocumentClientUtility.createDocument).toHaveBeenCalled();
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
