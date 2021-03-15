import * as Constants from "../../Common/Constants";
import Explorer from "../Explorer";

describe("Settings Pane", () => {
  describe("shouldShowQueryPageOptions()", () => {
    let explorer: Explorer;

    beforeEach(() => {
      explorer = new Explorer();
    });

    it("should be true for SQL API", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.DocumentDB.toLowerCase());
      expect(explorer.settingsPane.shouldShowQueryPageOptions()).toBe(true);
    });

    it("should be false for Cassandra API", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.Cassandra.toLowerCase());
      expect(explorer.settingsPane.shouldShowQueryPageOptions()).toBe(false);
    });

    it("should be false for Tables API", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.Table.toLowerCase());
      expect(explorer.settingsPane.shouldShowQueryPageOptions()).toBe(false);
    });

    it("should be false for Graph API", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.Graph.toLowerCase());
      expect(explorer.settingsPane.shouldShowQueryPageOptions()).toBe(false);
    });

    it("should be false for Mongo API", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.MongoDB.toLowerCase());
      expect(explorer.settingsPane.shouldShowQueryPageOptions()).toBe(false);
    });
  });
});
