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
  lineNumbers?: monaco.editor.IEditorOptions["lineNumbers"];
  theme?: string; // Monaco editor theme
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
      this.editor.setValue(this.props.content);
    }
  }

  public componentWillUnmount(): void {
    this.selectionListener && this.selectionListener.dispose();
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        {!this.state.showEditor && <Spinner size={SpinnerSize.large} className="spinner" />}
        <div className="jsonEditor" ref={(elt: HTMLElement) => this.setRef(elt)} />
      </React.Fragment>
    );
  }

  protected configureEditor(editor: monaco.editor.IStandaloneCodeEditor) {
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
