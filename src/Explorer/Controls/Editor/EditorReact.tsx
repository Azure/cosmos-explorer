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
  fontSize?: monaco.editor.IEditorOptions["fontSize"];
  monacoContainerStyles?: React.CSSProperties;
  className?: string;
  spinnerClassName?: string;
  enableGotoSymbolContextMenuItem?: boolean; // Enable/Disable "Go to Symbol..." context menu item

  enableWordWrapContextMenuItem?: boolean; // Enable/Disable "Word Wrap" context menu item
  onWordWrapChanged?: (wordWrap: "on" | "off") => void; // Called when word wrap is changed
}

export class EditorReact extends React.Component<EditorReactProps, EditorReactStates> {
  private rootNode: HTMLElement;
  private editor: monaco.editor.IStandaloneCodeEditor;
  private selectionListener: monaco.IDisposable;

  private monacoEditorOptionsWordWrap: monaco.editor.EditorOption;

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

  public componentDidUpdate() {
    if (!this.editor) {
      return;
    }

    const existingContent = this.editor.getModel().getValue();

    if (this.props.content !== existingContent) {
      if (this.props.isReadOnly) {
        this.editor.setValue(this.props.content);
      } else {
        this.editor.pushUndoStop();
        this.editor.executeEdits("", [
          {
            range: this.editor.getModel().getFullModelRange(),
            text: this.props.content,
          },
        ]);
      }
    }
  }

  public componentWillUnmount(): void {
    this.selectionListener && this.selectionListener.dispose();
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        {!this.state.showEditor && (
          <Spinner size={SpinnerSize.large} className={this.props.spinnerClassName || "spinner"} />
        )}
        <div
          className={this.props.className || "jsonEditor"}
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

    // Remove "Go to Symbol..." from Context menu
    if (!this.props.enableGotoSymbolContextMenuItem) {
      // This uses a private api to remove the "Go to Symbol..." context menu item
      const removableIds = ["editor.action.quickOutline"];
      const contextmenu = this.editor.getContribution("editor.contrib.contextmenu");
      const realMethod = (contextmenu as monaco.editor.IEditorContribution & { _getMenuActions: () => void })
        ._getMenuActions;

      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions -- Monaco needs a function
      (contextmenu as monaco.editor.IEditorContribution & { _getMenuActions: () => void })._getMenuActions =
        function () {
          // eslint-disable-next-line prefer-rest-params
          const items: { id: string }[] = realMethod.apply(contextmenu, arguments);
          const filteredItems = items.filter((item: { id: string }) => !removableIds.includes(item.id));

          // Remove separator if it is the first item
          if (filteredItems[0].id === "vs.actions.separator") {
            filteredItems.shift();
          }

          // Remove separator if it is the last item
          if (filteredItems[filteredItems.length - 1].id === "vs.actions.separator") {
            filteredItems.pop();
          }
          return filteredItems;
        };
    }

    if (this.props.enableWordWrapContextMenuItem) {
      editor.addAction({
        // An unique identifier of the contributed action.
        id: "wordwrap",

        label: "Toggle Word Wrap",

        // A precondition for this action.
        precondition: null,

        // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
        keybindingContext: null,

        contextMenuGroupId: "navigation",

        contextMenuOrder: 1,

        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convenience
        run: (ed) => {
          const newOption = ed.getOption(this.monacoEditorOptionsWordWrap) === "on" ? "off" : "on";
          ed.updateOptions({ wordWrap: newOption });
          this.props.onWordWrapChanged(newOption);
        },
      });
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
      fontSize: this.props.fontSize || 12,
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
    const lazymonaco = await loadMonaco();

    // We can only get this constant after loading monaco lazily
    this.monacoEditorOptionsWordWrap = lazymonaco.editor.EditorOption.wordWrap;

    try {
      createCallback(lazymonaco?.editor?.create(this.rootNode, options));
    } catch (error) {
      // This could happen if the parent node suddenly disappears during create()
      console.error("Unable to create EditorReact", error);
      return;
    }

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
