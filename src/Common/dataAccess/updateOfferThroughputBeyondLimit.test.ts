import { updateOfferThroughputBeyondLimit } from "./updateOfferThroughputBeyondLimit";

describe("updateOfferThroughputBeyondLimit", () => {
  it("should call fetch", async () => {
    window.fetch = jest.fn(() => {
      return {
        ok: true
      };
    });
    window.dataExplorer = {
      logConsoleData: jest.fn(),
      deleteInProgressConsoleDataWithId: jest.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    await updateOfferThroughputBeyondLimit({
      subscriptionId: "foo",
      resourceGroup: "foo",
      databaseAccountName: "foo",
      databaseName: "foo",
      throughput: 1000000000,
      offerIsRUPerMinuteThroughputEnabled: false
    });
    expect(window.fetch).toHaveBeenCalled();
  });
});
