import * as ko from "knockout";
import { DiffEditorComponent } from "./Controls/DiffEditor/DiffEditorComponent";
import { DynamicListComponent } from "./Controls/DynamicList/DynamicListComponent";
import { EditorComponent } from "./Controls/Editor/EditorComponent";
import { JsonEditorComponent } from "./Controls/JsonEditor/JsonEditorComponent";

ko.components.register("editor", new EditorComponent());
ko.components.register("json-editor", new JsonEditorComponent());
ko.components.register("diff-editor", new DiffEditorComponent());
ko.components.register("dynamic-list", DynamicListComponent);
