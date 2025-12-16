import { HttpStatusCodes } from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import { JunoClient } from "../../Juno/JunoClient";
import { Features } from "../../Platform/Hosted/extractFeatures";
import { updateUserContext, userContext } from "../../UserContext";
import Explorer from "../Explorer";
import Database from "./Database";

jest.mock("rx-jupyter", () => ({
  sessions: {
    create: jest.fn(),
  },
  contents: {
    JupyterContentProvider: jest.fn().mockImplementation(() => ({})),
  },
}));

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
