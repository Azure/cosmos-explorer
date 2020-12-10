import { getCommonQueryOptions } from "./DataAccessUtilityBase";
import { LocalStorageUtility, StorageKey } from "../Shared/StorageUtility";

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
