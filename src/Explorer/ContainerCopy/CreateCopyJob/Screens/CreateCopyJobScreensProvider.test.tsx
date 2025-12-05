import { shallow } from "enzyme";
import Explorer from "Explorer/Explorer";
import React from "react";
import CreateCopyJobScreensProvider from "./CreateCopyJobScreensProvider";

jest.mock("../../Context/CopyJobContext", () => ({
  __esModule: true,
  default: ({ children, explorer }: { children: React.ReactNode; explorer: Explorer }) => (
    <div data-testid="copy-job-context-provider" data-explorer={explorer ? "explorer-instance" : "null"}>
      {children}
    </div>
  ),
}));

jest.mock("./CreateCopyJobScreens", () => ({
  __esModule: true,
  default: () => <div data-testid="create-copy-job-screens">CreateCopyJobScreens</div>,
}));

const mockExplorer = {
  databaseAccount: {
    id: "test-account",
    name: "test-account-name",
    location: "East US",
    type: "DocumentDB",
    kind: "GlobalDocumentDB",
    properties: {
      documentEndpoint: "https://test-account.documents.azure.com:443/",
      gremlinEndpoint: "https://test-account.gremlin.cosmosdb.azure.com:443/",
      tableEndpoint: "https://test-account.table.cosmosdb.azure.com:443/",
      cassandraEndpoint: "https://test-account.cassandra.cosmosdb.azure.com:443/",
    },
  },
  subscriptionId: "test-subscription-id",
  resourceGroup: "test-resource-group",
} as unknown as Explorer;

describe("CreateCopyJobScreensProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with explorer prop", () => {
    const wrapper = shallow(<CreateCopyJobScreensProvider explorer={mockExplorer} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render with null explorer", () => {
    const wrapper = shallow(<CreateCopyJobScreensProvider explorer={null as unknown as Explorer} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render with undefined explorer", () => {
    const wrapper = shallow(<CreateCopyJobScreensProvider explorer={undefined as unknown as Explorer} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should not crash with minimal explorer object", () => {
    const minimalExplorer = {} as Explorer;

    expect(() => {
      const wrapper = shallow(<CreateCopyJobScreensProvider explorer={minimalExplorer} />);
      expect(wrapper).toBeDefined();
    }).not.toThrow();
  });

  it("should match snapshot for default render", () => {
    const wrapper = shallow(<CreateCopyJobScreensProvider explorer={mockExplorer} />);
    expect(wrapper).toMatchSnapshot("default-render");
  });

  it("should match snapshot for edge cases", () => {
    const emptyExplorer = {} as Explorer;
    const wrapperEmpty = shallow(<CreateCopyJobScreensProvider explorer={emptyExplorer} />);
    expect(wrapperEmpty).toMatchSnapshot("empty-explorer");

    const partialExplorer = {
      databaseAccount: { id: "partial-account" },
    } as unknown as Explorer;
    const wrapperPartial = shallow(<CreateCopyJobScreensProvider explorer={partialExplorer} />);
    expect(wrapperPartial).toMatchSnapshot("partial-explorer");
  });

  describe("Error Boundaries and Edge Cases", () => {
    it("should handle React rendering errors gracefully", () => {
      const edgeCases = [null, undefined, {}, { invalidProperty: "test" }];

      edgeCases.forEach((explorerCase) => {
        expect(() => {
          shallow(<CreateCopyJobScreensProvider explorer={explorerCase as unknown as Explorer} />);
        }).not.toThrow();
      });
    });
  });
});
