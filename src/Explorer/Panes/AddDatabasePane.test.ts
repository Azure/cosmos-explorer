import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import AddDatabasePane from "./AddDatabasePane";

describe("Add Database Pane", () => {
  describe("getSharedThroughputDefault()", () => {
    let explorer: ViewModels.Explorer;
    const mockDatabaseAccount: ViewModels.DatabaseAccount = {
      id: "mock",
      kind: "DocumentDB",
      location: "",
      name: "mock",
      properties: {
        documentEndpoint: "",
        cassandraEndpoint: "",
        gremlinEndpoint: "",
        tableEndpoint: "",
        enableFreeTier: false
      },
      type: undefined,
      tags: []
    };

    const mockFreeTierDatabaseAccount: ViewModels.DatabaseAccount = {
      id: "mock",
      kind: "DocumentDB",
      location: "",
      name: "mock",
      properties: {
        documentEndpoint: "",
        cassandraEndpoint: "",
        gremlinEndpoint: "",
        tableEndpoint: "",
        enableFreeTier: true
      },
      type: undefined,
      tags: []
    };

    beforeEach(() => {
      explorer = new Explorer({
        documentClientUtility: null,
        notificationsClient: null,
        isEmulator: false
      });
    });

    it("should be true if subscription type is Benefits", () => {
      explorer.subscriptionType(ViewModels.SubscriptionType.Benefits);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be false if subscription type is EA", () => {
      explorer.subscriptionType(ViewModels.SubscriptionType.EA);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(false);
    });

    it("should be true if subscription type is Free", () => {
      explorer.subscriptionType(ViewModels.SubscriptionType.Free);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be true if subscription type is Internal", () => {
      explorer.subscriptionType(ViewModels.SubscriptionType.Internal);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should be true if subscription type is PAYG", () => {
      explorer.subscriptionType(ViewModels.SubscriptionType.PAYG);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.getSharedThroughputDefault()).toBe(true);
    });

    it("should display free tier text in upsell messaging", () => {
      explorer.databaseAccount(mockFreeTierDatabaseAccount);
      const addDatabasePane = explorer.addDatabasePane as AddDatabasePane;
      expect(addDatabasePane.isFreeTierAccount()).toBe(true);
      expect(addDatabasePane.upsellMessage()).toContain("With free tier discount");
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
