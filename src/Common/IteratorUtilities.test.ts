import { nextPage } from "./IteratorUtilities";

describe("nextPage", () => {
  it("returns results for the next page", async () => {
    const fakeIterator = {
      fetchNext: () =>
        Promise.resolve({
          resources: [],
          hasMoreResults: false,
          continuation: "foo",
          queryMetrics: {},
          requestCharge: 1,
          headers: {},
          activityId: "foo",
        }),
    };

    expect(await nextPage(fakeIterator, 10)).toMatchSnapshot();
  });
});
