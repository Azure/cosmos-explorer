import { GlobalSecondaryIndexLabels } from "Common/Constants";
import { isGlobalSecondaryIndexEnabled } from "Common/DatabaseAccountUtility";
import { configContext, Platform } from "ConfigContext";
import { TreeNodeMenuItem } from "Explorer/Controls/TreeComponent/TreeNodeComponent";
import {
  AddGlobalSecondaryIndexPanel,
  AddGlobalSecondaryIndexPanelProps,
} from "Explorer/Panes/AddGlobalSecondaryIndexPanel/AddGlobalSecondaryIndexPanel";
import { useDatabases } from "Explorer/useDatabases";
import { isFabric, isFabricNative, openRestoreContainerDialog } from "Platform/Fabric/FabricUtil";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceOpen } from "Shared/Telemetry/TelemetryProcessor";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import React from "react";
import AddCollectionIcon from "../../images/AddCollection.svg";
import AddSqlQueryIcon from "../../images/AddSqlQuery_16x16.svg";
import AddStoredProcedureIcon from "../../images/AddStoredProcedure.svg";
import AddTriggerIcon from "../../images/AddTrigger.svg";
import AddUdfIcon from "../../images/AddUdf.svg";
import DeleteCollectionIcon from "../../images/DeleteCollection.svg";
import DeleteDatabaseIcon from "../../images/DeleteDatabase.svg";
import DeleteSprocIcon from "../../images/DeleteSproc.svg";
import DeleteTriggerIcon from "../../images/DeleteTrigger.svg";
import DeleteUDFIcon from "../../images/DeleteUDF.svg";
import HostedTerminalIcon from "../../images/Hosted-Terminal.svg";
import * as ViewModels from "../Contracts/ViewModels";
import { userContext } from "../UserContext";
import { getCollectionName, getDatabaseName } from "../Utils/APITypeUtils";
import { useSidePanel } from "../hooks/useSidePanel";
import Explorer from "./Explorer";
import { useNotebook } from "./Notebook/useNotebook";
import { DeleteCollectionConfirmationPane } from "./Panes/DeleteCollectionConfirmationPane/DeleteCollectionConfirmationPane";
import { DeleteDatabaseConfirmationPanel } from "./Panes/DeleteDatabaseConfirmationPanel";
import StoredProcedure from "./Tree/StoredProcedure";
import Trigger from "./Tree/Trigger";
import UserDefinedFunction from "./Tree/UserDefinedFunction";
import { useSelectedNode } from "./useSelectedNode";
import { extractFeatures } from "../Platform/Hosted/extractFeatures";

export interface CollectionContextMenuButtonParams {
  databaseId: string;
  collectionId: string;
}

export interface DatabaseContextMenuButtonParams {
  databaseId: string;
}
/**
 * New resource tree (in ReactJS)
 */
export const createDatabaseContextMenu = (container: Explorer, databaseId: string): TreeNodeMenuItem[] => {
  if (isFabric() && userContext.fabricContext?.isReadOnly) {
    return undefined;
  }

  const items: TreeNodeMenuItem[] = [
    {
      iconSrc: AddCollectionIcon,
      onClick: () => container.onNewCollectionClicked({ databaseId }),
      label: `New ${getCollectionName()}`,
    },
  ];

  if (isFabricNative() && !userContext.fabricContext?.isReadOnly) {
    const features = extractFeatures();
    if (features?.enableRestoreContainer) {
      items.push({
        iconSrc: AddCollectionIcon,
        onClick: () => openRestoreContainerDialog(),
        label: `Restore ${getCollectionName()}`,
      });
    }
  }

  if (!isFabricNative() && (userContext.apiType !== "Tables" || userContext.features.enableSDKoperations)) {
    items.push({
      iconSrc: DeleteDatabaseIcon,
      onClick: (lastFocusedElement?: React.RefObject<HTMLElement>) => {
        (useSidePanel.getState().getRef = lastFocusedElement),
          useSidePanel
            .getState()
            .openSidePanel(
              "Delete " + getDatabaseName(),
              <DeleteDatabaseConfirmationPanel refreshDatabases={() => container.refreshAllDatabases()} />,
            );
      },
      label: `Delete ${getDatabaseName()}`,
      styleClass: "deleteDatabaseMenuItem",
    });
  }
  return items;
};

export const createCollectionContextMenuButton = (
  container: Explorer,
  selectedCollection: ViewModels.Collection,
): TreeNodeMenuItem[] => {
  const items: TreeNodeMenuItem[] = [];
  if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
    items.push({
      iconSrc: AddSqlQueryIcon,
      onClick: () => selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, undefined),
      label: "New SQL Query",
    });
  }

  if (userContext.apiType === "Mongo") {
    items.push({
      iconSrc: AddSqlQueryIcon,
      onClick: () => selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection, undefined),
      label: "New Query",
    });

    items.push({
      iconSrc: HostedTerminalIcon,
      onClick: () => {
        const selectedCollection: ViewModels.Collection = useSelectedNode.getState().findSelectedCollection();
        if (useNotebook.getState().isShellEnabled || userContext.features.enableCloudShell) {
          container.openNotebookTerminal(ViewModels.TerminalKind.Mongo);
        } else {
          selectedCollection && selectedCollection.onNewMongoShellClick();
        }
      },
      label:
        useNotebook.getState().isShellEnabled || userContext.features.enableCloudShell
          ? "Open Mongo Shell"
          : "New Shell",
    });
  }

  if (
    (useNotebook.getState().isShellEnabled || userContext.features.enableCloudShell) &&
    userContext.apiType === "Cassandra"
  ) {
    items.push({
      iconSrc: HostedTerminalIcon,
      onClick: () => {
        container.openNotebookTerminal(ViewModels.TerminalKind.Cassandra);
      },
      label: "Open Cassandra Shell",
    });
  }

  if (
    configContext.platform !== Platform.Fabric &&
    (userContext.apiType === "SQL" || userContext.apiType === "Gremlin")
  ) {
    items.push({
      iconSrc: AddStoredProcedureIcon,
      onClick: () => {
        selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, undefined);
      },
      label: "New Stored Procedure",
    });

    items.push({
      iconSrc: AddUdfIcon,
      onClick: () => {
        selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection);
      },
      label: "New UDF",
    });

    items.push({
      iconSrc: AddTriggerIcon,
      onClick: () => {
        selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection, undefined);
      },
      label: "New Trigger",
    });
  }

  if (!isFabric() || (isFabric() && !userContext.fabricContext?.isReadOnly)) {
    items.push({
      iconSrc: DeleteCollectionIcon,
      onClick: (lastFocusedElement?: React.RefObject<HTMLElement>) => {
        useSelectedNode.getState().setSelectedNode(selectedCollection);
        (useSidePanel.getState().getRef = lastFocusedElement),
          useSidePanel
            .getState()
            .openSidePanel(
              "Delete " + getCollectionName(),
              <DeleteCollectionConfirmationPane refreshDatabases={() => container.refreshAllDatabases()} />,
            );
      },
      label: `Delete ${getCollectionName()}`,
      styleClass: "deleteCollectionMenuItem",
    });
  }

  if (isGlobalSecondaryIndexEnabled() && !selectedCollection.materializedViewDefinition()) {
    items.push({
      label: GlobalSecondaryIndexLabels.NewGlobalSecondaryIndex,
      onClick: () => {
        const addMaterializedViewPanelProps: AddGlobalSecondaryIndexPanelProps = {
          explorer: container,
          sourceContainer: selectedCollection,
        };
        useSidePanel
          .getState()
          .openSidePanel(
            GlobalSecondaryIndexLabels.NewGlobalSecondaryIndex,
            <AddGlobalSecondaryIndexPanel {...addMaterializedViewPanelProps} />,
          );
      },
    });
  }

  return items;
};

export const createSampleCollectionContextMenuButton = (): TreeNodeMenuItem[] => {
  const items: TreeNodeMenuItem[] = [];
  if (userContext.apiType === "SQL") {
    const copilotVersion = userContext.features.copilotVersion;
    if (copilotVersion === "v1.0") {
      items.push({
        iconSrc: AddSqlQueryIcon,
        onClick: () => {
          useTabs.getState().openAndActivateReactTab(ReactTabKind.QueryCopilot);
          traceOpen(Action.OpenQueryCopilotFromNewQuery, { apiType: userContext.apiType });
        },
        label: "New SQL Query",
      });
    } else if (copilotVersion === "v2.0") {
      const sampleCollection = useDatabases.getState().sampleDataResourceTokenCollection;
      items.push({
        iconSrc: AddSqlQueryIcon,
        onClick: () => sampleCollection && sampleCollection.onNewQueryClick(sampleCollection, undefined),
        label: "New SQL Query",
      });
    }
  }

  return items;
};

export const createStoreProcedureContextMenuItems = (
  container: Explorer,
  storedProcedure: StoredProcedure,
): TreeNodeMenuItem[] => {
  if (userContext.apiType === "Cassandra") {
    return [];
  }

  return [
    {
      iconSrc: DeleteSprocIcon,
      onClick: () => storedProcedure.delete(),
      label: "Delete Stored Procedure",
    },
  ];
};

export const createTriggerContextMenuItems = (container: Explorer, trigger: Trigger): TreeNodeMenuItem[] => {
  if (userContext.apiType === "Cassandra") {
    return [];
  }

  return [
    {
      iconSrc: DeleteTriggerIcon,
      onClick: () => trigger.delete(),
      label: "Delete Trigger",
    },
  ];
};

export const createUserDefinedFunctionContextMenuItems = (
  container: Explorer,
  userDefinedFunction: UserDefinedFunction,
): TreeNodeMenuItem[] => {
  if (userContext.apiType === "Cassandra") {
    return [];
  }

  return [
    {
      iconSrc: DeleteUDFIcon,
      onClick: () => userDefinedFunction.delete(),
      label: "Delete User Defined Function",
    },
  ];
};
