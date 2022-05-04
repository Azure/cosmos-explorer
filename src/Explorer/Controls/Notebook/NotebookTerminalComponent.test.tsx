import { shallow } from "enzyme";
import React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import { NotebookTerminalComponent, NotebookTerminalComponentProps } from "./NotebookTerminalComponent";

const testAccount: DataModels.DatabaseAccount = {
  id: "id",
  kind: "kind",
  location: "location",
  name: "name",
  properties: {
    documentEndpoint: "https://testDocumentEndpoint.azure.com/",
  },
  type: "type",
};

const testMongo32Account: DataModels.DatabaseAccount = {
  ...testAccount,
};

const testMongo36Account: DataModels.DatabaseAccount = {
  ...testAccount,
  properties: {
    mongoEndpoint: "https://testMongoEndpoint.azure.com/",
  },
};

const testCassandraAccount: DataModels.DatabaseAccount = {
  ...testAccount,
  properties: {
    cassandraEndpoint: "https://testCassandraEndpoint.azure.com/",
  },
};

const testNotebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo = {
  authToken: "authToken",
  notebookServerEndpoint: "https://testNotebookServerEndpoint.azure.com",
  forwardingId: "Id",
};

const testMongoNotebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo = {
  authToken: "authToken",
  notebookServerEndpoint: "https://testNotebookServerEndpoint.azure.com/mongo",
  forwardingId: "Id",
};

const testCassandraNotebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo = {
  authToken: "authToken",
  notebookServerEndpoint: "https://testNotebookServerEndpoint.azure.com/cassandra",
  forwardingId: "Id",
};

describe("NotebookTerminalComponent", () => {
  it("renders terminal", () => {
    const props: NotebookTerminalComponentProps = {
      databaseAccount: testAccount,
      notebookServerInfo: testNotebookServerInfo,
      tabId: undefined,
    };

    const wrapper = shallow(<NotebookTerminalComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders mongo 3.2 shell", () => {
    const props: NotebookTerminalComponentProps = {
      databaseAccount: testMongo32Account,
      notebookServerInfo: testMongoNotebookServerInfo,
      tabId: undefined,
    };

    const wrapper = shallow(<NotebookTerminalComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders mongo 3.6 shell", () => {
    const props: NotebookTerminalComponentProps = {
      databaseAccount: testMongo36Account,
      notebookServerInfo: testMongoNotebookServerInfo,
      tabId: undefined,
    };

    const wrapper = shallow(<NotebookTerminalComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders cassandra shell", () => {
    const props: NotebookTerminalComponentProps = {
      databaseAccount: testCassandraAccount,
      notebookServerInfo: testCassandraNotebookServerInfo,
      tabId: undefined,
    };

    const wrapper = shallow(<NotebookTerminalComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
