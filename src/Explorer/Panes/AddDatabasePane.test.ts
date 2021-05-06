import * as Constants from "../../Common/Constants";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { SubscriptionType } from "../../Contracts/SubscriptionType";
import { updateUserContext } from "../../UserContext";
import Explorer from "../Explorer";
import AddDatabasePane from "./AddDatabasePane";

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
};

describe("Add Database Pane", () => {
  describe("getSharedThroughputDefault()", () => {
    it("should be true if subscription type is Benefits", () => {
      updateUserContext({
        subscriptionType: SubscriptionType.Benefits,
      });
      const explorer = new Explorer();
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be false if subscription type is EA", () => {
      updateUserContext({
        subscriptionType: SubscriptionType.EA,
      });
      const explorer = new Explorer();
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(false);
    });

    it("should be true if subscription type is Free", () => {
      updateUserContext({
        subscriptionType: SubscriptionType.Free,
      });
      const explorer = new Explorer();
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be true if subscription type is Internal", () => {
      updateUserContext({
        subscriptionType: SubscriptionType.Internal,
      });
      const explorer = new Explorer();
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be true if subscription type is PAYG", () => {
      updateUserContext({
        subscriptionType: SubscriptionType.PAYG,
      });
      const explorer = new Explorer();
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should display free tier text in upsell messaging", () => {
      updateUserContext({ databaseAccount: mockFreeTierDatabaseAccount });
      const explorer = new Explorer();
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.isFreeTierAccount()).toBe(true);
      expect(addDatabasePane.upsellMessage()).toContain("With free tier");
      expect(addDatabasePane.upsellAnchorUrl()).toBe(Constants.Urls.freeTierInformation);
      expect(addDatabasePane.upsellAnchorText()).toBe("Learn more");
    });

    it("should display standard texr in upsell messaging", () => {
      updateUserContext({ databaseAccount: mockDatabaseAccount });
      const explorer = new Explorer();
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.isFreeTierAccount()).toBe(false);
      expect(addDatabasePane.upsellMessage()).toContain("Start at");
      expect(addDatabasePane.upsellAnchorUrl()).toBe(Constants.Urls.cosmosPricing);
      expect(addDatabasePane.upsellAnchorText()).toBe("More details");
    });
  });
});
