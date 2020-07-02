import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import AddDatabasePane from "./AddDatabasePane";

describe("Add Database Pane", () => {
  describe("getSharedThroughputDefault()", () => {
    let explorer: ViewModels.Explorer;

    beforeEach(() => {
      explorer = new Explorer({
        documentClientUtility: null,
        notificationsClient: null,
        isEmulator: false,
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
  });
});
