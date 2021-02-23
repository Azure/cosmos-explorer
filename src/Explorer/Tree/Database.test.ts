import * as DataModels from "../../Contracts/DataModels";
import * as ko from "knockout";
import Database from "./Database";
import Explorer from "../Explorer";
import { HttpStatusCodes } from "../../Common/Constants";
import { JunoClient } from "../../Juno/JunoClient";
import { userContext, updateUserContext } from "../../UserContext";

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
    tags: undefined,
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
    const collection: DataModels.Collection = {} as DataModels.Collection;
    collection.analyticalStorageTtl = undefined;
    const database = new Database(createMockContainer(), { id: "fakeId" });
    database.container = createMockContainer();
    database.container.isSchemaEnabled = ko.computed<boolean>(() => false);

    database.junoClient = new JunoClient();
    database.junoClient.requestSchema = jest.fn();
    database.junoClient.getSchema = jest.fn();

    database.addSchema(collection);

    expect(database.junoClient.requestSchema).toBeCalledTimes(0);
  });

  it("should call requestSchema or getSchema if analyticalStorageTtl is not undefined", () => {
    const collection: DataModels.Collection = { id: "fakeId" } as DataModels.Collection;
    collection.analyticalStorageTtl = 0;

    const database = new Database(createMockContainer(), {});
    database.container = createMockContainer();
    database.container.isSchemaEnabled = ko.computed<boolean>(() => true);

    database.junoClient = new JunoClient();
    database.junoClient.requestSchema = jest.fn();
    database.junoClient.getSchema = jest.fn().mockResolvedValue({ status: HttpStatusCodes.OK, data: {} });

    jest.useFakeTimers();
    const interval = 5000;
    const checkForSchema: NodeJS.Timeout = database.addSchema(collection, interval);
    jest.advanceTimersByTime(interval + 1000);

    expect(database.junoClient.requestSchema).toBeCalledWith({
      id: undefined,
      subscriptionId: userContext.subscriptionId,
      resourceGroup: userContext.resourceGroup,
      accountName: userContext.databaseAccount.name,
      resource: `dbs/${database.id}/colls/${collection.id}`,
      status: "new",
    });
    expect(checkForSchema).not.toBeNull();
    expect(database.junoClient.getSchema).toBeCalledWith(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      database.id(),
      collection.id
    );
  });
});
