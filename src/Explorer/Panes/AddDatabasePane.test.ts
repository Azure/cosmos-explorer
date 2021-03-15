import * as Constants from "../../Common/Constants";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { SubscriptionType } from "../../Contracts/SubscriptionType";
import Explorer from "../Explorer";
import AddDatabasePane from "./AddDatabasePane";

describe("Add Database Pane", () => {
  describe("getSharedThroughputDefault()", () => {
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

    it("should be true if subscription type is Benefits", () => {
      explorer.subscriptionType(SubscriptionType.Benefits);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be false if subscription type is EA", () => {
      explorer.subscriptionType(SubscriptionType.EA);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(false);
    });

    it("should be true if subscription type is Free", () => {
      explorer.subscriptionType(SubscriptionType.Free);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be true if subscription type is Internal", () => {
      explorer.subscriptionType(SubscriptionType.Internal);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be true if subscription type is PAYG", () => {
      explorer.subscriptionType(SubscriptionType.PAYG);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should display free tier text in upsell messaging", () => {
      explorer.databaseAccount(mockFreeTierDatabaseAccount);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.isFreeTierAccount()).toBe(true);
      expect(addDatabasePane.upsellMessage()).toContain("With free tier");
      expect(addDatabasePane.upsellAnchorUrl()).toBe(Constants.Urls.freeTierInformation);
      expect(addDatabasePane.upsellAnchorText()).toBe("Learn more");
    });

    it("should display standard texr in upsell messaging", () => {
      explorer.databaseAccount(mockDatabaseAccount);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.isFreeTierAccount()).toBe(false);
      expect(addDatabasePane.upsellMessage()).toContain("Start at");
      expect(addDatabasePane.upsellAnchorUrl()).toBe(Constants.Urls.cosmosPricing);
      expect(addDatabasePane.upsellAnchorText()).toBe("More details");
    });
  });
});
