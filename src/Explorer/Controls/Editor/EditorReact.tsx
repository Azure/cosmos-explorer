import * as React from "react";
import { loadMonaco, monaco } from "../../LazyMonaco";

export interface EditorReactProps {
  language: string;
  content: string;
  isReadOnly: boolean;
  ariaLabel: string; // Sets what will be read to the user to define the control
  onContentSelected?: (selectedContent: string) => void; // Called when text is selected
  onContentChanged?: (newContent: string) => void; // Called when text is changed
  lineNumbers?: monaco.editor.IEditorOptions["lineNumbers"];
  theme?: string; // Monaco editor theme
}

export class EditorReact extends React.Component<EditorReactProps> {
  private rootNode: HTMLElement;
  private editor: monaco.editor.IStandaloneCodeEditor;
  private selectionListener: monaco.IDisposable;

  public constructor(props: EditorReactProps) {
    super(props);
  }

  public override componentDidMount(): void {
    this.createEditor(this.configureEditor.bind(this));
  }

  public override shouldComponentUpdate(): boolean {
    // Prevents component re-rendering
    return false;
  }

  public override componentWillUnmount(): void {
    this.selectionListener && this.selectionListener.dispose();
  }

  public override render(): JSX.Element {
    return <div className="jsonEditor" ref={(elt: HTMLElement) => this.setRef(elt)} />;
  }

  protected configureEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    const queryEditorModel = this.editor.getModel();
    if (!this.props.isReadOnly && this.props.onContentChanged) {
      queryEditorModel.onDidChangeContent((e: monaco.editor.IModelContentChangedEvent) => {
        const queryEditorModel = this.editor.getModel();
        this.props.onContentChanged(queryEditorModel.getValue());
      });
    }

    if (this.props.onContentSelected) {
      this.selectionListener = this.editor.onDidChangeCursorSelection(
        (event: monaco.editor.ICursorSelectionChangedEvent) => {
          const selectedContent: string = this.editor.getModel().getValueInRange(event.selection);
          this.props.onContentSelected(selectedContent);
        }
      );
    }
  }

  /**
   * Create the monaco editor and attach to DOM
   */
  private async createEditor(createCallback: (e: monaco.editor.IStandaloneCodeEditor) => void) {
    const options: monaco.editor.IEditorConstructionOptions = {
      value: this.props.content,
      language: this.props.language,
      readOnly: this.props.isReadOnly,
      lineNumbers: this.props.lineNumbers || "off",
      fontSize: 12,
      ariaLabel: this.props.ariaLabel,
      theme: this.props.theme,
      automaticLayout: true,
    };

    this.rootNode.innerHTML = "";
    const monaco = await loadMonaco();
    createCallback(monaco.editor.create(this.rootNode, options));
  }

  private setRef(element: HTMLElement): void {
    this.rootNode = element;
  }
}
