import { DatabaseRegular, DocumentMultipleRegular, EyeRegular, SettingsRegular } from "@fluentui/react-icons";
import { TreeNode } from "Explorer/Controls/TreeComponent/TreeNodeComponent";
import { collectionWasOpened } from "Explorer/MostRecentActivity/MostRecentActivity";
import TabsBase from "Explorer/Tabs/TabsBase";
import StoredProcedure from "Explorer/Tree/StoredProcedure";
import Trigger from "Explorer/Tree/Trigger";
import UserDefinedFunction from "Explorer/Tree/UserDefinedFunction";
import { useDatabases } from "Explorer/useDatabases";
import { isFabric, isFabricMirrored, isFabricNative, isFabricNativeReadOnly } from "Platform/Fabric/FabricUtil";
import { getItemName } from "Utils/APITypeUtils";
import { isServerlessAccount } from "Utils/CapabilityUtils";
import { useTabs } from "hooks/useTabs";
import React from "react";
import { Platform, configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { useSelectedNode } from "../useSelectedNode";

export const shouldShowScriptNodes = (): boolean => {
  return (
    !isFabric() &&
    configContext.platform !== Platform.Emulator &&
    configContext.platform !== Platform.VNextEmulator &&
    (userContext.apiType === "SQL" || userContext.apiType === "Gremlin")
  );
};

const TreeDatabaseIcon = <DatabaseRegular fontSize={16} />;
const TreeSettingsIcon = <SettingsRegular fontSize={16} />;
const TreeCollectionIcon = <DocumentMultipleRegular fontSize={16} />;
const GlobalSecondaryIndexCollectionIcon = <EyeRegular fontSize={16} />; //check icon

export const createSampleDataTreeNodes = (sampleDataResourceTokenCollection: ViewModels.CollectionBase): TreeNode[] => {
  const updatedSampleTree: TreeNode = {
    label: sampleDataResourceTokenCollection.databaseId,
    isExpanded: false,
    className: "databaseNode",
    children: [
      {
        label: sampleDataResourceTokenCollection.id(),
        isExpanded: false,
        className: "collectionNode",
        contextMenu: ResourceTreeContextMenuButtonFactory.createSampleCollectionContextMenuButton(),
        iconSrc: TreeCollectionIcon,
        onClick: () => {
          useSelectedNode.getState().setSelectedNode(sampleDataResourceTokenCollection);
          useCommandBar.getState().setContextButtons([]);
          useTabs
            .getState()
            .refreshActiveTab(
              (tab: TabsBase) =>
                tab.collection?.id() === sampleDataResourceTokenCollection.id() &&
                tab.collection.databaseId === sampleDataResourceTokenCollection.databaseId,
            );
        },
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(sampleDataResourceTokenCollection.databaseId, sampleDataResourceTokenCollection.id()),
        onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(sampleDataResourceTokenCollection),
        children: [
          {
            label: "Items",
            onClick: () => sampleDataResourceTokenCollection.onDocumentDBDocumentsClick(),
            contextMenu: ResourceTreeContextMenuButtonFactory.createSampleCollectionContextMenuButton(),
            isSelected: () =>
              useSelectedNode
                .getState()
                .isDataNodeSelected(
                  sampleDataResourceTokenCollection.databaseId,
                  sampleDataResourceTokenCollection.id(),
                  [ViewModels.CollectionTabKind.Documents],
                ),
          },
        ],
      },
    ],
  };

  return [updatedSampleTree];
};

export const createResourceTokenTreeNodes = (collection: ViewModels.CollectionBase): TreeNode[] => {
  if (!collection) {
    return [
      {
        label: "",
        isExpanded: true,
        children: [],
      },
    ];
  }

  const children: TreeNode[] = [];
  children.push({
    label: "Items",
    onClick: () => {
      collection.onDocumentDBDocumentsClick();
      // push to most recent
      collectionWasOpened(userContext.databaseAccount?.name, collection);
    },
    isSelected: () =>
      useSelectedNode
        .getState()
        .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.Documents]),
  });

  const collectionNode: TreeNode = {
    label: collection.id(),
    isExpanded: true,
    children,
    className: "collectionNode",
    iconSrc: TreeCollectionIcon,
    onClick: () => {
      // Rewritten version of expandCollapseCollection
      useSelectedNode.getState().setSelectedNode(collection);
      useCommandBar.getState().setContextButtons([]);
      useTabs
        .getState()
        .refreshActiveTab(
          (tab) => tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
        );
    },
    isSelected: () => useSelectedNode.getState().isDataNodeSelected(collection.databaseId, collection.id()),
  };

  return [collectionNode];
};

export const createDatabaseTreeNodes = (
  container: Explorer,
  isNotebookEnabled: boolean,
  databases: ViewModels.Database[],
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
): TreeNode[] => {
  const databaseTreeNodes: TreeNode[] = databases.map((database: ViewModels.Database) => {
    const buildDatabaseChildNodes = (databaseNode: TreeNode) => {
      databaseNode.children = [];
      if (database.isDatabaseShared() && configContext.platform !== Platform.Fabric) {
        databaseNode.children.push({
          id: database.isSampleDB ? "sampleScaleSettings" : "",
          label: "Scale",
          iconSrc: TreeSettingsIcon,
          isSelected: () =>
            useSelectedNode
              .getState()
              .isDataNodeSelected(database.id(), undefined, [ViewModels.CollectionTabKind.DatabaseSettingsV2]),
          onClick: database.onSettingsClick.bind(database),
        });
      }

      // Find collections
      database
        .collections()
        .forEach((collection: ViewModels.Collection) =>
          databaseNode.children.push(
            buildCollectionNode(database, collection, isNotebookEnabled, container, refreshActiveTab),
          ),
        );

      if (database.collectionsContinuationToken) {
        const loadMoreNode: TreeNode = {
          label: "load more",
          className: "loadMoreNode",
          onClick: async () => {
            await database.loadCollections();
            useDatabases.getState().updateDatabase(database);
          },
        };
        databaseNode.children.push(loadMoreNode);
      }
    };

    const databaseNode: TreeNode = {
      label: database.id(),
      className: "databaseNode",
      children: [],
      isSelected: () => useSelectedNode.getState().isDataNodeSelected(database.id()),
      contextMenu: ResourceTreeContextMenuButtonFactory.createDatabaseContextMenu(container, database.id()),
      iconSrc: TreeDatabaseIcon,
      onExpanded: async () => {
        useSelectedNode.getState().setSelectedNode(database);
        if (!databaseNode.children || databaseNode.children?.length === 0) {
          databaseNode.isLoading = true;
        }
        await database.expandDatabase();
        databaseNode.isLoading = false;
        useCommandBar.getState().setContextButtons([]);
        refreshActiveTab((tab: TabsBase) => tab.collection?.databaseId === database.id());
        useDatabases.getState().updateDatabase(database);
      },
      onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(database),
      isExpanded: database.isDatabaseExpanded(),
      onCollapsed: () => {
        database.collapseDatabase();
        // useCommandBar.getState().setContextButtons([]);
        useDatabases.getState().updateDatabase(database);
      },
    };

    buildDatabaseChildNodes(databaseNode);

    database.collections.subscribe(() => {
      buildDatabaseChildNodes(databaseNode);
    });

    return databaseNode;
  });

  return databaseTreeNodes;
};

export const buildCollectionNode = (
  database: ViewModels.Database,
  collection: ViewModels.Collection,
  isNotebookEnabled: boolean,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
): TreeNode => {
  let children: TreeNode[];
  // Flat Tree for Fabric
  if (!isFabricMirrored()) {
    children = buildCollectionNodeChildren(database, collection, isNotebookEnabled, container, refreshActiveTab);
  }

  const collectionNode: TreeNode = {
    label: collection.id(),
    children: children,
    className: "collectionNode",
    contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(container, collection),
    iconSrc: collection.materializedViewDefinition() ? GlobalSecondaryIndexCollectionIcon : TreeCollectionIcon,
    onClick: () => {
      useSelectedNode.getState().setSelectedNode(collection);
      collection.openTab();
      // push to most recent
      collectionWasOpened(userContext.databaseAccount?.name, collection);
    },
    onExpanded: async () => {
      // Rewritten version of expandCollapseCollection
      useSelectedNode.getState().setSelectedNode(collection);
      useCommandBar.getState().setContextButtons([]);
      refreshActiveTab(
        (tab: TabsBase) =>
          tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
      );
      useDatabases.getState().updateDatabase(database);

      // If we're showing script nodes, start loading them.
      if (shouldShowScriptNodes()) {
        await collection.loadStoredProcedures();
        await collection.loadUserDefinedFunctions();
        await collection.loadTriggers();
      }

      useDatabases.getState().updateDatabase(database);
    },
    isSelected: () => useSelectedNode.getState().isDataNodeSelected(collection.databaseId, collection.id()),
    onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(collection),
    onCollapsed: () => {
      collection.collapseCollection();
      // useCommandBar.getState().setContextButtons([]);
      useDatabases.getState().updateDatabase(database);
    },
    isExpanded: collection.isCollectionExpanded(),
  };

  return collectionNode;
};

const buildCollectionNodeChildren = (
  database: ViewModels.Database,
  collection: ViewModels.Collection,
  isNotebookEnabled: boolean,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
): TreeNode[] => {
  const children: TreeNode[] = [];
  children.push({
    label: getItemName(),
    id: collection.isSampleCollection ? "sampleItems" : "",
    onClick: () => {
      collection.openTab();
      // push to most recent
      collectionWasOpened(userContext.databaseAccount?.name, collection);
    },
    isSelected: () =>
      useSelectedNode
        .getState()
        .isDataNodeSelected(collection.databaseId, collection.id(), [
          ViewModels.CollectionTabKind.Documents,
          ViewModels.CollectionTabKind.Graph,
        ]),
    contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(container, collection),
  });

  if ((userContext.apiType !== "Cassandra" || !isServerlessAccount()) && !isFabricNativeReadOnly()) {
    let id = "";
    if (collection.isSampleCollection) {
      id = database.isDatabaseShared() ? "sampleSettings" : "sampleScaleSettings";
    }

    children.push({
      id,
      label: database.isDatabaseShared() || isServerlessAccount() || isFabricNative() ? "Settings" : "Scale & Settings",
      onClick: collection.onSettingsClick.bind(collection),
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [
            ViewModels.CollectionTabKind.CollectionSettingsV2,
          ]),
    });
  }

  const schemaNode: TreeNode = buildSchemaNode(collection, container, refreshActiveTab);
  if (schemaNode) {
    children.push(schemaNode);
  }

  const onUpdateDatabase = () => useDatabases.getState().updateDatabase(database);

  if (shouldShowScriptNodes()) {
    children.push(buildStoredProcedureNode(collection, container, refreshActiveTab, onUpdateDatabase));
    children.push(buildUserDefinedFunctionsNode(collection, container, refreshActiveTab, onUpdateDatabase));
    children.push(buildTriggerNode(collection, container, refreshActiveTab, onUpdateDatabase));
  }

  // This is a rewrite of showConflicts
  const showConflicts =
    userContext?.databaseAccount?.properties.enableMultipleWriteLocations &&
    collection.rawDataModel &&
    !!collection.rawDataModel.conflictResolutionPolicy;

  if (showConflicts) {
    children.push({
      label: "Conflicts",
      onClick: collection.onConflictsClick.bind(collection),
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.Conflicts]),
    });
  }

  return children;
};

const buildStoredProcedureNode = (
  collection: ViewModels.Collection,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
  onUpdateDatabase: () => void,
): TreeNode => {
  return {
    label: "Stored Procedures",
    children: collection.storedProcedures().map((sp: StoredProcedure) => ({
      label: sp.id(),
      onClick: sp.open.bind(sp),
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.StoredProcedures]),
      contextMenu: ResourceTreeContextMenuButtonFactory.createStoreProcedureContextMenuItems(container, sp),
    })),
    onExpanded: async () => {
      await collection.loadStoredProcedures();
      collection.selectedSubnodeKind(ViewModels.CollectionTabKind.StoredProcedures);
      refreshActiveTab(
        (tab: TabsBase) =>
          tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
      );
      onUpdateDatabase();
    },
  };
};

const buildUserDefinedFunctionsNode = (
  collection: ViewModels.Collection,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
  onUpdateDatabase: () => void,
): TreeNode => {
  return {
    label: "User Defined Functions",
    children: collection.userDefinedFunctions().map((udf: UserDefinedFunction) => ({
      label: udf.id(),
      onClick: udf.open.bind(udf),
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [
            ViewModels.CollectionTabKind.UserDefinedFunctions,
          ]),
      contextMenu: ResourceTreeContextMenuButtonFactory.createUserDefinedFunctionContextMenuItems(container, udf),
    })),
    onExpanded: async () => {
      await collection.loadUserDefinedFunctions();
      collection.selectedSubnodeKind(ViewModels.CollectionTabKind.UserDefinedFunctions);
      refreshActiveTab(
        (tab: TabsBase) =>
          tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
      );
      onUpdateDatabase();
    },
  };
};

const buildTriggerNode = (
  collection: ViewModels.Collection,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
  onUpdateDatabase: () => void,
): TreeNode => {
  return {
    label: "Triggers",
    children: collection.triggers().map((trigger: Trigger) => ({
      label: trigger.id(),
      onClick: trigger.open.bind(trigger),
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.Triggers]),
      contextMenu: ResourceTreeContextMenuButtonFactory.createTriggerContextMenuItems(container, trigger),
    })),
    onExpanded: async () => {
      await collection.loadTriggers();
      collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Triggers);
      refreshActiveTab(
        (tab: TabsBase) =>
          tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
      );
      onUpdateDatabase();
    },
  };
};

const buildSchemaNode = (
  collection: ViewModels.Collection,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
): TreeNode => {
  if (collection.analyticalStorageTtl() === undefined) {
    return undefined;
  }

  if (!collection.schema || !collection.schema.fields) {
    return undefined;
  }

  return {
    label: "Schema",
    children: getSchemaNodes(collection.schema.fields),
    onClick: () => {
      collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Schema);
      refreshActiveTab((tab: TabsBase) => tab.collection && tab.collection.rid === collection.rid);
    },
  };
};

const getSchemaNodes = (fields: DataModels.IDataField[]): TreeNode[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema: any = {};

  //unflatten
  fields.forEach((field: DataModels.IDataField) => {
    const path: string[] = field.path.split(".");
    const fieldProperties = [field.dataType.name, `HasNulls: ${field.hasNulls}`];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = {};
    path.forEach((name: string, pathIndex: number) => {
      if (pathIndex === 0) {
        if (schema[name] === undefined) {
          if (pathIndex === path.length - 1) {
            schema[name] = fieldProperties;
          } else {
            schema[name] = {};
          }
        }
        current = schema[name];
      } else {
        if (current[name] === undefined) {
          if (pathIndex === path.length - 1) {
            current[name] = fieldProperties;
          } else {
            current[name] = {};
          }
        }
        current = current[name];
      }
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traverse = (obj: any): TreeNode[] => {
    const children: TreeNode[] = [];

    if (obj !== undefined && !Array.isArray(obj) && typeof obj === "object") {
      Object.entries(obj).forEach(([key, value]) => {
        children.push({ label: key, children: traverse(value) });
      });
    } else if (Array.isArray(obj)) {
      return [{ label: obj[0] }, { label: obj[1] }];
    }

    return children;
  };

  return traverse(schema);
};
