jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { Platform, updateConfigContext } from "../../ConfigContext";
import { Collection, DatabaseAccount } from "../../Contracts/DataModels";
import { CosmosDbArtifactType } from "../../Contracts/FabricMessagesContract";
import { updateUserContext, userContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { readCollections, readCollectionsWithPagination } from "./readCollections";

describe("readCollections", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test",
      } as DatabaseAccount,
      apiType: "SQL",
    });
  });

  describe("Fabric collection prefetch", () => {
    const collection: Collection = { id: "items", _rid: "rid", _self: "self", _etag: "etag", _ts: 1 };
    const fetchAll = jest.fn();
    const fetchNext = jest.fn();
    const query = jest.fn(() => ({ fetchNext }));

    beforeEach(() => {
      jest.clearAllMocks();
      updateConfigContext({ platform: Platform.Fabric });
      updateUserContext({
        authType: AuthType.AAD,
        apiType: "SQL",
        fabricContext: {
          artifactType: CosmosDbArtifactType.NATIVE,
          artifactInfo: undefined,
          databaseName: "database",
          fabricClientRpcVersion: "FabricMessageV3",
          isReadOnly: false,
          isVisible: true,
          initialCollections: [collection],
        },
      });
      fetchAll.mockResolvedValue({ resources: [{ ...collection, id: "fresh" }] });
      fetchNext.mockResolvedValue({ resources: [{ ...collection, id: "page" }], continuationToken: "next" });
      (client as jest.Mock).mockReturnValue({
        database: () => ({
          containers: {
            readAll: () => ({ fetchAll }),
            query,
          },
        }),
      });
    });

    afterEach(() => {
      updateUserContext({ fabricContext: undefined });
      updateConfigContext({ platform: Platform.Portal });
    });

    it("consumes the snapshot once and fetches live data on refresh", async () => {
      await expect(readCollections("database")).resolves.toEqual([collection]);
      expect(client).not.toHaveBeenCalled();
      expect(userContext.fabricContext.initialCollections).toBeUndefined();
      await expect(readCollections("database")).resolves.toEqual([{ ...collection, id: "fresh" }]);
      expect(fetchAll).toHaveBeenCalledTimes(1);
    });

    it("uses an empty snapshot without fetching", async () => {
      userContext.fabricContext.initialCollections = [];
      await expect(readCollections("database")).resolves.toEqual([]);
      expect(client).not.toHaveBeenCalled();
    });

    it("falls back for older hosts or failed prefetches", async () => {
      userContext.fabricContext.initialCollections = undefined;
      await expect(readCollections("database")).resolves.toEqual([{ ...collection, id: "fresh" }]);
      expect(fetchAll).toHaveBeenCalledTimes(1);
    });

    it("does not use another database's snapshot", async () => {
      await expect(readCollections("other")).resolves.toEqual([{ ...collection, id: "fresh" }]);
      expect(userContext.fabricContext.initialCollections).toEqual([collection]);
      await expect(readCollections("database")).resolves.toEqual([collection]);
    });

    it("does not use native prefetch for mirrored artifacts", async () => {
      userContext.fabricContext.artifactType = CosmosDbArtifactType.MIRRORED_AAD;
      await expect(readCollections("database")).resolves.toEqual([{ ...collection, id: "fresh" }]);
    });

    it("uses a single-page snapshot with pagination enabled", async () => {
      await expect(readCollectionsWithPagination("database")).resolves.toEqual({
        collections: [collection],
        continuationToken: undefined,
      });
      expect(client).not.toHaveBeenCalled();
      await expect(readCollectionsWithPagination("database")).resolves.toEqual({
        collections: [{ ...collection, id: "page" }],
        continuationToken: "next",
      });
      expect(fetchNext).toHaveBeenCalledTimes(1);
    });

    it("uses a snapshot at the 50-container page boundary", async () => {
      const collections = Array.from({ length: 50 }, (_, i) => ({ ...collection, id: `${i}` }));
      userContext.fabricContext.initialCollections = collections;
      const result = await readCollectionsWithPagination("database");
      expect(result).toEqual({ collections, continuationToken: undefined });
      expect(fetchNext).not.toHaveBeenCalled();
    });

    it("retains SDK paging when the snapshot exceeds 50 containers", async () => {
      userContext.fabricContext.initialCollections = Array.from({ length: 51 }, (_, i) => ({
        ...collection,
        id: `${i}`,
      }));
      const result = await readCollectionsWithPagination("database");
      expect(query).toHaveBeenCalledWith(
        { query: "SELECT * FROM c" },
        { continuationToken: undefined, maxItemCount: 50 },
      );
      expect(result.continuationToken).toBe("next");
      expect(userContext.fabricContext.initialCollections).toBeUndefined();
      await expect(readCollections("database")).resolves.toEqual([{ ...collection, id: "fresh" }]);
    });

    it("never substitutes the initial snapshot for a continuation page", async () => {
      await readCollectionsWithPagination("database", "existing");
      expect(query).toHaveBeenCalledWith(
        { query: "SELECT * FROM c" },
        { continuationToken: "existing", maxItemCount: 50 },
      );
      expect(userContext.fabricContext.initialCollections).toBeUndefined();
    });
  });

  it("should call ARM if logged in with AAD", async () => {
    updateUserContext({
      authType: AuthType.AAD,
    });
    await readCollections("database");
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    updateUserContext({
      authType: AuthType.MasterKey,
    });
    (client as jest.Mock).mockReturnValue({
      database: () => {
        return {
          containers: {
            readAll: () => {
              return {
                fetchAll: (): unknown => [],
              };
            },
          },
        };
      },
    });
    await readCollections("database");
    expect(client).toHaveBeenCalled();
  });
});
