import {
  AppStateComponentNames,
  createKeyFromPath,
  deleteState,
  loadState,
  MAX_ENTRY_NB,
  saveState,
} from "Shared/AppStatePersistenceUtility";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";

jest.mock("Shared/StorageUtility", () => ({
  LocalStorageUtility: {
    getEntryObject: jest.fn(),
    setEntryObject: jest.fn(),
  },
  StorageKey: {
    AppState: "AppState",
  },
}));

describe("AppStatePersistenceUtility", () => {
  const storePath = {
    componentName: AppStateComponentNames.DocumentsTab,
    subComponentName: "b",
    globalAccountName: "c",
    databaseName: "d",
    containerName: "e",
  };
  const key = createKeyFromPath(storePath);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    (LocalStorageUtility.getEntryObject as jest.Mock).mockReturnValue({
      key0: {
        schemaVersion: 1,
        timestamp: 0,
        data: {},
      },
    });
  });

  describe("saveState()", () => {
    const testState = { aa: 1, bb: "2", cc: [3, 4] };

    it("should save state", () => {
      saveState(storePath, testState);
      expect(LocalStorageUtility.setEntryObject).toHaveBeenCalledTimes(1);
      expect(LocalStorageUtility.setEntryObject).toHaveBeenCalledWith(StorageKey.AppState, expect.any(Object));

      const passedState = (LocalStorageUtility.setEntryObject as jest.Mock).mock.calls[0][1];
      expect(passedState[key].data).toHaveProperty("aa", 1);
    });

    it("should save state with timestamp", () => {
      saveState(storePath, testState);
      const passedState = (LocalStorageUtility.setEntryObject as jest.Mock).mock.calls[0][1];
      expect(passedState[key]).toHaveProperty("timestamp");
      expect(passedState[key].timestamp).toBeGreaterThan(0);
    });

    it("should add state to existing state", () => {
      (LocalStorageUtility.getEntryObject as jest.Mock).mockReturnValue({
        key0: {
          schemaVersion: 1,
          timestamp: 0,
          data: { dd: 5 },
        },
      });

      saveState(storePath, testState);
      const passedState = (LocalStorageUtility.setEntryObject as jest.Mock).mock.calls[0][1];
      expect(passedState["key0"].data).toHaveProperty("dd", 5);
    });

    it("should remove the oldest entry when the number of entries exceeds the limit", () => {
      // Fill up storage with MAX entries
      const currentAppState = {};
      for (let i = 0; i < MAX_ENTRY_NB; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (currentAppState as any)[`key${i}`] = {
          schemaVersion: 1,
          timestamp: i,
          data: {},
        };
      }
      (LocalStorageUtility.getEntryObject as jest.Mock).mockReturnValue(currentAppState);

      saveState(storePath, testState);

      // Verify that the new entry is saved
      const passedState = (LocalStorageUtility.setEntryObject as jest.Mock).mock.calls[0][1];
      expect(passedState[key].data).toHaveProperty("aa", 1);

      // Verify that the oldest entry is removed (smallest timestamp)
      const passedAppState = (LocalStorageUtility.setEntryObject as jest.Mock).mock.calls[0][1];
      expect(Object.keys(passedAppState).length).toBe(MAX_ENTRY_NB);
      expect(passedAppState).not.toHaveProperty("key0");
    });

    it("should not remove the oldest entry when the number of entries does not exceed the limit", () => {
      (LocalStorageUtility.getEntryObject as jest.Mock).mockReturnValue({
        key0: {
          schemaVersion: 1,
          timestamp: 0,
          data: {},
        },
        key1: {
          schemaVersion: 1,
          timestamp: 1,
          data: {},
        },
      });
      saveState(storePath, testState);
      const passedAppState = (LocalStorageUtility.setEntryObject as jest.Mock).mock.calls[0][1];
      expect(Object.keys(passedAppState).length).toBe(3);
    });
  });

  describe("loadState()", () => {
    it("should load state", () => {
      const data = { aa: 1, bb: "2", cc: [3, 4] };
      const testState = {
        [key]: {
          schemaVersion: 1,
          timestamp: 0,
          data,
        },
      };
      (LocalStorageUtility.getEntryObject as jest.Mock).mockReturnValue(testState);
      const state = loadState(storePath);
      expect(state).toEqual(data);
    });

    it("should return undefined if the state is not found", () => {
      (LocalStorageUtility.getEntryObject as jest.Mock).mockReturnValue(null);
      const state = loadState(storePath);
      expect(state).toBeUndefined();
    });
  });

  describe("deleteState()", () => {
    it("should delete state", () => {
      const key = createKeyFromPath(storePath);
      (LocalStorageUtility.getEntryObject as jest.Mock).mockReturnValue({
        [key]: {
          schemaVersion: 1,
          timestamp: 0,
          data: {},
        },
        otherKey: {
          schemaVersion: 2,
          timestamp: 0,
          data: {},
        },
      });

      deleteState(storePath);
      expect(LocalStorageUtility.setEntryObject).toHaveBeenCalledTimes(1);
      const passedAppState = (LocalStorageUtility.setEntryObject as jest.Mock).mock.calls[0][1];
      expect(passedAppState).not.toHaveProperty(key);
      expect(passedAppState).toHaveProperty("otherKey");
    });
  });
  describe("createKeyFromPath()", () => {
    it("should create path that contains all components", () => {
      const key = createKeyFromPath(storePath);
      expect(key).toContain(storePath.componentName);
      expect(key).toContain(storePath.subComponentName);
      expect(key).toContain(storePath.globalAccountName);
      expect(key).toContain(storePath.databaseName);
      expect(key).toContain(storePath.containerName);
    });
  });
});
