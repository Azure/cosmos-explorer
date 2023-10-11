import { loadMonaco, monaco } from "../../LazyMonaco";
import { JsonEditorParams, JsonEditorViewModel } from "../JsonEditor/JsonEditorComponent";
import template from "./editor-component.html";

/**
 * Helper class for ko component registration
 */
export class EditorComponent {
  constructor() {
    return {
      viewModel: EditorViewModel,
      template,
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

  protected async registerCompletionItemProvider() {
    if (EditorViewModel.providerRegistered.indexOf("sql") < 0) {
      const { SqlCompletionItemProvider } = await import("@azure/cosmos-language-service");
      const monaco = await loadMonaco();
      monaco.languages.registerCompletionItemProvider(
        "sql",
        // TODO cosmos-language-service could be outdated
        new SqlCompletionItemProvider() as unknown as monaco.languages.CompletionItemProvider,
      );
      EditorViewModel.providerRegistered.push("sql");
    }
  }

  protected async getErrorMarkers(input: string): Promise<monaco.editor.IMarkerData[]> {
    const { ErrorMarkProvider } = await import("@azure/cosmos-language-service");
    return ErrorMarkProvider.getErrorMark(input);
  }
}
