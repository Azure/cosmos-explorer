import { Spinner, SpinnerSize } from "@fluentui/react";
import * as React from "react";
import { MonacoNamespace, loadMonaco, monaco } from "../../LazyMonaco";
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
  configureEditor?: (monaco: MonacoNamespace, editor: monaco.editor.IStandaloneCodeEditor) => void;
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
    if (this.props.content !== previous.content) {
      this.editor?.setValue(this.props.content);
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

  protected configureEditor(monaco: MonacoNamespace, editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    const queryEditorModel = this.editor.getModel();
    if (!this.props.isReadOnly && this.props.onContentChanged) {
      queryEditorModel.onDidChangeContent(() => {
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

    if (this.props.configureEditor) {
      this.props.configureEditor(monaco, this.editor);
    }
  }

  /**
   * Create the monaco editor and attach to DOM
   */
  private async createEditor(createCallback: (monaco: MonacoNamespace, e: monaco.editor.IStandaloneCodeEditor) => void) {
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
    createCallback(monaco, monaco?.editor?.create(this.rootNode, options));

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
