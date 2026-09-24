jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");
import ko from "knockout";
import { AuthType } from "../../AuthType";
import { CreateCollectionParams, DatabaseAccount } from "../../Contracts/DataModels";
import { Database } from "../../Contracts/ViewModels";
import { useDatabases } from "../../Explorer/useDatabases";
import { updateUserContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { constructRpOptions, createCollection } from "./createCollection";
import { FullTextPolicy, Collection } from "Contracts/DataModels";
import { handleError } from "Common/ErrorHandlingUtils";
import { userContext } from "UserContext";
import { readCollections } from "./readCollections";
import { updateCollection } from "./updateCollection";
import { fullTextLanguages } from "Explorer/Controls/FullTextSeach/FullTextPolicyUtils";

jest.mock("Common/ErrorHandlingUtils", () => ({ handleError: jest.fn() }));

describe("createCollection", () => {
  const createCollectionParams: CreateCollectionParams = {
    createNewDatabase: false,
    collectionId: "testContainer",
    databaseId: "testDatabase",
    databaseLevelThroughput: true,
    offerThroughput: 400,
  };

  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test",
      } as DatabaseAccount,
      apiType: "SQL",
    });
    useDatabases.setState({
      databases: [
        {
          id: ko.observable("testDatabase"),
          loadCollections: () => undefined,
          collections: ko.observableArray([]),
        } as Database,
      ],
    });
  });

  describe("full-text policy transport", () => {
    const policy: FullTextPolicy = {
      defaultLanguage: "en-US",
      package: "standard",
      defaultSpec: {
        language: "en-US",
        stopWordListKind: "basic",
        addStopWords: ["Cosmos", "cosmos"],
        removeStopWords: ["the"],
        tokenizer: "word",
        filters: ["lowercase", "stop"],
        futureSetting: { preserved: true },
      },
      fullTextPaths: [{ path: "/text" }, { path: "/other", language: "fr-FR", stopWordListKind: "none" }],
      futurePolicySetting: "preserved",
    };
    const resource: Partial<Collection> = {
      id: "container",
      fullTextPolicy: policy,
      indexingPolicy: {
        automatic: true,
        indexingMode: "consistent",
        includedPaths: [],
        excludedPaths: [],
        fullTextIndexes: [{ path: "/text" }],
      },
    };
    const sdkCreate = jest.fn();
    const sdkReplace = jest.fn();
    const sdkRead = jest.fn();

    beforeEach(() => {
      jest.resetAllMocks();
      updateUserContext({
        apiType: "SQL",
        databaseAccount: { name: "account" } as DatabaseAccount,
        subscriptionId: "subscription",
        resourceGroup: "group",
        features: { ...userContext.features, enableSDKoperations: false },
      });
      useDatabases.setState({ validateCollectionId: jest.fn().mockResolvedValue(true) });
      sdkCreate.mockResolvedValue({ resource });
      sdkReplace.mockResolvedValue({ resource });
      sdkRead.mockResolvedValue({ resources: [resource] });
      const database = {
        containers: { create: sdkCreate, readAll: () => ({ fetchAll: sdkRead }) },
        container: () => ({ replace: sdkReplace }),
      };
      (client as jest.Mock).mockReturnValue({
        databases: { createIfNotExists: jest.fn().mockResolvedValue({ database }) },
        database: () => database,
      });
      jest.mocked(armRequest).mockResolvedValue({ properties: { resource } });
    });

    it.each([AuthType.AAD, AuthType.MasterKey])(
      "preserves policy creation and dedicated indexes through %s",
      async (authType) => {
        updateUserContext({ authType });
        const result = await createCollection({
          createNewDatabase: false,
          databaseId: "database",
          collectionId: "container",
          databaseLevelThroughput: false,
          offerThroughput: 400,
          fullTextPolicy: policy,
          indexingPolicy: resource.indexingPolicy,
        });
        expect(result.fullTextPolicy).toEqual(policy);
        const payload =
          authType === AuthType.AAD
            ? (armRequest as jest.Mock).mock.lastCall[0].body.properties.resource
            : sdkCreate.mock.lastCall[0];
        expect(payload).toMatchObject({ fullTextPolicy: policy, indexingPolicy: resource.indexingPolicy });
        const throughput =
          authType === AuthType.AAD
            ? (armRequest as jest.Mock).mock.lastCall[0].body.properties.options.throughput
            : sdkCreate.mock.lastCall[0].throughput;
        expect(throughput).toBe(400);
      },
    );

    it.each([AuthType.AAD, AuthType.MasterKey])(
      "preserves analysis through read and unrelated update with %s",
      async (authType) => {
        updateUserContext({ authType });
        jest.mocked(armRequest).mockResolvedValueOnce({ value: [{ properties: { resource } }] });
        expect((await readCollections("database"))[0].fullTextPolicy).toEqual(policy);
        jest.mocked(armRequest).mockResolvedValue({ properties: { resource } });
        await updateCollection("database", "container", { ...resource, defaultTtl: 123 });
        const payload =
          authType === AuthType.AAD
            ? (armRequest as jest.Mock).mock.lastCall[0].body.properties.resource
            : sdkReplace.mock.lastCall[0];
        expect(payload).toEqual({ ...resource, defaultTtl: 123 });
      },
    );

    it.each([AuthType.AAD, AuthType.MasterKey])(
      "surfaces a rejected indexed-policy update with %s",
      async (authType) => {
        updateUserContext({ authType });
        const failure = new Error("Cannot change analysis for an indexed path");
        jest.mocked(armRequest).mockResolvedValueOnce({ properties: { resource } }).mockRejectedValueOnce(failure);
        sdkReplace.mockRejectedValueOnce(failure);
        await expect(updateCollection("database", "container", resource)).rejects.toBe(failure);
        expect(handleError).toHaveBeenCalledWith(failure, "UpdateCollection", expect.any(String));
        expect(resource.fullTextPolicy).toEqual(policy);
      },
    );

    it.each(
      fullTextLanguages.flatMap(({ value }) =>
        [AuthType.AAD, AuthType.MasterKey].map((authType) => ({ language: value, authType })),
      ),
    )("preserves 20-word $language policies through $authType create/read/update", async ({ language, authType }) => {
      const words = Array.from({ length: 20 }, (_, index) => ["catalog", "Catalog", "caf\u00e9", "catalog"][index % 4]);
      const localized = {
        ...policy,
        defaultLanguage: language,
        defaultSpec: { ...policy.defaultSpec, language, addStopWords: words, removeStopWords: words },
      };
      const current = { ...resource, fullTextPolicy: localized };
      updateUserContext({ authType });
      sdkCreate.mockResolvedValue({ resource: current });
      sdkRead.mockResolvedValue({ resources: [current] });
      sdkReplace.mockResolvedValue({ resource: current });
      jest.mocked(armRequest).mockResolvedValue({ properties: { resource: current } });
      const created = await createCollection({
        createNewDatabase: false,
        databaseId: "database",
        collectionId: "container",
        databaseLevelThroughput: false,
        offerThroughput: 400,
        fullTextPolicy: localized,
        indexingPolicy: current.indexingPolicy,
      });
      expect(created.fullTextPolicy).toEqual(localized);
      const createPayload =
        authType === AuthType.AAD ? jest.mocked(armRequest).mock.lastCall[0].body : sdkCreate.mock.lastCall[0];
      expect(createPayload).toMatchObject(
        authType === AuthType.AAD
          ? { properties: { resource: { fullTextPolicy: localized } } }
          : { fullTextPolicy: localized },
      );
      if (authType === AuthType.AAD) {
        jest.mocked(armRequest).mockResolvedValueOnce({ value: [{ properties: { resource: current } }] });
      }
      expect((await readCollections("database"))[0].fullTextPolicy).toEqual(localized);
      jest.mocked(armRequest).mockResolvedValue({ properties: { resource: current } });
      await updateCollection("database", "container", { ...current, defaultTtl: 123 });
      const updatePayload =
        authType === AuthType.AAD ? jest.mocked(armRequest).mock.lastCall[0].body : sdkReplace.mock.lastCall[0];
      expect(updatePayload).toMatchObject(
        authType === AuthType.AAD
          ? { properties: { resource: { ...current, defaultTtl: 123 } } }
          : { ...current, defaultTtl: 123 },
      );
    });
  });

  it("should call ARM if logged in with AAD", async () => {
    updateUserContext({
      authType: AuthType.AAD,
    });
    await createCollection(createCollectionParams);
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    updateUserContext({
      authType: AuthType.MasterKey,
    });
    (client as jest.Mock).mockReturnValue({
      databases: {
        createIfNotExists: () => {
          return {
            database: {
              containers: {
                create: () => ({}),
              },
            },
          };
        },
      },
    });
    await createCollection(createCollectionParams);
    expect(client).toHaveBeenCalled();
  });

  it("constructRpOptions should return the correct options", () => {
    expect(constructRpOptions(createCollectionParams)).toEqual({});

    const manualThroughputParams: CreateCollectionParams = {
      createNewDatabase: false,
      collectionId: "testContainer",
      databaseId: "testDatabase",
      databaseLevelThroughput: false,
      offerThroughput: 400,
    };
    expect(constructRpOptions(manualThroughputParams)).toEqual({ throughput: 400 });

    const autoPilotThroughputParams: CreateCollectionParams = {
      createNewDatabase: false,
      collectionId: "testContainer",
      databaseId: "testDatabase",
      databaseLevelThroughput: false,
      offerThroughput: 400,
      autoPilotMaxThroughput: 4000,
    };
    expect(constructRpOptions(autoPilotThroughputParams)).toEqual({
      autoscaleSettings: {
        maxThroughput: 4000,
      },
    });
  });
});
