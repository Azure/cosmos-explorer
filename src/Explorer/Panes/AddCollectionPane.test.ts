import * as Constants from "../../Common/Constants";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { updateUserContext } from "../../UserContext";
import Explorer from "../Explorer";
import AddCollectionPane from "./AddCollectionPane";

describe("Add Collection Pane", () => {
  describe("isValid()", () => {
    let explorer: Explorer;
    const mockDatabaseAccount: DatabaseAccount = {
      id: "mock",
      kind: "DocumentDB",
      location: "",
      name: "mock",
      properties: {
        documentEndpoint: "",
        cassandraEndpoint: "",
        gremlinEndpoint: "",
        tableEndpoint: "",
        enableFreeTier: false,
      },
      type: undefined,
      tags: [],
    };

    const mockFreeTierDatabaseAccount: DatabaseAccount = {
      id: "mock",
      kind: "DocumentDB",
      location: "",
      name: "mock",
      properties: {
        documentEndpoint: "",
        cassandraEndpoint: "",
        gremlinEndpoint: "",
        tableEndpoint: "",
        enableFreeTier: true,
      },
      type: undefined,
      tags: [],
    };

    beforeEach(() => {
      explorer = new Explorer();
    });

    it("should be true if graph API and partition key is not /id nor /label", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableGremlin" }],
          },
        } as DatabaseAccount,
      });
      const addCollectionPane = explorer.addCollectionPane as AddCollectionPane;
      addCollectionPane.partitionKey("/blah");
      expect(addCollectionPane.isValid()).toBe(true);
    });

    it("should be false if graph API and partition key is /id or /label", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableGremlin" }],
          },
        } as DatabaseAccount,
      });
      const addCollectionPane = explorer.addCollectionPane as AddCollectionPane;
      addCollectionPane.partitionKey("/id");
      expect(addCollectionPane.isValid()).toBe(false);

      addCollectionPane.partitionKey("/label");
      expect(addCollectionPane.isValid()).toBe(false);
    });

    it("should be true for any non-graph API with /id or /label partition key", () => {
      updateUserContext({});
      const addCollectionPane = explorer.addCollectionPane as AddCollectionPane;

      addCollectionPane.partitionKey("/id");
      expect(addCollectionPane.isValid()).toBe(true);

      addCollectionPane.partitionKey("/label");
      expect(addCollectionPane.isValid()).toBe(true);
    });

    it("should display free tier text in upsell messaging", () => {
      explorer.databaseAccount(mockFreeTierDatabaseAccount);
      const addCollectionPane = explorer.addCollectionPane as AddCollectionPane;
      expect(addCollectionPane.isFreeTierAccount()).toBe(true);
      expect(addCollectionPane.upsellMessage()).toContain("With free tier");
      expect(addCollectionPane.upsellAnchorUrl()).toBe(Constants.Urls.freeTierInformation);
      expect(addCollectionPane.upsellAnchorText()).toBe("Learn more");
    });

    it("should display standard texr in upsell messaging", () => {
      explorer.databaseAccount(mockDatabaseAccount);
      const addCollectionPane = explorer.addCollectionPane as AddCollectionPane;
      expect(addCollectionPane.isFreeTierAccount()).toBe(false);
      expect(addCollectionPane.upsellMessage()).toContain("Start at");
      expect(addCollectionPane.upsellAnchorUrl()).toBe(Constants.Urls.cosmosPricing);
      expect(addCollectionPane.upsellAnchorText()).toBe("More details");
    });
  });
});
