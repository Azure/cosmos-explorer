import * as ko from "knockout";
import * as PaneComponents from "./Panes/PaneComponents";
import { DiffEditorComponent } from "./Controls/DiffEditor/DiffEditorComponent";
import { DynamicListComponent } from "./Controls/DynamicList/DynamicListComponent";
import { EditorComponent } from "./Controls/Editor/EditorComponent";
import { ErrorDisplayComponent } from "./Controls/ErrorDisplayComponent/ErrorDisplayComponent";
import { GraphStyleComponent } from "./Graph/GraphStyleComponent/GraphStyleComponent";
import { InputTypeaheadComponent } from "./Controls/InputTypeahead/InputTypeahead";
import { JsonEditorComponent } from "./Controls/JsonEditor/JsonEditorComponent";
import { NewVertexComponent } from "./Graph/NewVertexComponent/NewVertexComponent";
import { ThroughputInputComponentAutoPilotV3 } from "./Controls/ThroughputInput/ThroughputInputComponentAutoPilotV3";

import DocumentsTab from "./Tabs/DocumentsTab";
import StoredProcedureTab from "./Tabs/StoredProcedureTab";
import TriggerTab from "./Tabs/TriggerTab";
import UserDefinedFunctionTab from "./Tabs/UserDefinedFunctionTab";
import { DatabaseSettingsTabV2, SettingsTabV2 } from "./Tabs/SettingsTabV2";
import QueryTab from "./Tabs/QueryTab";
import QueryTablesTab from "./Tabs/QueryTablesTab";
import GraphTab from "./Tabs/GraphTab";
import MongoShellTab from "./Tabs/MongoShellTab";
import ConflictsTab from "./Tabs/ConflictsTab";
import NotebookTabV2 from "./Tabs/NotebookV2Tab";
import TerminalTab from "./Tabs/TerminalTab";
import GalleryTab from "./Tabs/GalleryTab";
import NotebookViewerTab from "./Tabs/NotebookViewerTab";
import DatabaseSettingsTab from "./Tabs/DatabaseSettingsTab";
import TabsManagerTemplate from "./Tabs/TabsManager.html";

ko.components.register("input-typeahead", new InputTypeaheadComponent());
ko.components.register("new-vertex-form", NewVertexComponent);
ko.components.register("error-display", new ErrorDisplayComponent());
ko.components.register("graph-style", GraphStyleComponent);
ko.components.register("editor", new EditorComponent());
ko.components.register("json-editor", new JsonEditorComponent());
ko.components.register("diff-editor", new DiffEditorComponent());
ko.components.register("dynamic-list", DynamicListComponent);
ko.components.register("throughput-input-autopilot-v3", ThroughputInputComponentAutoPilotV3);
ko.components.register("tabs-manager", { template: TabsManagerTemplate });

// Collection Tabs
[
  DocumentsTab,
  StoredProcedureTab,
  TriggerTab,
  UserDefinedFunctionTab,
  SettingsTabV2,
  QueryTab,
  QueryTablesTab,
  GraphTab,
  MongoShellTab,
  ConflictsTab,
  NotebookTabV2,
  TerminalTab,
  GalleryTab,
  NotebookViewerTab,
  DatabaseSettingsTab,
  DatabaseSettingsTabV2,
].forEach(({ component: { name, template } }) => ko.components.register(name, { template }));

// Panes
ko.components.register("add-database-pane", new PaneComponents.AddDatabasePaneComponent());
ko.components.register("add-collection-pane", new PaneComponents.AddCollectionPaneComponent());
ko.components.register(
  "delete-collection-confirmation-pane",
  new PaneComponents.DeleteCollectionConfirmationPaneComponent()
);
ko.components.register(
  "delete-database-confirmation-pane",
  new PaneComponents.DeleteDatabaseConfirmationPaneComponent()
);
ko.components.register("graph-new-vertex-pane", new PaneComponents.GraphNewVertexPaneComponent());
ko.components.register("graph-styling-pane", new PaneComponents.GraphStylingPaneComponent());
ko.components.register("table-add-entity-pane", new PaneComponents.TableAddEntityPaneComponent());
ko.components.register("table-edit-entity-pane", new PaneComponents.TableEditEntityPaneComponent());
ko.components.register("table-column-options-pane", new PaneComponents.TableColumnOptionsPaneComponent());
ko.components.register("table-query-select-pane", new PaneComponents.TableQuerySelectPaneComponent());
ko.components.register("cassandra-add-collection-pane", new PaneComponents.CassandraAddCollectionPaneComponent());
ko.components.register("settings-pane", new PaneComponents.SettingsPaneComponent());
ko.components.register("upload-items-pane", new PaneComponents.UploadItemsPaneComponent());
ko.components.register("load-query-pane", new PaneComponents.LoadQueryPaneComponent());
ko.components.register("save-query-pane", new PaneComponents.SaveQueryPaneComponent());
ko.components.register("browse-queries-pane", new PaneComponents.BrowseQueriesPaneComponent());
ko.components.register("upload-file-pane", new PaneComponents.UploadFilePaneComponent());
ko.components.register("string-input-pane", new PaneComponents.StringInputPaneComponent());
ko.components.register("setup-notebooks-pane", new PaneComponents.SetupNotebooksPaneComponent());
ko.components.register("github-repos-pane", new PaneComponents.GitHubReposPaneComponent());
