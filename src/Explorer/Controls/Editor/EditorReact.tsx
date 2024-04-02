import { Spinner, SpinnerSize } from "@fluentui/react";
import * as React from "react";
import { loadMonaco, monaco } from "../../LazyMonaco";
// import "./EditorReact.less";

interface EditorReactStates {
  showEditor: boolean;
}
export interface EditorReactProps {
  language: string;
  content: string;
  isReadOnly: boolean;
  ariaLabel: string; // Sets what will be read to the user to define the control
  onContentSelected?: (selectedContent: string) => void; // Called when text is selected
  onContentChanged?: (newContent: string) => void; // Called when text is changed
  theme?: string; // Monaco editor theme
  wordWrap?: monaco.editor.IEditorOptions["wordWrap"];
  lineNumbers?: monaco.editor.IEditorOptions["lineNumbers"];
  lineNumbersMinChars?: monaco.editor.IEditorOptions["lineNumbersMinChars"];
  lineDecorationsWidth?: monaco.editor.IEditorOptions["lineDecorationsWidth"];
  minimap?: monaco.editor.IEditorOptions["minimap"];
  scrollBeyondLastLine?: monaco.editor.IEditorOptions["scrollBeyondLastLine"];
  monacoContainerStyles?: React.CSSProperties;
}

export class EditorReact extends React.Component<EditorReactProps, EditorReactStates> {
  private rootNode: HTMLElement;
  private editor: monaco.editor.IStandaloneCodeEditor;
  private selectionListener: monaco.IDisposable;

  public constructor(props: EditorReactProps) {
    super(props);
    this.state = {
      showEditor: false,
    };
  }

  public componentDidMount(): void {
    this.createEditor(this.configureEditor.bind(this));

    setTimeout(() => {
      const suggestionWidget = this.editor?.getDomNode()?.querySelector(".suggest-widget") as HTMLElement;
      if (suggestionWidget) {
        suggestionWidget.style.display = "none";
      }
    }, 100);
  }

  public componentDidUpdate(previous: EditorReactProps) {
    if (!this.editor) {
      // Nothing special to do if the editor doesn't exist yet
      return;
    }

    const existingContent = this.editor.getModel().getValue();

    // Compare the new content to the editor's existing content
    if (this.props.content !== existingContent) {
      // If it's different, push an edit to the editor, respecting the undo stack
      this.editor.executeEdits("", [
        {
          range: this.editor.getModel().getFullModelRange(),
          text: this.props.content,
        },
      ]);
    }
  }

  public componentWillUnmount(): void {
    this.selectionListener && this.selectionListener.dispose();
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        {!this.state.showEditor && <Spinner size={SpinnerSize.large} className="spinner" />}
        <div
          className="jsonEditor"
          style={this.props.monacoContainerStyles}
          ref={(elt: HTMLElement) => this.setRef(elt)}
        />
      </React.Fragment>
    );
  }

  protected configureEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    if (!this.props.isReadOnly && this.props.onContentChanged) {
      // Hooking the model's onDidChangeContent event because of some event ordering issues.
      // If a single user input causes BOTH the editor content to change AND the cursor selection to change (which is likely),
      // then there are some inconsistencies as to which event fires first.
      // But the editor.onDidChangeModelContent event seems to always fire before the cursor selection event.
      // (This is NOT true for the model's onDidChangeContent event, which sometimes fires after the cursor selection event.)
      // If the cursor selection event fires first, then the calling component may re-render the component with old content, so we want to ensure the model content changed event always fires first.
      this.editor.onDidChangeModelContent(() => {
        const queryEditorModel = this.editor.getModel();
        this.props.onContentChanged(queryEditorModel.getValue());
      });
    }

    if (this.props.onContentSelected) {
      this.selectionListener = this.editor.onDidChangeCursorSelection(
        (event: monaco.editor.ICursorSelectionChangedEvent) => {
          const selectedContent: string = this.editor.getModel().getValueInRange(event.selection);
          this.props.onContentSelected(selectedContent);
        },
      );
    }
  }

  /**
   * Create the monaco editor and attach to DOM
   */
  private async createEditor(createCallback: (e: monaco.editor.IStandaloneCodeEditor) => void) {
    const options: monaco.editor.IStandaloneEditorConstructionOptions = {
      language: this.props.language,
      value: this.props.content,
      readOnly: this.props.isReadOnly,
      ariaLabel: this.props.ariaLabel,
      fontSize: 12,
      automaticLayout: true,
      theme: this.props.theme,
      wordWrap: this.props.wordWrap || "off",
      lineNumbers: this.props.lineNumbers || "off",
      lineNumbersMinChars: this.props.lineNumbersMinChars,
      lineDecorationsWidth: this.props.lineDecorationsWidth,
      minimap: this.props.minimap,
      scrollBeyondLastLine: this.props.scrollBeyondLastLine,
    };

    this.rootNode.innerHTML = "";
    const monaco = await loadMonaco();
    createCallback(monaco?.editor?.create(this.rootNode, options));

    if (this.rootNode.innerHTML) {
      this.setState({
        showEditor: true,
      });
    }
  }

  private setRef(element: HTMLElement): void {
    this.rootNode = element;
  }
}
