import { CapabilityNames } from "Common/Constants";
import { Platform, updateConfigContext } from "ConfigContext";
import { CosmosDbArtifactType } from "Contracts/FabricMessagesContract";
import { TreeNode } from "Explorer/Controls/TreeComponent/TreeNodeComponent";
import Explorer from "Explorer/Explorer";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { DeleteDatabaseConfirmationPanel } from "Explorer/Panes/DeleteDatabaseConfirmationPanel";
import TabsBase from "Explorer/Tabs/TabsBase";
import StoredProcedure from "Explorer/Tree/StoredProcedure";
import Trigger from "Explorer/Tree/Trigger";
import UserDefinedFunction from "Explorer/Tree/UserDefinedFunction";
import {
  createDatabaseTreeNodes,
  createResourceTokenTreeNodes,
  createSampleDataTreeNodes,
} from "Explorer/Tree/treeNodeUtil";
import { useDatabases } from "Explorer/useDatabases";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { FabricContext, updateUserContext, UserContext } from "UserContext";
import PromiseSource from "Utils/PromiseSource";
import { useSidePanel } from "hooks/useSidePanel";
import { useTabs } from "hooks/useTabs";
import ko from "knockout";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";

jest.mock("Explorer/Explorer", () => {
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class MockExplorer {
    onNewCollectionClicked = jest.fn();
  }

  return MockExplorer;
});

jest.mock("Explorer/Tree/StoredProcedure", () => {
  let counter = 0;
  class MockStoredProcedure {
    id: () => string;
    open = jest.fn();
    delete = jest.fn();
    constructor() {
      this.id = () => `mockSproc${counter}`;
      counter++;
    }
  }

  return MockStoredProcedure;
});

jest.mock("Explorer/Tree/UserDefinedFunction", () => {
  let counter = 0;
  class MockUserDefinedFunction {
    id: () => string;
    open = jest.fn();
    delete = jest.fn();
    constructor() {
      this.id = () => `mockUdf${counter}`;
      counter++;
    }
  }

  return MockUserDefinedFunction;
});

jest.mock("Explorer/Tree/Trigger", () => {
  let counter = 0;
  class MockTrigger {
    id: () => string;
    open = jest.fn();
    delete = jest.fn();
    constructor() {
      this.id = () => `mockTrigger${counter}`;
      counter++;
    }
  }

  return MockTrigger;
});

jest.mock("Common/DatabaseAccountUtility", () => {
  return {
    isPublicInternetAccessAllowed: () => true,
    isGlobalSecondaryIndexEnabled: () => false,
  };
});

// Defining this value outside the mock, AND prefixing the name with 'mock' is required by Jest's mocking logic.
let nextTabIndex = 1;
class MockTab extends TabsBase {
  constructor(tabOptions: Pick<ViewModels.TabOptions, "tabKind"> & Partial<ViewModels.TabOptions>) {
    super({
      title: `Mock Tab ${nextTabIndex}`,
      tabPath: `mockTabs/tab${nextTabIndex}`,
      ...tabOptions,
    } as ViewModels.TabOptions);
    nextTabIndex++;
  }

  onActivate = jest.fn();
}

/** A basic test collection that can be expanded on in tests. */
const baseCollection = {
  container: new Explorer(),
  databaseId: "testDatabase",
  id: ko.observable<string>("testCollection"),
  defaultTtl: ko.observable<number>(5),
  analyticalStorageTtl: ko.observable<number>(undefined),
  selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(),
  indexingPolicy: ko.observable<DataModels.IndexingPolicy>({
    automatic: true,
    indexingMode: "consistent",
    includedPaths: [],
    excludedPaths: [],
  }),
  uniqueKeyPolicy: {} as DataModels.UniqueKeyPolicy,
  usageSizeInKB: ko.observable(100),
  offer: ko.observable<DataModels.Offer>({
    autoscaleMaxThroughput: undefined,
    manualThroughput: 10000,
    minimumThroughput: 6000,
    id: "offer",
    offerReplacePending: false,
  }),
  conflictResolutionPolicy: ko.observable<DataModels.ConflictResolutionPolicy>(
    {} as DataModels.ConflictResolutionPolicy,
  ),
  changeFeedPolicy: ko.observable<DataModels.ChangeFeedPolicy>({} as DataModels.ChangeFeedPolicy),
  geospatialConfig: ko.observable<DataModels.GeospatialConfig>({} as DataModels.GeospatialConfig),
  getDatabase: () => {},
  partitionKey: {
    paths: [],
    kind: "hash",
    version: 2,
  },
  materializedViews: ko.observable<DataModels.MaterializedView[]>([
    { id: "view1", _rid: "rid1" },
    { id: "view2", _rid: "rid2" },
  ]),
  materializedViewDefinition: ko.observable<DataModels.MaterializedViewDefinition>({
    definition: "SELECT * FROM c WHERE c.id = 1",
    sourceCollectionId: "source1",
    sourceCollectionRid: "rid123",
  }),
  storedProcedures: ko.observableArray([]),
  userDefinedFunctions: ko.observableArray([]),
  triggers: ko.observableArray([]),
  partitionKeyProperties: ["testPartitionKey"],
  readSettings: () => {},
  isCollectionExpanded: ko.observable(true),
  onSettingsClick: jest.fn(),
  onDocumentDBDocumentsClick: jest.fn(),
  onNewQueryClick: jest.fn(),
  onConflictsClick: jest.fn(),
  onSchemaAnalyzerClick: jest.fn(),
} as unknown as ViewModels.Collection;

/** A basic test database that can be expanded on in tests */
const baseDatabase = {
  container: new Explorer(),
  id: ko.observable<string>("testDatabase"),
  collections: ko.observableArray<ViewModels.Collection>([]),
  isDatabaseShared: ko.pureComputed(() => false),
  isDatabaseExpanded: ko.observable(true),
  selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(),
  expandDatabase: jest.fn().mockResolvedValue({}),
  collapseDatabase: jest.fn(),
  onSettingsClick: jest.fn(),
} as unknown as ViewModels.Database;

/** Configures app state so that useSelectedNode.getState().isDataNodeSelected() returns true for the provided arguments. */
function selectDataNode(
  node: ViewModels.Database | ViewModels.CollectionBase,
  subnodeKind?: ViewModels.CollectionTabKind,
) {
  useSelectedNode.getState().setSelectedNode(node);

  if (subnodeKind !== undefined) {
    node.selectedSubnodeKind(subnodeKind);
    useTabs.getState().activateNewTab(new MockTab({ tabKind: subnodeKind, node }));
  }
}

describe("createSampleDataTreeNodes", () => {
  let sampleDataResourceTokenCollection: ViewModels.Collection;
  let nodes: TreeNode[];

  beforeEach(() => {
    jest.resetAllMocks();
    const collection = { ...baseCollection };
    useDatabases.setState({ sampleDataResourceTokenCollection: collection });
    useSelectedNode.setState({ selectedNode: undefined });

    sampleDataResourceTokenCollection = collection;
    nodes = createSampleDataTreeNodes(sampleDataResourceTokenCollection);
  });

  it("creates the expected tree nodes", () => {
    expect(nodes).toMatchSnapshot();
  });
});

describe("createResourceTokenTreeNodes", () => {
  let resourceTokenCollection: ViewModels.Collection;
  let nodes: TreeNode[];

  beforeEach(() => {
    jest.resetAllMocks();
    const collection = { ...baseCollection };
    useDatabases.setState({ resourceTokenCollection: collection });
    useSelectedNode.setState({ selectedNode: undefined });

    resourceTokenCollection = collection;
    nodes = createResourceTokenTreeNodes(resourceTokenCollection);
  });

  it("returns an empty node when collection is undefined or null", () => {
    const snapshot = `
[
  {
    "children": [],
    "isExpanded": true,
    "label": "",
  },
]
`;
    expect(createResourceTokenTreeNodes(undefined)).toMatchInlineSnapshot(snapshot);
    expect(createResourceTokenTreeNodes(null)).toMatchInlineSnapshot(snapshot);
  });

  it("creates the expected tree nodes", () => {
    expect(nodes).toMatchSnapshot();
  });
});

describe("createDatabaseTreeNodes", () => {
  let explorer: Explorer;
  let standardDb: ViewModels.Database;
  let sharedDb: ViewModels.Database;
  let giganticDb: ViewModels.Database;
  let standardCollection: ViewModels.Collection;
  let sampleItemsCollection: ViewModels.Collection;
  let schemaCollection: ViewModels.Collection;
  let conflictsCollection: ViewModels.Collection;
  let sproc: StoredProcedure;
  let udf: UserDefinedFunction;
  let trigger: Trigger;
  let refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void;

  beforeEach(() => {
    jest.resetAllMocks();
    explorer = new Explorer();
    standardDb = {
      ...baseDatabase,
      id: ko.observable("standardDb"),
      container: explorer,
    } as ViewModels.Database;
    sharedDb = {
      ...baseDatabase,
      id: ko.observable("sharedDatabase"),
      container: explorer,
      isDatabaseShared: ko.pureComputed(() => true),
    } as ViewModels.Database;
    giganticDb = {
      ...baseDatabase,
      id: ko.observable("giganticDatabase"),
      container: explorer,
      collectionsContinuationToken: "continuationToken",
    } as ViewModels.Database;

    standardCollection = {
      ...baseCollection,
      id: ko.observable("standardCollection"),
      container: explorer,
      databaseId: standardDb.id(),
    } as ViewModels.Collection;

    // These classes are mocked, so the constructor args don't matter
    sproc = new StoredProcedure(explorer, standardCollection, {} as never);
    standardCollection.storedProcedures = ko.pureComputed(() => [sproc]);
    udf = new UserDefinedFunction(explorer, standardCollection, {} as never);
    standardCollection.userDefinedFunctions = ko.pureComputed(() => [udf]);
    trigger = new Trigger(explorer, standardCollection, {} as never);
    standardCollection.triggers = ko.pureComputed(() => [trigger]);

    sampleItemsCollection = {
      ...baseCollection,
      id: ko.observable("sampleItemsCollection"),
      container: explorer,
      databaseId: sharedDb.id(),
      isSampleCollection: true,
    } as ViewModels.Collection;

    schemaCollection = {
      ...baseCollection,
      id: ko.observable("schemaCollection"),
      container: explorer,
      databaseId: sharedDb.id(),
      analyticalStorageTtl: ko.observable<number>(5),
      schema: {
        fields: [
          {
            path: "address.street",
            dataType: { name: "string" },
            hasNulls: false,
          },
          {
            path: "address.line2",
            dataType: { name: "string" },
            hasNulls: true,
          },
          {
            path: "address.zip",
            dataType: { name: "number" },
            hasNulls: false,
          },
          {
            path: "orderId",
            dataType: { name: "string" },
            hasNulls: false,
          },
        ],
      } as unknown,
    } as ViewModels.Collection;

    conflictsCollection = {
      ...baseCollection,
      id: ko.observable("conflictsCollection"),
      rawDataModel: {
        conflictResolutionPolicy: {
          mode: "Custom",
          conflictResolutionPath: "path",
          conflictResolutionProcedure: "proc",
        },
      },
    } as ViewModels.Collection;

    standardDb.collections = ko.observableArray([standardCollection, conflictsCollection]);
    sharedDb.collections = ko.observableArray([sampleItemsCollection]);
    giganticDb.collections = ko.observableArray([schemaCollection]);

    useDatabases.setState({
      databases: [standardDb, sharedDb, giganticDb],
      updateDatabase: jest.fn(),
    });
    useSelectedNode.setState({ selectedNode: undefined });

    refreshActiveTab = jest.fn();
  });

  describe("using NoSQL API on Hosted Platform", () => {
    let nodes: TreeNode[];
    beforeEach(() => {
      updateConfigContext({
        platform: Platform.Hosted,
      });
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [],
          },
        } as never,
      });
      nodes = createDatabaseTreeNodes(explorer, false, useDatabases.getState().databases, refreshActiveTab, "");
    });

    it("creates expected tree", () => {
      expect(nodes).toMatchSnapshot();
    });
  });

  it.each<[string, Platform, boolean, Partial<DataModels.DatabaseAccountExtendedProperties>, Partial<UserContext>]>([
    [
      "the SQL API, on Fabric read-only (mirrored)",
      Platform.Fabric,
      false,
      { capabilities: [], enableMultipleWriteLocations: true },
      {
        fabricContext: {
          isReadOnly: true,
          artifactType: CosmosDbArtifactType.MIRRORED_KEY,
        } as FabricContext<CosmosDbArtifactType>,
      },
    ],
    [
      "the SQL API, on Fabric non read-only (native)",
      Platform.Fabric,
      false,
      { capabilities: [], enableMultipleWriteLocations: true },
      {
        fabricContext: {
          isReadOnly: false,
          artifactType: CosmosDbArtifactType.NATIVE,
        } as FabricContext<CosmosDbArtifactType>,
      },
    ],
    [
      "the SQL API, on Portal",
      Platform.Portal,
      false,
      { capabilities: [], enableMultipleWriteLocations: true },
      {
        fabricContext: undefined,
      },
    ],
    [
      "the Cassandra API, serverless, on Hosted",
      Platform.Hosted,
      false,
      {
        capabilities: [
          { name: CapabilityNames.EnableCassandra, description: "" },
          { name: CapabilityNames.EnableServerless, description: "" },
        ],
      },
      { fabricContext: undefined },
    ],
    [
      "the Mongo API, with Notebooks and Phoenix features, on Emulator",
      Platform.Emulator,
      true,
      {
        capabilities: [{ name: CapabilityNames.EnableMongo, description: "" }],
      },
      { fabricContext: undefined },
    ],
  ])(
    "generates the correct tree structure for %s",
    (_, platform, isNotebookEnabled, dbAccountProperties, userContext) => {
      useNotebook.setState({ isPhoenixFeatures: isNotebookEnabled });
      updateConfigContext({ platform });
      updateUserContext({
        ...userContext,
        databaseAccount: {
          properties: {
            enableMultipleWriteLocations: true,
            ...dbAccountProperties,
          },
        } as unknown as DataModels.DatabaseAccount,
      });
      const nodes = createDatabaseTreeNodes(
        explorer,
        isNotebookEnabled,
        useDatabases.getState().databases,
        refreshActiveTab,
        "",
      );
      expect(nodes).toMatchSnapshot();
    },
  );

  // The above tests focused on the tree structure. The below tests focus on some core behaviors of the nodes.
  // They are not exhaustive, because exhaustive tests here require a lot of mocking and can become very brittle.
  // The goal is to cover some key behaviors like loading child nodes, opening tabs/side panels, etc.

  it("adds new collections to database as they appear", () => {
    const nodes = createDatabaseTreeNodes(explorer, false, useDatabases.getState().databases, refreshActiveTab, "");
    const giganticDbNode = nodes.find((node) => node.label === giganticDb.id());
    expect(giganticDbNode).toBeDefined();
    expect(giganticDbNode.children.map((node) => node.label)).toStrictEqual(["schemaCollection", "load more"]);

    giganticDb.collections.push({
      ...baseCollection,
      id: ko.observable("addedCollection"),
    });

    expect(giganticDbNode.children.map((node) => node.label)).toStrictEqual([
      "schemaCollection",
      "addedCollection",
      "load more",
    ]);
  });

  describe("the database node", () => {
    let nodes: TreeNode[];
    let standardDbNode: TreeNode;
    let sharedDbNode: TreeNode;
    let giganticDbNode: TreeNode;

    beforeEach(() => {
      updateConfigContext({ platform: Platform.Hosted });
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [],
          },
        } as unknown as DataModels.DatabaseAccount,
      });
      nodes = createDatabaseTreeNodes(explorer, false, useDatabases.getState().databases, refreshActiveTab, "");
      standardDbNode = nodes.find((node) => node.label === standardDb.id());
      sharedDbNode = nodes.find((node) => node.label === sharedDb.id());
      giganticDbNode = nodes.find((node) => node.label === giganticDb.id());
    });

    it("loads child nodes when expanded", async () => {
      // Temporarily clear the child nodes to trigger the loading behavior
      standardDbNode.children = [];

      const expanding = new PromiseSource();
      let expandCalled = false;
      standardDb.expandDatabase = () => {
        expandCalled = true;
        return expanding.promise;
      };

      standardDbNode.onExpanded();
      expect(useSelectedNode.getState().selectedNode).toBe(standardDb);
      expect(standardDbNode.isLoading).toStrictEqual(true);
      expect(expandCalled).toStrictEqual(true);

      await expanding.resolveAndWait();

      expect(standardDbNode.isLoading).toStrictEqual(false);
      expect(useCommandBar.getState().contextButtons).toStrictEqual([]);
      expect(refreshActiveTab).toHaveBeenCalled();
      expect(useDatabases.getState().updateDatabase).toHaveBeenCalledWith(standardDb);
    });

    it("opens a New Container panel when 'New Container' option in context menu is clicked", () => {
      const newContainerMenuItem = standardDbNode.contextMenu.find((item) => item.label === "New Container");
      newContainerMenuItem.onClick();
      expect(explorer.onNewCollectionClicked).toHaveBeenCalled();
    });

    it("opens a Delete Database panel when 'Delete Database' option in context menu is clicked", () => {
      const deleteDatabaseMenuItem = standardDbNode.contextMenu.find((item) => item.label === "Delete Database");
      deleteDatabaseMenuItem.onClick();
      expect(useSidePanel.getState().headerText).toStrictEqual("Delete Database");
      expect(useSidePanel.getState().panelContent.type).toStrictEqual(DeleteDatabaseConfirmationPanel);
    });

    describe("the Scale subnode", () => {
      let scaleNode: TreeNode;
      beforeEach(() => {
        scaleNode = sharedDbNode.children.find((node) => node.label === "Scale");
      });

      it("is selected when Scale tab is open", () => {
        expect(scaleNode.isSelected()).toStrictEqual(false);
        selectDataNode(sharedDb, ViewModels.CollectionTabKind.DatabaseSettingsV2);
        expect(scaleNode.isSelected()).toStrictEqual(true);
      });

      it("opens settings tab when clicked", () => {
        expect(sharedDb.onSettingsClick).not.toHaveBeenCalled();
        scaleNode.onClick();
        expect(sharedDb.onSettingsClick).toHaveBeenCalled();
      });
    });

    describe("the load more node", () => {
      it("loads more collections when clicked", async () => {
        const loadCollections = new PromiseSource();
        let loadCalled = false;
        giganticDb.loadCollections = () => {
          loadCalled = true;
          return loadCollections.promise;
        };

        const loadMoreNode = giganticDbNode.children.find((node) => node.label === "load more");
        loadMoreNode.onClick();
        expect(loadCalled).toStrictEqual(true);
        await loadCollections.resolveAndWait();
        expect(useDatabases.getState().updateDatabase).toHaveBeenCalledWith(giganticDb);
      });
    });

    describe("the Collection subnode", () => {
      let standardCollectionNode: TreeNode;
      beforeEach(() => {
        standardCollectionNode = standardDbNode.children.find((node) => node.label === standardCollection.id());
      });

      it.each([
        [
          "for SQL API",
          () => updateUserContext({ databaseAccount: { properties: {} } as unknown as DataModels.DatabaseAccount }),
        ],
        [
          "for Gremlin API",
          () =>
            updateUserContext({
              databaseAccount: {
                properties: { capabilities: [{ name: CapabilityNames.EnableGremlin, description: "" }] },
              } as unknown as DataModels.DatabaseAccount,
            }),
        ],
      ])("loads sprocs/udfs/triggers when expanded, %s", async () => {
        standardCollection.loadStoredProcedures = jest.fn(() => Promise.resolve());
        standardCollection.loadUserDefinedFunctions = jest.fn(() => Promise.resolve());
        standardCollection.loadTriggers = jest.fn(() => Promise.resolve());

        await standardCollectionNode.onExpanded();

        expect(standardCollection.loadStoredProcedures).toHaveBeenCalled();
        expect(standardCollection.loadUserDefinedFunctions).toHaveBeenCalled();
        expect(standardCollection.loadTriggers).toHaveBeenCalled();
      });

      it.each([
        [
          "in Fabric",
          () => {
            updateConfigContext({ platform: Platform.Fabric });
            updateUserContext({
              fabricContext: {
                artifactType: CosmosDbArtifactType.MIRRORED_KEY,
                isReadOnly: true,
              } as FabricContext<CosmosDbArtifactType>,
            });
          },
        ],
        [
          "for Cassandra API",
          () =>
            updateUserContext({
              databaseAccount: {
                properties: { capabilities: [{ name: CapabilityNames.EnableCassandra, description: "" }] },
              } as unknown as DataModels.DatabaseAccount,
            }),
        ],
        [
          "for Mongo API",
          () =>
            updateUserContext({
              databaseAccount: {
                properties: { capabilities: [{ name: CapabilityNames.EnableMongo, description: "" }] },
              } as unknown as DataModels.DatabaseAccount,
            }),
        ],
        [
          "for Tables API",
          () =>
            updateUserContext({
              databaseAccount: {
                properties: { capabilities: [{ name: CapabilityNames.EnableTable, description: "" }] },
              } as unknown as DataModels.DatabaseAccount,
            }),
        ],
      ])("does not load sprocs/udfs/triggers when expanded, %s", async (_, setup) => {
        setup();

        // Rebuild the nodes after changing the user/config context.
        nodes = createDatabaseTreeNodes(explorer, false, useDatabases.getState().databases, refreshActiveTab, "");
        standardDbNode = nodes.find((node) => node.label === standardDb.id());
        standardCollectionNode = standardDbNode.children.find((node) => node.label === standardCollection.id());

        standardCollection.loadStoredProcedures = jest.fn(() => Promise.resolve());
        standardCollection.loadUserDefinedFunctions = jest.fn(() => Promise.resolve());
        standardCollection.loadTriggers = jest.fn(() => Promise.resolve());

        await standardCollectionNode.onExpanded();

        expect(standardCollection.loadStoredProcedures).not.toHaveBeenCalled();
        expect(standardCollection.loadUserDefinedFunctions).not.toHaveBeenCalled();
        expect(standardCollection.loadTriggers).not.toHaveBeenCalled();
      });
    });
  });
});
