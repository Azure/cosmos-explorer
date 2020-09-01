import * as DataModels from "../../Contracts/DataModels";
import * as ko from "knockout";
import * as sinon from "sinon";
import * as ViewModels from "../../Contracts/ViewModels";
import Collection from "./Collection";
import Database from "./Database";
import Explorer from "../Explorer";
import { JunoClient } from "../../Juno/JunoClient";
import { userContext, updateUserContext } from "../../UserContext";
import { DatabaseAccount } from "@azure/cosmos";

const createMockContainer = (): Explorer => {
  let mockContainer = new Explorer({
    notificationsClient: null,
    isEmulator: false
  });

  return mockContainer;
};

describe("Add Schema", () => {
  it("should not call requestSchema or getSchema if analyticalStorageTtl is undefined", () => {
    const collection: DataModels.Collection = {} as DataModels.Collection;
    collection.analyticalStorageTtl = undefined;
    const database = new Database(createMockContainer(), {}, null);
    database.container = createMockContainer();
    database.container.isSchemaEnabled = ko.computed<boolean>(() => false);

    database.junoClient = new JunoClient();
    database.junoClient.requestSchema = jest.fn();
    database.junoClient.getSchema = jest.fn();

    database.addSchema(collection);

    expect(database.junoClient.requestSchema).toBeCalledTimes(0);
  });

  it("should call requestSchema or getSchema if analyticalStorageTtl is not undefined", () => {
    const collection: DataModels.Collection = {} as DataModels.Collection;
    collection.analyticalStorageTtl = 0;

    updateUserContext({
      subscriptionId: "fakeSubscriptionId",
      resourceGroup: "fakeResourceGroup",
      databaseAccount: {
        id: "id",
        name: "fakeName",
        location: "fakeLocation",
        type: "fakeType",
        tags: null,
        kind: "fakeKind",
        properties: {
          documentEndpoint: "fakeEndpoint",
          tableEndpoint: "fakeEndpoint",
          gremlinEndpoint: "fakeEndpoint",
          cassandraEndpoint: "fakeEndpoint"
        }
      }
    });

    const database = new Database(createMockContainer(), {}, null);
    database.container = createMockContainer();
    database.container.isSchemaEnabled = ko.computed<boolean>(() => true);

    database.junoClient = new JunoClient();
    database.junoClient.requestSchema = jest.fn();
    database.junoClient.getSchema = jest.fn();

    let checkForSchema: NodeJS.Timeout = database.addSchema(collection);

    expect(database.junoClient.requestSchema).toBeCalled();
    expect(checkForSchema).not.toBeNull();
  });
});
