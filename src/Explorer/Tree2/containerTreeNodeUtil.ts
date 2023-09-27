import { TreeNode2 } from "Explorer/Controls/TreeComponent2/TreeNode2Component";
import TabsBase from "Explorer/Tabs/TabsBase";
import StoredProcedure from "Explorer/Tree/StoredProcedure";
import Trigger from "Explorer/Tree/Trigger";
import UserDefinedFunction from "Explorer/Tree/UserDefinedFunction";
import { useDatabases } from "Explorer/useDatabases";
import { getItemName } from "Utils/APITypeUtils";
import { isServerlessAccount } from "Utils/CapabilityUtils";
import CollectionIcon from "../../../images/tree-collection.svg";
import { isPublicInternetAccessAllowed } from "../../Common/DatabaseAccountUtility";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { mostRecentActivity } from "../MostRecentActivity/MostRecentActivity";
import { useNotebook } from "../Notebook/useNotebook";
import { useSelectedNode } from "../useSelectedNode";
import { Platform, configContext } from "./../../ConfigContext";

export const buildCollectionNode = (
  database: ViewModels.Database,
  collection: ViewModels.Collection,
  isNotebookEnabled: boolean,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void
): TreeNode2 => {
  let children: TreeNode2[];

  // Flat Tree for Fabric
  if (configContext.platform !== Platform.Fabric) {
    children = buildCollectionNodeChildren(database, collection, isNotebookEnabled, container, refreshActiveTab);
  }

  return {
    label: collection.id(),
    iconSrc: CollectionIcon,
    children: children,
    className: "collectionHeader",
    contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(container, collection),
    onClick: () => {
      useSelectedNode.getState().setSelectedNode(collection);
      collection.openTab();
      // push to most recent
      mostRecentActivity.collectionWasOpened(userContext.databaseAccount?.id, collection);
    },
    onExpanded: async () => {
      // Rewritten version of expandCollapseCollection
      useSelectedNode.getState().setSelectedNode(collection);
      useCommandBar.getState().setContextButtons([]);
      refreshActiveTab(
        (tab: TabsBase) =>
          tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
      );
      useDatabases.getState().updateDatabase(database);
    },
    isSelected: () => useSelectedNode.getState().isDataNodeSelected(collection.databaseId, collection.id()),
    onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(collection),
    onCollapsed() {
      collection.collapseCollection();
      // useCommandBar.getState().setContextButtons([]);
      useDatabases.getState().updateDatabase(database);
    },
    isExpanded: collection.isCollectionExpanded(),
  };
};

const buildCollectionNodeChildren = (
  database: ViewModels.Database,
  collection: ViewModels.Collection,
  isNotebookEnabled: boolean,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void
): TreeNode2[] => {
  const showScriptNodes = userContext.apiType === "SQL" || userContext.apiType === "Gremlin";
  const children: TreeNode2[] = [];
  children.push({
    label: getItemName(),
    id: collection.isSampleCollection ? "sampleItems" : "",
    onClick: () => {
      collection.openTab();
      // push to most recent
      mostRecentActivity.collectionWasOpened(userContext.databaseAccount?.id, collection);
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

  if (
    isNotebookEnabled &&
    userContext.apiType === "Mongo" &&
    isPublicInternetAccessAllowed() &&
    useNotebook.getState().isPhoenixFeatures
  ) {
    children.push({
      label: "Schema (Preview)",
      onClick: collection.onSchemaAnalyzerClick.bind(collection),
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.SchemaAnalyzer]),
    });
  }

  if (userContext.apiType !== "Cassandra" || !isServerlessAccount()) {
    let id = "";
    if (collection.isSampleCollection) {
      id = database.isDatabaseShared() ? "sampleSettings" : "sampleScaleSettings";
    }

    children.push({
      id,
      label: database.isDatabaseShared() || isServerlessAccount() ? "Settings" : "Scale & Settings",
      onClick: collection.onSettingsClick.bind(collection),
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [
            ViewModels.CollectionTabKind.CollectionSettingsV2,
          ]),
    });
  }

  const schemaNode: TreeNode2 = buildSchemaNode(collection, container, refreshActiveTab);
  if (schemaNode) {
    children.push(schemaNode);
  }

  const onUpdateDatabase = () => useDatabases.getState().updateDatabase(database);

  if (showScriptNodes) {
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
  onUpdateDatabase: () => void
): TreeNode2 => {
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
          tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
      );
      onUpdateDatabase();
    },
  };
};

const buildUserDefinedFunctionsNode = (
  collection: ViewModels.Collection,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
  onUpdateDatabase: () => void
): TreeNode2 => {
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
          tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
      );
      onUpdateDatabase();
    },
  };
};

const buildTriggerNode = (
  collection: ViewModels.Collection,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void,
  onUpdateDatabase: () => void
): TreeNode2 => {
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
          tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
      );
      onUpdateDatabase();
    },
  };
};

const buildSchemaNode = (
  collection: ViewModels.Collection,
  container: Explorer,
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void
): TreeNode2 => {
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

const getSchemaNodes = (fields: DataModels.IDataField[]): TreeNode2[] => {
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
  const traverse = (obj: any): TreeNode2[] => {
    const children: TreeNode2[] = [];

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
