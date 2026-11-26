import { AuthType } from "AuthType";
import { DatabaseAccount, Offer, ReadCollectionOfferParams, UpdateOfferParams } from "Contracts/DataModels";
import { Keys, t } from "Localization";
import { updateUserContext, userContext } from "UserContext";
import { updateSqlContainerThroughput } from "Utils/arm/generatedClients/cosmos/sqlResources";
import { logConsoleInfo } from "Utils/NotificationConsoleUtils";

jest.mock("Platform/Fabric/FabricUtil", () => ({ isFabric: () => false }));
jest.mock("Utils/arm/generatedClients/cosmos/sqlResources");
jest.mock("Utils/NotificationConsoleUtils", () => ({
  logConsoleProgress: () => jest.fn(),
  logConsoleInfo: jest.fn(),
}));
jest.mock("../ErrorHandlingUtils", () => ({ handleError: jest.fn() }));
jest.mock("./readCollectionOffer", () => ({ readCollectionOffer: jest.fn() }));

// Keep legacy data-access modules outside this test's strict compilation graph.
const { updateOffer } = jest.requireActual<{
  updateOffer: (params: UpdateOfferParams) => Promise<Offer>;
}>("./updateOffer");
const { readCollectionOffer } = jest.requireMock<{
  readCollectionOffer: jest.Mock<Promise<Offer>, [ReadCollectionOfferParams]>;
}>("./readCollectionOffer");

describe("updateOffer success notifications", () => {
  const policy = { maximumPerPartitionKeyThroughputUtilizationPercent: 85 };
  const currentOffer: Offer = {
    id: "offer",
    autoscaleMaxThroughput: 4000,
    manualThroughput: undefined,
    minimumThroughput: 400,
    offerReplacePending: false,
  };
  const params: UpdateOfferParams = {
    currentOffer,
    databaseId: "database",
    collectionId: "container",
    autopilotThroughput: 4000,
    manualThroughput: 0,
  };

  beforeAll(() => {
    updateUserContext({
      databaseAccount: { name: "account" } as DatabaseAccount,
      subscriptionId: "subscription",
      resourceGroup: "resource-group",
      authType: AuthType.AAD,
      features: { ...userContext.features, enableSDKoperations: false },
    });
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(readCollectionOffer).mockResolvedValue(currentOffer);
  });

  it.each([
    { change: "enabling", baseline: null, updatedPolicy: policy, policyChanged: true },
    { change: "disabling", baseline: policy, updatedPolicy: null, policyChanged: true },
    {
      change: "changing the rate",
      baseline: policy,
      updatedPolicy: { maximumPerPartitionKeyThroughputUtilizationPercent: 90 },
      policyChanged: true,
    },
    { change: "keeping the same policy", baseline: policy, updatedPolicy: { ...policy }, policyChanged: false },
    { change: "omitting the policy", baseline: policy, updatedPolicy: undefined, policyChanged: false },
    { change: "keeping the policy disabled", baseline: undefined, updatedPolicy: null, policyChanged: false },
  ])(
    "preserves the offer notification and conditionally adds policy guidance when $change",
    async ({ baseline, updatedPolicy, policyChanged }) => {
      await updateOffer({
        ...params,
        currentOffer: { ...currentOffer, hotPartitionKeyRateLimitingPolicy: baseline },
        hotPartitionKeyRateLimitingPolicy: updatedPolicy,
      });

      expect(jest.mocked(logConsoleInfo).mock.calls).toEqual([
        ["Successfully updated offer for collection container"],
        ...(policyChanged ? [[t(Keys.controls.settings.scale.rateLimitPolicySaveMessage)]] : []),
      ]);
    },
  );

  it("waits for the update to complete before notifying the user", async () => {
    let resolveRead!: (offer: Offer) => void;
    jest.mocked(readCollectionOffer).mockReturnValueOnce(
      new Promise<Offer>((resolve) => {
        resolveRead = resolve;
      }),
    );

    const save = updateOffer({ ...params, hotPartitionKeyRateLimitingPolicy: policy });
    expect(logConsoleInfo).not.toHaveBeenCalled();

    resolveRead({ ...currentOffer, hotPartitionKeyRateLimitingPolicy: policy });
    await save;

    expect(logConsoleInfo).toHaveBeenCalledTimes(2);
    expect(logConsoleInfo).toHaveBeenNthCalledWith(1, "Successfully updated offer for collection container");
    expect(logConsoleInfo).toHaveBeenNthCalledWith(2, t(Keys.controls.settings.scale.rateLimitPolicySaveMessage));
  });

  it("does not emit a success notification when the update fails", async () => {
    const error = new Error("Policy update failed");
    jest.mocked(updateSqlContainerThroughput).mockRejectedValueOnce(error);

    await expect(updateOffer({ ...params, hotPartitionKeyRateLimitingPolicy: policy })).rejects.toThrow(error);

    expect(logConsoleInfo).not.toHaveBeenCalled();
  });
});
