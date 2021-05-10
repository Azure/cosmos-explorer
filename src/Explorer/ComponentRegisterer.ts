import * as ko from "knockout";
import { DiffEditorComponent } from "./Controls/DiffEditor/DiffEditorComponent";
import { DynamicListComponent } from "./Controls/DynamicList/DynamicListComponent";
import { EditorComponent } from "./Controls/Editor/EditorComponent";
import { ErrorDisplayComponent } from "./Controls/ErrorDisplayComponent/ErrorDisplayComponent";
import { InputTypeaheadComponent } from "./Controls/InputTypeahead/InputTypeahead";
import { JsonEditorComponent } from "./Controls/JsonEditor/JsonEditorComponent";
import { ThroughputInputComponentAutoPilotV3 } from "./Controls/ThroughputInput/ThroughputInputComponentAutoPilotV3";
import { GraphStyleComponent } from "./Graph/GraphStyleComponent/GraphStyleComponent";
import * as PaneComponents from "./Panes/PaneComponents";

ko.components.register("input-typeahead", new InputTypeaheadComponent());
ko.components.register("error-display", new ErrorDisplayComponent());
ko.components.register("graph-style", GraphStyleComponent);
ko.components.register("editor", new EditorComponent());
ko.components.register("json-editor", new JsonEditorComponent());
ko.components.register("diff-editor", new DiffEditorComponent());
ko.components.register("dynamic-list", DynamicListComponent);
ko.components.register("throughput-input-autopilot-v3", ThroughputInputComponentAutoPilotV3);

// Panes
ko.components.register("add-database-pane", new PaneComponents.AddDatabasePaneComponent());
ko.components.register("graph-styling-pane", new PaneComponents.GraphStylingPaneComponent());
ko.components.register("table-add-entity-pane", new PaneComponents.TableAddEntityPaneComponent());
ko.components.register("table-edit-entity-pane", new PaneComponents.TableEditEntityPaneComponent());
ko.components.register("cassandra-add-collection-pane", new PaneComponents.CassandraAddCollectionPaneComponent());
