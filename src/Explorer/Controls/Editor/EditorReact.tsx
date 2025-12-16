import { Spinner, SpinnerSize } from "@fluentui/react";
import { monacoTheme, useThemeStore } from "hooks/useTheme";
import * as React from "react";
import { loadMonaco, monaco } from "../../LazyMonaco";
// import "./EditorReact.less";

// In development, add a function to window to allow us to get the editor instance for a given element
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  win._monaco_getEditorForElement =
    win._monaco_getEditorForElement ||
    ((element: HTMLElement) => {
      const editorId = element.dataset["monacoEditorId"];
      if (!editorId || !win.__monaco_editors || typeof win.__monaco_editors !== "object") {
        return null;
      }
      return win.__monaco_editors[editorId];
    });

  win._monaco_getEditorContentForElement =
    win._monaco_getEditorContentForElement ||
    ((element: HTMLElement) => {
      const editor = win._monaco_getEditorForElement(element);
      return editor ? editor.getValue() : null;
    });

  win._monaco_setEditorContentForElement =
    win._monaco_setEditorContentForElement ||
    ((element: HTMLElement, text: string) => {
      const editor = win._monaco_getEditorForElement(element);
      if (editor) {
        editor.setValue(text);
      }
    });
}

interface EditorReactStates {
  showEditor: boolean;
}
export interface EditorReactProps {
  language: string;
  content: string;
  isReadOnly: boolean;
  ariaLabel: string; // Sets what will be read to the user to define the control
  onContentSelected?: (selectedContent: string, selection: monaco.Selection) => void; // Called when text is selected
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

  modelMarkers?: monaco.editor.IMarkerData[];
  enableWordWrapContextMenuItem?: boolean; // Enable/Disable "Word Wrap" context menu item
  onWordWrapChanged?: (wordWrap: "on" | "off") => void; // Called when word wrap is changed
}

export class EditorReact extends React.Component<EditorReactProps, EditorReactStates> {
  private static readonly VIEWING_OPTIONS_GROUP_ID = "viewingoptions"; // Group ID for the context menu group
  private rootNode: HTMLElement;
  public editor: monaco.editor.IStandaloneCodeEditor;
  private selectionListener: monaco.IDisposable;
  private themeUnsubscribe: () => void;
  monacoApi: {
    default: typeof monaco;
    Emitter: typeof monaco.Emitter;
    MarkerTag: typeof monaco.MarkerTag;
    MarkerSeverity: typeof monaco.MarkerSeverity;
    CancellationTokenSource: typeof monaco.CancellationTokenSource;
    Uri: typeof monaco.Uri;
    KeyCode: typeof monaco.KeyCode;
    KeyMod: typeof monaco.KeyMod;
    Position: typeof monaco.Position;
    Range: typeof monaco.Range;
    Selection: typeof monaco.Selection;
    SelectionDirection: typeof monaco.SelectionDirection;
    Token: typeof monaco.Token;
    editor: typeof monaco.editor;
    languages: typeof monaco.languages;
  };

  public constructor(props: EditorReactProps) {
    super(props);
    this.state = {
      showEditor: false,
    };
  }

  public componentDidMount(): void {
    this.createEditor(this.configureEditor.bind(this));

    this.themeUnsubscribe = useThemeStore.subscribe((state) => {
      if (this.editor) {
        const newTheme = state.isDarkMode ? "vs-dark" : "vs";
        this.monacoApi?.editor.setTheme(newTheme);
      }
    });

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
        this.editor.setValue(this.props.content || ""); // Monaco throws an error if you set the value to undefined.
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

    this.monacoApi.editor.setModelMarkers(this.editor.getModel(), "owner", this.props.modelMarkers || []);
  }

  public componentWillUnmount(): void {
    this.selectionListener && this.selectionListener.dispose();
    this.themeUnsubscribe && this.themeUnsubscribe();
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        {!this.state.showEditor && (
          <Spinner size={SpinnerSize.large} className={this.props.spinnerClassName || "spinner"} />
        )}
        <div
          data-test="EditorReact/Host/Unloaded"
          className={this.props.className || "jsonEditor"}
          style={this.props.monacoContainerStyles}
          ref={(elt: HTMLElement) => this.setRef(elt)}
        />
      </React.Fragment>
    );
  }

  protected configureEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    this.rootNode.dataset["test"] = "EditorReact/Host/Loaded";

    // In development, we want to be able to access the editor instance from the console
    if (process.env.NODE_ENV === "development") {
      this.rootNode.dataset["monacoEditorId"] = this.editor.getId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;

      win["__monaco_editors"] = win["__monaco_editors"] || {};
      win["__monaco_editors"][this.editor.getId()] = this.editor;
    }

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
          this.props.onContentSelected(selectedContent, event.selection);
        },
      );
    }

    if (this.props.enableWordWrapContextMenuItem) {
      editor.addAction({
        // An unique identifier of the contributed action.
        id: "wordwrap",
        label: "Toggle Word Wrap",
        contextMenuGroupId: EditorReact.VIEWING_OPTIONS_GROUP_ID,
        contextMenuOrder: 1,
        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convenience
        run: (ed) => {
          const newOption = ed.getOption(this.monacoApi.editor.EditorOption.wordWrap) === "on" ? "off" : "on";
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
      theme: monacoTheme(),
      wordWrap: this.props.wordWrap || "off",
      lineNumbers: this.props.lineNumbers || "off",
      lineNumbersMinChars: this.props.lineNumbersMinChars,
      lineDecorationsWidth: this.props.lineDecorationsWidth,
      minimap: this.props.minimap,
      scrollBeyondLastLine: this.props.scrollBeyondLastLine,
      fixedOverflowWidgets: true,
    };

    this.rootNode.innerHTML = "";
    this.monacoApi = await loadMonaco();

    try {
      createCallback(this.monacoApi.editor.create(this.rootNode, options));
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
