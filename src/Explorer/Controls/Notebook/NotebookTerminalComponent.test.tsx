import * as DataModels from "../../../Contracts/DataModels";
import { NotebookTerminalComponent } from "./NotebookTerminalComponent";

const createTestDatabaseAccount = (): DataModels.DatabaseAccount => {
  return {
    id: "testId",
    kind: "testKind",
    location: "testLocation",
    name: "testName",
    properties: {
      cassandraEndpoint: null,
      documentEndpoint: "https://testDocumentEndpoint.azure.com/",
      gremlinEndpoint: null,
      tableEndpoint: null,
    },
    tags: "testTags",
    type: "testType",
  };
};

const createTestMongo32DatabaseAccount = (): DataModels.DatabaseAccount => {
  return {
    id: "testId",
    kind: "testKind",
    location: "testLocation",
    name: "testName",
    properties: {
      cassandraEndpoint: null,
      documentEndpoint: "https://testDocumentEndpoint.azure.com/",
      gremlinEndpoint: null,
      tableEndpoint: null,
    },
    tags: "testTags",
    type: "testType",
  };
};

const createTestMongo36DatabaseAccount = (): DataModels.DatabaseAccount => {
  return {
    id: "testId",
    kind: "testKind",
    location: "testLocation",
    name: "testName",
    properties: {
      cassandraEndpoint: null,
      documentEndpoint: "https://testDocumentEndpoint.azure.com/",
      gremlinEndpoint: null,
      tableEndpoint: null,
      mongoEndpoint: "https://testMongoEndpoint.azure.com/",
    },
    tags: "testTags",
    type: "testType",
  };
};

const createTestCassandraDatabaseAccount = (): DataModels.DatabaseAccount => {
  return {
    id: "testId",
    kind: "testKind",
    location: "testLocation",
    name: "testName",
    properties: {
      cassandraEndpoint: "https://testCassandraEndpoint.azure.com/",
      documentEndpoint: null,
      gremlinEndpoint: null,
      tableEndpoint: null,
    },
    tags: "testTags",
    type: "testType",
  };
};

const createTerminal = (): NotebookTerminalComponent => {
  return new NotebookTerminalComponent({
    notebookServerInfo: {
      authToken: "testAuthToken",
      notebookServerEndpoint: "https://testNotebookServerEndpoint.azure.com/",
    },
    databaseAccount: createTestDatabaseAccount(),
  });
};

const createMongo32Terminal = (): NotebookTerminalComponent => {
  return new NotebookTerminalComponent({
    notebookServerInfo: {
      authToken: "testAuthToken",
      notebookServerEndpoint: "https://testNotebookServerEndpoint.azure.com/mongo",
    },
    databaseAccount: createTestMongo32DatabaseAccount(),
  });
};

const createMongo36Terminal = (): NotebookTerminalComponent => {
  return new NotebookTerminalComponent({
    notebookServerInfo: {
      authToken: "testAuthToken",
      notebookServerEndpoint: "https://testNotebookServerEndpoint.azure.com/mongo",
    },
    databaseAccount: createTestMongo36DatabaseAccount(),
  });
};

const createCassandraTerminal = (): NotebookTerminalComponent => {
  return new NotebookTerminalComponent({
    notebookServerInfo: {
      authToken: "testAuthToken",
      notebookServerEndpoint: "https://testNotebookServerEndpoint.azure.com/cassandra",
    },
    databaseAccount: createTestCassandraDatabaseAccount(),
  });
};

describe("NotebookTerminalComponent", () => {
  it("getTerminalParams: Test for terminal", () => {
    const terminal: NotebookTerminalComponent = createTerminal();
    const params: Map<string, string> = terminal.getTerminalParams();

    expect(params).toEqual(
      new Map<string, string>([["terminal", "true"]])
    );
  });

  it("getTerminalParams: Test for Mongo 3.2 terminal", () => {
    const terminal: NotebookTerminalComponent = createMongo32Terminal();
    const params: Map<string, string> = terminal.getTerminalParams();

    expect(params).toEqual(
      new Map<string, string>([
        ["terminal", "true"],
        ["terminalEndpoint", new URL(terminal.props.databaseAccount.properties.documentEndpoint).host],
      ])
    );
  });

  it("getTerminalParams: Test for Mongo 3.6 terminal", () => {
    const terminal: NotebookTerminalComponent = createMongo36Terminal();
    const params: Map<string, string> = terminal.getTerminalParams();

    expect(params).toEqual(
      new Map<string, string>([
        ["terminal", "true"],
        ["terminalEndpoint", new URL(terminal.props.databaseAccount.properties.mongoEndpoint).host],
      ])
    );
  });

  it("getTerminalParams: Test for Cassandra terminal", () => {
    const terminal: NotebookTerminalComponent = createCassandraTerminal();
    const params: Map<string, string> = terminal.getTerminalParams();

    expect(params).toEqual(
      new Map<string, string>([
        ["terminal", "true"],
        ["terminalEndpoint", new URL(terminal.props.databaseAccount.properties.cassandraEndpoint).host],
      ])
    );
  });
});
