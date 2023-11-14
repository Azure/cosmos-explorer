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
    expect(getQueryRetryOptions({})).toMatchSnapshot();
  });
  it("reads from localStorage", () => {
    LocalStorageUtility.setEntryNumber(StorageKey.MaxWaitTime, 5);
    LocalStorageUtility.setEntryNumber(StorageKey.RetryAttempts, 1);
    LocalStorageUtility.setEntryNumber(StorageKey.RetryInterval, 5000);
    expect(getQueryRetryOptions({})).toMatchSnapshot();
  });
});
