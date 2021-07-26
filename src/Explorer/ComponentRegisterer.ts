import * as ko from "knockout";
import { DiffEditorComponent } from "./Controls/DiffEditor/DiffEditorComponent";
import { EditorComponent } from "./Controls/Editor/EditorComponent";
import { JsonEditorComponent } from "./Controls/JsonEditor/JsonEditorComponent";

ko.components.register("editor", new EditorComponent());
ko.components.register("json-editor", new JsonEditorComponent());
ko.components.register("diff-editor", new DiffEditorComponent());
