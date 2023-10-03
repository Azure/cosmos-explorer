import * as ViewModels from "../../../Contracts/ViewModels";
import { loadMonaco, monaco } from "../../LazyMonaco";
import { WaitsForTemplateViewModel } from "../../WaitsForTemplateViewModel";
import template from "./json-editor-component.html";

/**
 * Helper class for ko component registration
 */
export class JsonEditorComponent {
  constructor() {
    return {
      viewModel: JsonEditorViewModel,
      template,
    };
  }
}

/**
 * Parameters for this component
 */
export interface JsonEditorParams {
  content: ViewModels.Editable<string>; // Sets the initial content of the editor
  isReadOnly: boolean;
  ariaLabel: string; // Sets what will be read to the user to define the control
  updatedContent?: ViewModels.Editable<string>; // Gets updated when user edits
  selectedContent?: ViewModels.Editable<string>; // Gets updated when user selects content from the editor
  lineNumbers?: monaco.editor.IEditorOptions["lineNumbers"];
  theme?: string; // Monaco editor theme
}

/**
 * JSON Editor:
 *  A ko wrapper for the Monaco editor
 *
 * How to use in your markup:
 * <json-editor params="{ isReadOnly:true, content:myJsonString, ariaLabel: myDescriptiveAriaLabel }"></json-editor>
 *
 * In writable mode, if you want to get changes to the content pass updatedContent and subscribe to it.
 * content and updateContent are different to prevent circular updates.
 */
export class JsonEditorViewModel extends WaitsForTemplateViewModel {
  protected editorContainer: HTMLElement;
  protected params: JsonEditorParams;
  private static instanceCount = 0; // Generate unique id to get different monaco editor
  private editor: monaco.editor.IStandaloneCodeEditor;
  private instanceNumber: number;
  private resizer: EventListenerOrEventListenerObject;
  private observer: MutationObserver;
  private offsetWidth: number;
  private offsetHeight: number;
  private selectionListener: monaco.IDisposable;
  private latestContentVersionId: number;

  public constructor(params: JsonEditorParams) {
    super();

    this.instanceNumber = JsonEditorViewModel.instanceCount++;
    this.params = params;

    this.params.content.subscribe((newValue: string) => {
      if (newValue) {
        if (!!this.editor) {
          this.editor.getModel().setValue(newValue);
        } else {
          this.createEditor(newValue, this.configureEditor.bind(this));
        }
      }
    });

    const onObserve: MutationCallback = (mutations: MutationRecord[], observer: MutationObserver): void => {
      if (
        this.offsetWidth !== this.editorContainer.offsetWidth ||
        this.offsetHeight !== this.editorContainer.offsetHeight
      ) {
        this.editor.layout();
        this.offsetWidth = this.editorContainer.offsetWidth;
        this.offsetHeight = this.editorContainer.offsetHeight;
      }
    };
    this.observer = new MutationObserver(onObserve);
  }

  protected getEditorId(): string {
    return `jsoneditor${this.instanceNumber}`;
  }

  /**
   * Create the monaco editor and attach to DOM
   */
  protected async createEditor(content: string, createCallback: (e: monaco.editor.IStandaloneCodeEditor) => void) {
    this.registerCompletionItemProvider();
    this.editorContainer = document.getElementById(this.getEditorId());
    const options: monaco.editor.IEditorConstructionOptions = {
      value: content,
      language: this.getEditorLanguage(),
      readOnly: this.params.isReadOnly,
      lineNumbers: this.params.lineNumbers || "off",
      fontSize: 12,
      ariaLabel: this.params.ariaLabel,
      theme: this.params.theme,
    };

    this.editorContainer.innerHTML = "";
    const monaco = await loadMonaco();
    createCallback(monaco.editor.create(this.editorContainer, options));
  }

  // Interface. Will be implemented in children editor view model such as EditorViewModel.
  protected registerCompletionItemProvider() {}

  // Interface. Will be implemented in children editor view model such as EditorViewModel.
  protected async getErrorMarkers(_: string): Promise<monaco.editor.IMarkerData[]> {
    return [];
  }

  protected getEditorLanguage(): string {
    return "json";
  }

  protected async configureEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    const monaco = await loadMonaco();
    this.editor = editor;
    const queryEditorModel = this.editor.getModel();
    if (!this.params.isReadOnly && this.params.updatedContent) {
      queryEditorModel.onDidChangeContent((e: monaco.editor.IModelContentChangedEvent) => {
        const queryEditorModel = this.editor.getModel();
        this.params.updatedContent(queryEditorModel.getValue());
      });
    }

    if (this.params.selectedContent) {
      this.selectionListener = this.editor.onDidChangeCursorSelection(
        (event: monaco.editor.ICursorSelectionChangedEvent) => {
          const selectedContent: string = this.editor.getModel().getValueInRange(event.selection);
          this.params.selectedContent(selectedContent);
        },
      );
    }

    this.resizer = () => {
      editor.layout();
    };
    window.addEventListener("resize", this.resizer);

    this.offsetHeight = this.editorContainer.offsetHeight;
    this.offsetWidth = this.editorContainer.offsetWidth;

    this.observer.observe(document.body, {
      attributes: true,
      subtree: true,
      childList: true,
    });

    this.editor.getModel().onDidChangeContent(async (e: monaco.editor.IModelContentChangedEvent) => {
      if (!(<any>e).isFlush) {
        return;
      }

      this.latestContentVersionId = e.versionId;
      let input = (<any>e).changes[0].text;
      let marks = await this.getErrorMarkers(input);
      if (e.versionId === this.latestContentVersionId) {
        monaco.editor.setModelMarkers(this.editor.getModel(), "ErrorMarkerOwner", marks);
      }
    });
    this.editor.focus();
  }

  private dispose() {
    window.removeEventListener("resize", this.resizer);
    this.selectionListener && this.selectionListener.dispose();
    this.observer.disconnect();
  }
}
