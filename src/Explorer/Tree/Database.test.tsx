import { HttpStatusCodes } from "../../Common/Constants";
import * as collectionAccess from "../../Common/dataAccess/readCollections";
import { Platform, updateConfigContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { CosmosDbArtifactType } from "../../Contracts/FabricMessagesContract";
import { JunoClient } from "../../Juno/JunoClient";
import { Features } from "../../Platform/Hosted/extractFeatures";
import { updateUserContext, userContext } from "../../UserContext";
import Explorer from "../Explorer";
import Database from "./Database";

const createMockContainer = (): Explorer => {
  const mockContainer = new Explorer();
  return mockContainer;
};

updateUserContext({
  subscriptionId: "fakeSubscriptionId",
  resourceGroup: "fakeResourceGroup",
  databaseAccount: {
    id: "id",
    name: "fakeName",
    location: "fakeLocation",
    type: "fakeType",
    kind: "fakeKind",
    properties: {
      documentEndpoint: "fakeEndpoint",
      tableEndpoint: "fakeEndpoint",
      gremlinEndpoint: "fakeEndpoint",
      cassandraEndpoint: "fakeEndpoint",
    },
  },
});

describe("Add Schema", () => {
  it("should not call requestSchema or getSchema if analyticalStorageTtl is undefined", () => {
    const collection: DataModels.Collection = { id: "fakeId" } as DataModels.Collection;
    collection.analyticalStorageTtl = undefined;
    const database = new Database(createMockContainer(), collection);
    database.container = createMockContainer();

    database.junoClient = new JunoClient();
    database.junoClient.requestSchema = jest.fn();
    database.junoClient.getSchema = jest.fn();

    database.addSchema(collection);

    expect(database.junoClient.requestSchema).toHaveBeenCalledTimes(0);
  });

  it("should call requestSchema or getSchema if analyticalStorageTtl is not undefined", () => {
    const collection: DataModels.Collection = {} as DataModels.Collection;
    collection.analyticalStorageTtl = 0;

    const database = new Database(createMockContainer(), collection);
    database.container = createMockContainer();
    updateUserContext({
      features: {
        enableSchema: true,
      } as Features,
    });

    database.junoClient = new JunoClient();
    database.junoClient.requestSchema = jest.fn();
    database.junoClient.getSchema = jest.fn().mockResolvedValue({ status: HttpStatusCodes.OK, data: {} });

    jest.useFakeTimers();
    const interval = 5000;
    const checkForSchema: NodeJS.Timeout = database.addSchema(collection, interval);
    jest.advanceTimersByTime(interval + 1000);

    expect(database.junoClient.requestSchema).toHaveBeenCalledWith({
      id: undefined,
      subscriptionId: userContext.subscriptionId,
      resourceGroup: userContext.resourceGroup,
      accountName: userContext.databaseAccount.name,
      resource: `dbs/${database.id()}/colls/${collection.id}`,
      status: "new",
    });
    expect(checkForSchema).not.toBeNull();
    expect(database.junoClient.getSchema).toHaveBeenCalledWith(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      database.id(),
      collection.id,
    );
  });
});

describe("Expanding an empty Fabric database", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.spyOn(Explorer.prototype, "refreshExplorer").mockResolvedValue(undefined);
    updateConfigContext({ platform: Platform.Fabric });
    updateUserContext({
      fabricContext: {
        artifactType: CosmosDbArtifactType.NATIVE,
        artifactInfo: undefined,
        databaseName: "database",
        fabricClientRpcVersion: "FabricMessageV3",
        isVisible: true,
        isReadOnly: false,
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    updateUserContext({ fabricContext: undefined });
    updateConfigContext({ platform: Platform.Portal });
  });

  it("does not reload a successfully loaded empty snapshot on expansion, but still supports refresh", async () => {
    const readCollections = jest.spyOn(collectionAccess, "readCollections").mockResolvedValue([]);
    const database = new Database(createMockContainer(), {
      id: "database",
      _rid: "rid",
      _self: "self",
      _etag: "etag",
      _ts: 1,
    });
    jest.spyOn(database, "loadOffer").mockResolvedValue(undefined);

    await database.loadCollections(true);
    await database.expandDatabase();
    expect(readCollections).toHaveBeenCalledTimes(1);
    expect(database.isDatabaseExpanded()).toBe(true);

    await database.loadCollections(true);
    expect(readCollections).toHaveBeenCalledTimes(2);
  });

  it("still fetches when expanding a database that has not loaded yet", async () => {
    const readCollections = jest.spyOn(collectionAccess, "readCollections").mockResolvedValue([]);
    const database = new Database(createMockContainer(), {
      id: "database",
      _rid: "rid",
      _self: "self",
      _etag: "etag",
      _ts: 1,
    });
    jest.spyOn(database, "loadOffer").mockResolvedValue(undefined);
    await database.expandDatabase();
    expect(readCollections).toHaveBeenCalledTimes(1);
  });
});
