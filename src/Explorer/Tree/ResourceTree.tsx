import { SampleDataTree } from "Explorer/Tree/SampleDataTree";
import { getItemName } from "Utils/APITypeUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import * as React from "react";
import shallow from "zustand/shallow";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import { isPublicInternetAccessAllowed } from "../../Common/DatabaseAccountUtility";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { isServerlessAccount } from "../../Utils/CapabilityUtils";
import { useTabs } from "../../hooks/useTabs";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import { AccordionComponent, AccordionItemComponent } from "../Controls/Accordion/AccordionComponent";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { mostRecentActivity } from "../MostRecentActivity/MostRecentActivity";
import { useNotebook } from "../Notebook/useNotebook";
import TabsBase from "../Tabs/TabsBase";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
import { Platform, configContext } from "./../../ConfigContext";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import UserDefinedFunction from "./UserDefinedFunction";

interface ResourceTreeProps {
  container: Explorer;
}

export const ResourceTree: React.FC<ResourceTreeProps> = ({ container }: ResourceTreeProps): JSX.Element => {
  const databases = useDatabases((state) => state.databases);
  const { isNotebookEnabled } = useNotebook(
    (state) => ({
      isNotebookEnabled: state.isNotebookEnabled,
    }),
    shallow,
  );
  const { refreshActiveTab } = useTabs();
  const showScriptNodes =
    configContext.platform !== Platform.Fabric && (userContext.apiType === "SQL" || userContext.apiType === "Gremlin");

  const buildDataTree = (): TreeNode => {
    const databaseTreeNodes: TreeNode[] = databases.map((database: ViewModels.Database) => {
      const databaseNode: TreeNode = {
        label: database.id(),
        iconSrc: CosmosDBIcon,
        isExpanded: database.isDatabaseExpanded(),
        className: "databaseHeader",
        children: [],
        isSelected: () => useSelectedNode.getState().isDataNodeSelected(database.id()),
        contextMenu: ResourceTreeContextMenuButtonFactory.createDatabaseContextMenu(container, database.id()),
        onClick: async (isExpanded) => {
          useSelectedNode.getState().setSelectedNode(database);
          // Rewritten version of expandCollapseDatabase():
          if (isExpanded) {
            database.collapseDatabase();
          } else {
            if (databaseNode.children?.length === 0) {
              databaseNode.isLoading = true;
            }
            await database.expandDatabase();
          }
          databaseNode.isLoading = false;
          useCommandBar.getState().setContextButtons([]);
          refreshActiveTab((tab: TabsBase) => tab.collection?.databaseId === database.id());
        },
        onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(database),
      };

      if (database.isDatabaseShared()) {
        databaseNode.children.push({
          id: database.isSampleDB ? "sampleScaleSettings" : "",
          label: "Scale",
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
          databaseNode.children.push(buildCollectionNode(database, collection)),
        );

      if (database.collectionsContinuationToken) {
        const loadMoreNode: TreeNode = {
          label: "load more",
          className: "loadMoreHeader",
          onClick: async () => {
            await database.loadCollections();
            useDatabases.getState().updateDatabase(database);
          },
        };
        databaseNode.children.push(loadMoreNode);
      }

      database.collections.subscribe((collections: ViewModels.Collection[]) => {
        collections.forEach((collection: ViewModels.Collection) =>
          databaseNode.children.push(buildCollectionNode(database, collection)),
        );
      });

      return databaseNode;
    });

    return {
      label: undefined,
      isExpanded: true,
      children: databaseTreeNodes,
    };
  };

  const buildCollectionNode = (database: ViewModels.Database, collection: ViewModels.Collection): TreeNode => {
    const children: TreeNode[] = [];
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

    const schemaNode: TreeNode = buildSchemaNode(collection);
    if (schemaNode) {
      children.push(schemaNode);
    }

    if (showScriptNodes) {
      children.push(buildStoredProcedureNode(collection));
      children.push(buildUserDefinedFunctionsNode(collection));
      children.push(buildTriggerNode(collection));
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

    return {
      label: collection.id(),
      iconSrc: CollectionIcon,
      isExpanded: collection.isCollectionExpanded(),
      children: children,
      className: "collectionHeader",
      contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(container, collection),
      onClick: () => {
        // Rewritten version of expandCollapseCollection
        useSelectedNode.getState().setSelectedNode(collection);
        useCommandBar.getState().setContextButtons([]);
        refreshActiveTab(
          (tab: TabsBase) =>
            tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
        );
      },
      onExpanded: () => {
        if (showScriptNodes) {
          collection.loadStoredProcedures();
          collection.loadUserDefinedFunctions();
          collection.loadTriggers();
        }
      },
      isSelected: () => useSelectedNode.getState().isDataNodeSelected(collection.databaseId, collection.id()),
      onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(collection),
    };
  };

  const buildStoredProcedureNode = (collection: ViewModels.Collection): TreeNode => {
    return {
      label: "Stored Procedures",
      children: collection.storedProcedures().map((sp: StoredProcedure) => ({
        label: sp.id(),
        onClick: sp.open.bind(sp),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [
              ViewModels.CollectionTabKind.StoredProcedures,
            ]),
        contextMenu: ResourceTreeContextMenuButtonFactory.createStoreProcedureContextMenuItems(container, sp),
      })),
      onClick: async () => {
        await collection.loadStoredProcedures();
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.StoredProcedures);
        refreshActiveTab(
          (tab: TabsBase) =>
            tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
        );
      },
    };
  };

  const buildUserDefinedFunctionsNode = (collection: ViewModels.Collection): TreeNode => {
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
      onClick: async () => {
        await collection.loadUserDefinedFunctions();
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.UserDefinedFunctions);
        refreshActiveTab(
          (tab: TabsBase) =>
            tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
        );
      },
    };
  };

  const buildTriggerNode = (collection: ViewModels.Collection): TreeNode => {
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
      onClick: async () => {
        await collection.loadTriggers();
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Triggers);
        refreshActiveTab(
          (tab: TabsBase) =>
            tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
        );
      },
    };
  };

  const buildSchemaNode = (collection: ViewModels.Collection): TreeNode => {
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
    const schema: any = {};

    //unflatten
    fields.forEach((field: DataModels.IDataField) => {
      const path: string[] = field.path.split(".");
      const fieldProperties = [field.dataType.name, `HasNulls: ${field.hasNulls}`];
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

  const dataRootNode = buildDataTree();
  const isSampleDataEnabled =
    useQueryCopilot().copilotEnabled &&
    useQueryCopilot().copilotSampleDBEnabled &&
    userContext.sampleDataConnectionInfo &&
    userContext.apiType === "SQL";
  const sampleDataResourceTokenCollection = useDatabases((state) => state.sampleDataResourceTokenCollection);

  return (
    <>
      {!isNotebookEnabled && !isSampleDataEnabled && (
        <TreeComponent className="dataResourceTree" rootNode={dataRootNode} />
      )}
      {!isNotebookEnabled && isSampleDataEnabled && (
        <>
          <AccordionComponent>
            <AccordionItemComponent title={"MY DATA"} isExpanded={true}>
              <TreeComponent className="dataResourceTree" rootNode={dataRootNode} />
            </AccordionItemComponent>
            <AccordionItemComponent title={"SAMPLE DATA"} containerStyles={{ display: "table" }}>
              <SampleDataTree sampleDataResourceTokenCollection={sampleDataResourceTokenCollection} />
            </AccordionItemComponent>
          </AccordionComponent>
        </>
      )}
    </>
  );
};
