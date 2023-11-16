import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import { getCommonQueryOptions, getQueryRetryOptions } from "./queryDocuments";

describe("getCommonQueryOptions", () => {
  it("builds the correct default options objects", () => {
    expect(getCommonQueryOptions({})).toMatchSnapshot();
  });
  it("reads from localStorage", () => {
    LocalStorageUtility.setEntryNumber(StorageKey.ActualItemPerPage, 37);
    LocalStorageUtility.setEntryNumber(StorageKey.MaxDegreeOfParellism, 17);
    expect(getCommonQueryOptions({})).toMatchSnapshot();
  });
});

describe("getQueryRetryOptions", () => {
  it("builds the correct default options objects", () => {
    LocalStorageUtility.getEntryNumber(StorageKey.MaxWaitTime);
    LocalStorageUtility.getEntryNumber(StorageKey.RetryAttempts);
    LocalStorageUtility.getEntryNumber(StorageKey.RetryInterval);
    expect(
      getQueryRetryOptions({
        maxRetryAttemptCount: 9,
        fixedRetryIntervalInMilliseconds: 5000,
        maxWaitTimeInSeconds: 30,
      }),
    ).toMatchSnapshot();
  });
  it("reads from localStorage", () => {
    LocalStorageUtility.setEntryNumber(StorageKey.MaxWaitTime, 5);
    LocalStorageUtility.setEntryNumber(StorageKey.RetryAttempts, 1);
    LocalStorageUtility.setEntryNumber(StorageKey.RetryInterval, 1000);
    expect(
      getQueryRetryOptions({
        maxRetryAttemptCount: 5,
        fixedRetryIntervalInMilliseconds: 1000,
        maxWaitTimeInSeconds: 1,
      }),
    ).toMatchSnapshot();
  });
});
