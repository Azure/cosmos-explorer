import { JsonEditorParams, JsonEditorViewModel } from "../JsonEditor/JsonEditorComponent";
import template from "./editor-component.html";
import * as monaco from "monaco-editor";
import { SqlCompletionItemProvider, ErrorMarkProvider } from "@azure/cosmos-language-service";

/**
 * Helper class for ko component registration
 */
export class EditorComponent {
  constructor() {
    return {
      viewModel: EditorViewModel,
      template
    };
  }
}

/**
 * Parameters for this component
 */
export interface EditorParams extends JsonEditorParams {
  contentType: string;
}

/**
 * This is a generic editor component that builds on top of the pre-existing JsonEditorComponent.
 */
// TODO: Ideally, JsonEditorViewModel should extend EditorViewModel and not the other way around
class EditorViewModel extends JsonEditorViewModel {
  public params: EditorParams;
  private static providerRegistered: string[] = [];

  public constructor(params: EditorParams) {
    super(params);
    this.params = params;
    super.createEditor.bind(this);

    /**
     * setTimeout is needed as creating the edtior manipulates the dom directly and expects
     * Knockout to have completed all of the initial bindings for the component
     */
    this.params.content() != null &&
      setTimeout(() => {
        this.createEditor(this.params.content(), this.configureEditor.bind(this));
      });
  }

  protected getEditorLanguage(): string {
    return this.params.contentType;
  }

  protected registerCompletionItemProvider() {
    let sqlCompletionItemProvider = new SqlCompletionItemProvider();
    if (EditorViewModel.providerRegistered.indexOf("sql") < 0) {
      // TODO Remove when @azure/cosmos-language-service is updated
      monaco.languages.registerCompletionItemProvider("sql", sqlCompletionItemProvider as any);
      EditorViewModel.providerRegistered.push("sql");
    }
  }

  protected getErrorMarkers(input: string): Q.Promise<monaco.editor.IMarkerData[]> {
    // TODO Remove when @azure/cosmos-language-service is updated
    return ErrorMarkProvider.getErrorMark(input) as any;
  }
}
