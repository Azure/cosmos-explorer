import * as ko from "knockout";
import { DiffEditorComponent } from "./Controls/DiffEditor/DiffEditorComponent";
import { DynamicListComponent } from "./Controls/DynamicList/DynamicListComponent";
import { EditorComponent } from "./Controls/Editor/EditorComponent";
import { JsonEditorComponent } from "./Controls/JsonEditor/JsonEditorComponent";
import { ThroughputInputComponentAutoPilotV3 } from "./Controls/ThroughputInput/ThroughputInputComponentAutoPilotV3";
import * as PaneComponents from "./Panes/PaneComponents";

ko.components.register("editor", new EditorComponent());
ko.components.register("json-editor", new JsonEditorComponent());
ko.components.register("diff-editor", new DiffEditorComponent());
ko.components.register("dynamic-list", DynamicListComponent);
ko.components.register("throughput-input-autopilot-v3", ThroughputInputComponentAutoPilotV3);

// Panes
ko.components.register("cassandra-add-collection-pane", new PaneComponents.CassandraAddCollectionPaneComponent());
