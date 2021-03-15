import { LocalStorageUtility, SessionStorageUtility, StorageKey } from "./StorageUtility";

describe("Storage Utility", () => {
  beforeAll(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should find a value that exist in local storage", () => {
    localStorage.setItem(StorageKey[StorageKey.ActualItemPerPage], "123");
    expect(LocalStorageUtility.hasItem(StorageKey.ActualItemPerPage)).toBe(true);
  });

  it("should not find a value that does not exist in local storage", () => {
    expect(LocalStorageUtility.hasItem(StorageKey.ActualItemPerPage)).toBe(false);
  });

  it("should place the string key/value pair into local storage", () => {
    LocalStorageUtility.setEntryString(StorageKey.ActualItemPerPage, "abc");
    expect(localStorage.getItem(StorageKey[StorageKey.ActualItemPerPage])).toEqual("abc");
  });

  it("should place the number key/value pair into local storage as a string", () => {
    LocalStorageUtility.setEntryNumber(StorageKey.ActualItemPerPage, 123);
    expect(localStorage.getItem(StorageKey[StorageKey.ActualItemPerPage])).toEqual("123");
  });

  it("should retrieve the string value", () => {
    localStorage.setItem(StorageKey[StorageKey.ActualItemPerPage], "123");
    expect(LocalStorageUtility.getEntryString(StorageKey.ActualItemPerPage)).toEqual("123");
  });

  it("should retrieve the string value and convert to number", () => {
    localStorage.setItem(StorageKey[StorageKey.ActualItemPerPage], "123");
    const result = LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage);
    expect(Number(result)).toEqual(123);
  });

  it("should remove the entry from local storage if exists", () => {
    localStorage.setItem(StorageKey[StorageKey.ActualItemPerPage], "123");
    LocalStorageUtility.removeEntry(StorageKey.ActualItemPerPage);

    expect(LocalStorageUtility.getEntryString(StorageKey.ActualItemPerPage)).toBeNull();
  });

  it("should remove the entry from session storage if exists", () => {
    sessionStorage.setItem(StorageKey[StorageKey.ActualItemPerPage], "123");
    SessionStorageUtility.removeEntry(StorageKey.ActualItemPerPage);

    expect(LocalStorageUtility.getEntryString(StorageKey.ActualItemPerPage)).toBeNull();
  });
});
