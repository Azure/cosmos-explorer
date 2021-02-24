import * as ko from "knockout";
import * as PaneComponents from "./Panes/PaneComponents";
import * as TabComponents from "./Tabs/TabComponents";
import { DiffEditorComponent } from "./Controls/DiffEditor/DiffEditorComponent";
import { DynamicListComponent } from "./Controls/DynamicList/DynamicListComponent";
import { EditorComponent } from "./Controls/Editor/EditorComponent";
import { ErrorDisplayComponent } from "./Controls/ErrorDisplayComponent/ErrorDisplayComponent";
import { GraphStyleComponent } from "./Graph/GraphStyleComponent/GraphStyleComponent";
import { InputTypeaheadComponent } from "./Controls/InputTypeahead/InputTypeahead";
import { JsonEditorComponent } from "./Controls/JsonEditor/JsonEditorComponent";
import { NewVertexComponent } from "./Graph/NewVertexComponent/NewVertexComponent";
import { TabsManagerKOComponent } from "./Tabs/TabsManager";
import { ThroughputInputComponentAutoPilotV3 } from "./Controls/ThroughputInput/ThroughputInputComponentAutoPilotV3";

ko.components.register("input-typeahead", new InputTypeaheadComponent());
ko.components.register("new-vertex-form", NewVertexComponent);
ko.components.register("error-display", new ErrorDisplayComponent());
ko.components.register("graph-style", GraphStyleComponent);
ko.components.register("editor", new EditorComponent());
ko.components.register("json-editor", new JsonEditorComponent());
ko.components.register("diff-editor", new DiffEditorComponent());
ko.components.register("dynamic-list", DynamicListComponent);
ko.components.register("throughput-input-autopilot-v3", ThroughputInputComponentAutoPilotV3);
ko.components.register("tabs-manager", TabsManagerKOComponent());

// Collection Tabs
ko.components.register("documents-tab", new TabComponents.DocumentsTab());
ko.components.register("mongo-documents-tab", new TabComponents.MongoDocumentsTab());
ko.components.register("stored-procedure-tab", new TabComponents.StoredProcedureTab());
ko.components.register("trigger-tab", new TabComponents.TriggerTab());
ko.components.register("user-defined-function-tab", new TabComponents.UserDefinedFunctionTab());
ko.components.register("collection-settings-tab-v2", new TabComponents.SettingsTabV2());
ko.components.register("query-tab", new TabComponents.QueryTab());
ko.components.register("tables-query-tab", new TabComponents.QueryTablesTab());
ko.components.register("graph-tab", new TabComponents.GraphTab());
ko.components.register("mongo-shell-tab", new TabComponents.MongoShellTab());
ko.components.register("conflicts-tab", new TabComponents.ConflictsTab());
ko.components.register("notebookv2-tab", new TabComponents.NotebookV2Tab());
ko.components.register("terminal-tab", new TabComponents.TerminalTab());
ko.components.register("gallery-tab", new TabComponents.GalleryTab());
ko.components.register("notebook-viewer-tab", new TabComponents.NotebookViewerTab());

// Database Tabs
ko.components.register("database-settings-tab", new TabComponents.DatabaseSettingsTab());
ko.components.register("database-settings-tab-v2", new TabComponents.SettingsTabV2());

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
ko.components.register("execute-sproc-params-pane", new PaneComponents.ExecuteSprocParamsComponent());
ko.components.register("upload-items-pane", new PaneComponents.UploadItemsPaneComponent());
ko.components.register("load-query-pane", new PaneComponents.LoadQueryPaneComponent());
ko.components.register("save-query-pane", new PaneComponents.SaveQueryPaneComponent());
ko.components.register("browse-queries-pane", new PaneComponents.BrowseQueriesPaneComponent());
ko.components.register("upload-file-pane", new PaneComponents.UploadFilePaneComponent());
ko.components.register("string-input-pane", new PaneComponents.StringInputPaneComponent());
ko.components.register("setup-notebooks-pane", new PaneComponents.SetupNotebooksPaneComponent());
ko.components.register("github-repos-pane", new PaneComponents.GitHubReposPaneComponent());
