import * as Constants from "../Common/Constants";
import { DatabaseAccount } from "../Contracts/DataModels";
import { updateUserContext } from "../UserContext";
import { isHotPartitionKeyThrottlingEnabled } from "./CapabilityUtils";

describe("CapabilityUtils", () => {
  describe("isHotPartitionKeyThrottlingEnabled", () => {
    it("returns true for a SQL account with the EnableHotPartitionKeyThrottling capability", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: Constants.CapabilityNames.EnableHotPartitionKeyThrottling }],
          },
        } as DatabaseAccount,
      });

      expect(isHotPartitionKeyThrottlingEnabled()).toBe(true);
    });

    it("returns false for a SQL account without the capability", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: Constants.CapabilityNames.EnableAutoScale }],
          },
        } as DatabaseAccount,
      });

      expect(isHotPartitionKeyThrottlingEnabled()).toBe(false);
    });

    it("returns false for a non-SQL account even with the capability", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [
              { name: Constants.CapabilityNames.EnableCassandra },
              { name: Constants.CapabilityNames.EnableHotPartitionKeyThrottling },
            ],
          },
        } as DatabaseAccount,
      });

      expect(isHotPartitionKeyThrottlingEnabled()).toBe(false);
    });
  });
});
