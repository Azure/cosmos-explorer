import * as ViewModels from "../../../Contracts/ViewModels";
import { loadMonaco, monaco } from "../../LazyMonaco";
import template from "./diff-editor-component.html";

/**
 * Helper class for ko component registration
 */
export class DiffEditorComponent {
  constructor() {
    return {
      viewModel: DiffEditorViewModel,
      template,
    };
  }
}

/**
 * Parameters for this component
 */
export interface DiffEditorParams {
  originalContent: ViewModels.Editable<string>; // Sets the editable content
  modifiedContent: ViewModels.Editable<string>; // Sets the content to compare against
  ariaLabel: string; // Sets what will be read to the user to define the control
  editorLanguage: string; // Sets the editor language
  isReadOnly?: boolean;
  updatedContent?: ViewModels.Editable<string>; // Gets updated when user edits
  selectedContent?: ViewModels.Editable<string>; // Gets updated when user selects content from the editor
  lineNumbers?: monaco.editor.IEditorOptions["lineNumbers"];
  theme?: string; // Monaco editor theme
  renderSideBySide?: boolean; // Optionally make differences render side by side. Default true.
}

/**
 * Diff Editor:
 *  A ko wrapper for the Monaco editor in Diff mode
 *
 * How to use in your markup:
 * <diff-editor params="{ originalContent:myJsonString, modifiedContent:jsonWithChanges, ariaLabel: myDescriptiveAriaLabel }"></json-editor>
 *
 * In writable mode, if you want to get changes to the originalContent pass updatedContent and subscribe to it.
 * originalContent and updateContent are different to prevent circular updates.
 */
export class DiffEditorViewModel {
  protected editorContainer: HTMLElement;
  protected params: DiffEditorParams;
  private static instanceCount = 0; // Generate unique id to get different monaco editor
  private editor: monaco.editor.IStandaloneDiffEditor;
  private instanceNumber: number;
  private resizer: EventListenerOrEventListenerObject;
  private observer: MutationObserver;
  private offsetWidth: number;
  private offsetHeight: number;
  private selectionListener: monaco.IDisposable;

  public constructor(params: DiffEditorParams) {
    this.instanceNumber = DiffEditorViewModel.instanceCount++;
    this.params = params;

    this.params.originalContent.subscribe((newValue: string) => {
      if (!!this.editor) {
        this.editor.getModel().original.setValue(newValue);
      } else if (!!this.params.modifiedContent) {
        this.createDiffEditor(newValue, this.params.modifiedContent(), this.configureEditor.bind(this));
      }
    });

    this.params.modifiedContent.subscribe((newValue: string) => {
      if (!!this.editor) {
        this.editor.getModel().modified.setValue(newValue);
      } else if (!!this.params.originalContent) {
        this.createDiffEditor(this.params.originalContent(), newValue, this.configureEditor.bind(this));
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
    return `jsondiffeditor${this.instanceNumber}`;
  }

  /**
   * Create the monaco editor on diff mode and attach to DOM
   */
  protected async createDiffEditor(
    originalContent: string,
    modifiedContent: string,
    createCallback: (e: monaco.editor.IStandaloneDiffEditor) => void,
  ) {
    this.editorContainer = document.getElementById(this.getEditorId());
    this.editorContainer.innerHTML = "";
    const options: monaco.editor.IStandaloneDiffEditorConstructionOptions = {
      lineNumbers: this.params.lineNumbers || "off",
      fontSize: 12,
      ariaLabel: this.params.ariaLabel,
      theme: this.params.theme,
    };

    if (this.params.renderSideBySide !== undefined) {
      options.renderSideBySide = this.params.renderSideBySide;
    }

    const language = this.params.editorLanguage || "json";
    const monaco = await loadMonaco();
    const originalModel = monaco.editor.createModel(originalContent, language);
    const modifiedModel = monaco.editor.createModel(modifiedContent, language);
    const diffEditor: monaco.editor.IStandaloneDiffEditor = monaco.editor.createDiffEditor(
      this.editorContainer,
      options,
    );
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    createCallback(diffEditor);
  }

  protected configureEditor(editor: monaco.editor.IStandaloneDiffEditor) {
    this.editor = editor;
    const modifiedEditorModel = this.editor.getModel().modified;
    if (!this.params.isReadOnly && this.params.updatedContent) {
      modifiedEditorModel.onDidChangeContent((e: monaco.editor.IModelContentChangedEvent) => {
        const modifiedEditorModel = this.editor.getModel().modified;
        this.params.updatedContent(modifiedEditorModel.getValue());
      });
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
    this.editor.focus();
  }

  private dispose() {
    window.removeEventListener("resize", this.resizer);
    this.selectionListener && this.selectionListener.dispose();
    this.observer.disconnect();
  }
}
