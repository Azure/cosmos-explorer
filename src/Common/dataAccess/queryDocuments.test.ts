import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import { getCommonQueryOptions } from "./queryDocuments";

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
