import { DatabaseAccount } from "./Contracts/DataModels";
import { updateUserContext, userContext } from "./UserContext";

describe("shouldShowQueryPageOptions()", () => {
  it("should be SQL for Default API", () => {
    updateUserContext({});
    expect(userContext.apiType).toBe("SQL");
  });

  it("should be Cassandra for EnableCassandra API", () => {
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableCassandra" }],
        },
      } as DatabaseAccount,
    });
    expect(userContext.apiType).toBe("Cassandra");
  });

  it("should be Gremlin for EnableGremlin API", () => {
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableGremlin" }],
        },
      } as DatabaseAccount,
    });
    expect(userContext.apiType).toBe("Gremlin");
  });

  it("should be Tables for EnableTable API", () => {
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableTable" }],
        },
      } as DatabaseAccount,
    });
    expect(userContext.apiType).toBe("Tables");
  });

  it("should be Mongo for MongoDB API", () => {
    updateUserContext({
      databaseAccount: {
        kind: "MongoDB",
      } as DatabaseAccount,
    });
    expect(userContext.apiType).toBe("Mongo");
  });

  it("should be Mongo for Parse API", () => {
    updateUserContext({
      databaseAccount: {
        kind: "Parse",
      } as DatabaseAccount,
    });
    expect(userContext.apiType).toBe("Mongo");
  });

  it("should be 'Postgres' for Postgres API", () => {
    updateUserContext({
      databaseAccount: {
        kind: "Postgres",
      } as DatabaseAccount,
    });
    expect(userContext.apiType).toBe("Postgres");
  });

  it("should be 'VCoreMongo' for vCore Mongo", () => {
    updateUserContext({
      databaseAccount: {
        kind: "VCoreMongo",
      } as DatabaseAccount,
    });
    expect(userContext.apiType).toBe("VCoreMongo");
  });
});
