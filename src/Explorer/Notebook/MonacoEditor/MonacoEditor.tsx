import { Channels } from "@nteract/messaging";
// import * as monaco from "./monaco";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as React from "react";
// import { completionProvider } from "./completions/completionItemProvider";
import { AppState, ContentRef } from "@nteract/core";
import { connect } from "react-redux";
import "./styles.css";
import { LightThemeName, HCLightThemeName, DarkThemeName } from "./theme";
// import { logger } from "src/common/localLogger";
import { getCellMonacoLanguage } from "./selectors";
// import { DocumentUri } from "./documentUri";

export type IModelContentChangedEvent = monaco.editor.IModelContentChangedEvent;

/**
 * Initial props for Monaco received from agnostic component
 */
export interface IMonacoProps {
  id: string;
  contentRef: ContentRef;
  modelUri?: monaco.Uri;
  theme: monaco.editor.IStandaloneThemeData | monaco.editor.BuiltinTheme | string;
  cellLanguageOverride?: string;
  notebookLanguageOverride?: string;
  readOnly?: boolean;
  channels: Channels | undefined;
  enableCompletion: boolean;
  shouldRegisterDefaultCompletion?: boolean;
  onChange: (value: string, event?: any) => void;
  onFocusChange: (focus: boolean) => void;
  onCursorPositionChange?: (selection: monaco.ISelection | null) => void;
  onRegisterCompletionProvider?: (languageId: string) => void;
  value: string;
  editorFocused: boolean;
  lineNumbers: boolean;

  /** set height of editor to fit the specified number of lines in display */
  numberOfLines?: number;

  options?: monaco.editor.IEditorOptions;
}

/**
 * Monaco specific props derived from State
 */
interface IMonacoStateProps {
  language: string;
}

// Cache the custom theme data to avoid repeatly defining the custom theme
let customThemeData: monaco.editor.IStandaloneThemeData;

function getMonacoTheme(theme: monaco.editor.IStandaloneThemeData | monaco.editor.BuiltinTheme | string) {
  if (typeof theme === "string") {
    switch (theme) {
      case "vs-dark":
        return DarkThemeName;
      case "hc-black":
        return "hc-black";
      case "vs":
        return LightThemeName;
      case "hc-light":
        return HCLightThemeName;
      default:
        return LightThemeName;
    }
  } else if (theme === undefined || typeof theme === "undefined") {
    return LightThemeName;
  } else {
    const themeName = "custom-vs";

    // Skip redefining the same custom theme if it is the same theme data.
    if (customThemeData !== theme) {
      monaco.editor.defineTheme(themeName, theme);
      customThemeData = theme;
    }

    return themeName;
  }
}

const makeMapStateToProps = (initialState: AppState, initialProps: IMonacoProps) => {
  const { id, contentRef } = initialProps;
  function mapStateToProps(state: any, ownProps: IMonacoProps & IMonacoStateProps) {
    return {
      language: getCellMonacoLanguage(
        state,
        contentRef,
        id,
        ownProps.cellLanguageOverride,
        ownProps.notebookLanguageOverride
      )
    };
  }
  return mapStateToProps;
};

/**
 * Creates a MonacoEditor instance within the MonacoContainer div
 */
export class MonacoEditor extends React.Component<IMonacoProps & IMonacoStateProps> {
  editor?: monaco.editor.IStandaloneCodeEditor;
  editorContainerRef = React.createRef<HTMLDivElement>();
  contentHeight?: number;
  private cursorPositionListener?: monaco.IDisposable;

  constructor(props: IMonacoProps & IMonacoStateProps) {
    super(props);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.calculateHeight = this.calculateHeight.bind(this);
  }

  onDidChangeModelContent(e: monaco.editor.IModelContentChangedEvent) {
    if (this.editor) {
      if (this.props.onChange) {
        this.props.onChange(this.editor.getValue(), e);
      }

      this.calculateHeight();
    }
  }

  /**
   * Adjust the height of editor
   *
   * @remarks
   * The way to determine how many lines we should display in editor:
   * If numberOfLines is not set or set to 0, we adjust the height to fit the content
   * If numberOfLines is specified we respect that setting
   */
  calculateHeight() {
    // Make sure we have an editor
    if (!this.editor) {
      return;
    }

    // Make sure we have a model
    const model = this.editor.getModel();
    if (!model) {
      return;
    }

    if (this.editorContainerRef && this.editorContainerRef.current) {
      const expectedLines = this.props.numberOfLines || model.getLineCount();
      // The find & replace menu takes up 2 lines, that is why 2 line is set as the minimum number of lines
      // TODO: we should either disable the find/replace menu or auto expand the editor when find/replace is triggerred.
      const finalizedLines = Math.max(expectedLines, 1) + 1;
      const lineHeight = this.editor.getConfiguration().lineHeight;

      const contentHeight = finalizedLines * lineHeight;
      if (this.contentHeight !== contentHeight) {
        this.editorContainerRef.current.style.height = contentHeight + "px";
        this.editor.layout();
        this.contentHeight = contentHeight;
      }
    }
  }

  componentDidMount() {
    if (this.editorContainerRef && this.editorContainerRef.current) {
      // Register Jupyter completion provider if needed
      this.registerCompletionProvider();

      // Use Monaco model uri if provided. Otherwise, create a new model uri using editor id.
      const uri = this.props.modelUri ? this.props.modelUri : monaco.Uri.file(this.props.id);

      // Only create a new model if it does not exist. For example, when we double click on a markdown cell,
      // an editor model is created for it. Once we go back to markdown preview mode that doesn't use the editor,
      // double clicking on the markdown cell will again instantiate a monaco editor. In that case, we should
      // rebind the previously created editor model for the markdown instead of recreating one. Monaco does not
      // allow models to be recreated with the same uri.
      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(this.props.value, this.props.language, uri);
      }

      // Create Monaco editor backed by a Monaco model.
      this.editor = monaco.editor.create(this.editorContainerRef.current, {
        // Following are the default settings
        minimap: {
          enabled: false
        },
        autoIndent: true,
        overviewRulerLanes: 1,
        scrollbar: {
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
          vertical: "hidden",
          horizontal: "hidden",
          verticalScrollbarSize: 0,
          horizontalScrollbarSize: 0,
          arrowSize: 30
        },
        scrollBeyondLastLine: false,
        find: {
          // TODO Need this?
          // addExtraSpaceOnTop: false, // pops the editor out of alignment if turned on
          seedSearchStringFromSelection: true, // default is true
          autoFindInSelection: false // default is false
        },
        // Disable highlight current line, too much visual noise with it on.
        // VS Code also has it disabled for their notebook experience.
        renderLineHighlight: "none",

        // Allow editor pop up widgets such as context menus, signature help, hover tips to be able to be
        // displayed outside of the editor. Without this, the pop up widgets can be clipped.
        fixedOverflowWidgets: true,

        // Apply custom settings from configuration
        ...this.props.options,

        // Apply specific settings passed-in as direct props
        model,
        value: this.props.value,
        language: this.props.language,
        readOnly: this.props.readOnly,
        lineNumbers: this.props.lineNumbers ? "on" : "off",
        theme: getMonacoTheme(this.props.theme)
      });

      this.addEditorTopMargin();

      // Ignore Ctrl + Enter
      // tslint:disable-next-line no-bitwise
      this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        // Do nothing. This is handled elsewhere, we just don't want the editor to put the newline.
      }, undefined);
      // TODO Add right context

      this.toggleEditorOptions(this.props.editorFocused);

      if (this.props.editorFocused) {
        if (!this.editor.hasTextFocus()) {
          // Bring browser focus to the editor if text not already in focus
          this.editor.focus();
        }
        this.registerCursorListener();
      }

      // TODO: Need to remove the event listener when the editor is disposed, or we have a memory leak here.
      //       The same applies to the other event listeners below
      // Adds listener under the resize window event which calls the resize method
      window.addEventListener("resize", this.resize.bind(this));

      // Adds listeners for undo and redo actions emitted from the toolbar
      this.editorContainerRef.current.addEventListener("undo", () => {
        if (this.editor) {
          this.editor.trigger("undo-event", "undo", {});
        }
      });
      this.editorContainerRef.current.addEventListener("redo", () => {
        if (this.editor) {
          this.editor.trigger("redo-event", "redo", {});
        }
      });

      this.editor.onDidChangeModelContent(this.onDidChangeModelContent.bind(this));
      this.editor.onDidFocusEditorText(this.onFocus);
      this.editor.onDidBlurEditorText(this.onBlur);
      this.calculateHeight();

      // FIXME: This might need further investigation as the props value should be respected in construction
      // The following is a mitigation measure till that time
      // Ensures that the source contents of the editor (value) is consistent with the state of the editor
      this.editor.setValue(this.props.value);
    }
  }

  addEditorTopMargin() {
    if (this.editor) {
      // Monaco editor doesn't have margins
      // https://github.com/notable/notable/issues/551
      // This is a workaround to add an editor area 12px padding at the top
      // so that cursors rendered by collab decorators could be visible without being cut.
      this.editor.changeViewZones((changeAccessor) => {
        const domNode = document.createElement("div");
        changeAccessor.addZone({
          afterLineNumber: 0,
          heightInPx: 12,
          domNode
        });
      });
    }
  }

  /**
   * Tells editor to check the surrounding container size and resize itself appropriately
   */
  resize() {
    if (this.editor && this.props.editorFocused) {
      this.editor.layout();
    }
  }

  componentDidUpdate() {
    if (!this.editor) {
      return;
    }

    const { value, /* channels, language, contentRef, id, */ editorFocused, theme } = this.props;

    // Ensures that the source contents of the editor (value) is consistent with the state of the editor
    if (this.editor.getValue() !== value) {
      this.editor.setValue(value);
    }

    // completionProvider.setChannels(channels);

    // Register Jupyter completion provider if needed
    this.registerCompletionProvider();

    /*
    // Apply new model to the editor when the language is changed.
    const model = this.editor.getModel();
    if (model && language && model.getModeId() !== language) {
      const newUri = DocumentUri.createCellUri(contentRef, id, language);
      if (!monaco.editor.getModel(newUri)) {
        // Save the cursor position before we set new model.
        const position = this.editor.getPosition();

        // Set new model targeting the changed language.
        this.editor.setModel(monaco.editor.createModel(value, language, newUri));
        this.addEditorTopMargin();

        // Restore cursor position to new model.
        if (position) {
          this.editor.setPosition(position);
        }

        // Dispose of the old model in a seperate event. We cannot dispose of the model within the
        // componentDidUpdate method or else the editor will throw an exception. Zero in the timeout field
        // means execute immediately but in a seperate next event.
        setTimeout(() => model.dispose(), 0);
      }
    }
    */

    if (theme) {
      monaco.editor.setTheme(getMonacoTheme(theme));
    }

    // In the multi-tabs scenario, when the notebook is hidden by setting "display:none",
    // Any state update propagated here would cause a UI re-layout, monaco-editor will then recalculate
    // and set its height to 5px.
    // To work around that issue, we skip updating the UI when paraent element's offsetParent is null (which
    // indicate an ancient element is hidden by display set to none)
    // We may revisit this when we get to refactor for multi-notebooks.
    if (!this.editorContainerRef.current?.offsetParent) {
      return;
    }

    // Set focus
    if (editorFocused && !this.editor.hasTextFocus()) {
      this.editor.focus();
    }

    // Tells the editor pane to check if its container has changed size and fill appropriately
    this.editor.layout();
  }

  componentWillUnmount() {
    if (this.editor) {
      try {
        const model = this.editor.getModel();
        if (model) {
          model.dispose();
        }

        this.editor.dispose();
      } catch (err) {
        console.error(`Error occurs in disposing editor: ${JSON.stringify(err)}`);
      }
    }
  }

  render() {
    return (
      <div className="monaco-container">
        <div ref={this.editorContainerRef} id={`editor-${this.props.id}`} />
      </div>
    );
  }

  /**
   * Register default kernel-based completion provider.
   * @param language Language
   */
  registerDefaultCompletionProvider(language: string) {
    // onLanguage event is emitted only once per language when language is first time needed.
    monaco.languages.onLanguage(language, () => {
      // monaco.languages.registerCompletionItemProvider(language, completionProvider);
    });
  }

  private onFocus() {
    this.props.onFocusChange(true);
    this.toggleEditorOptions(true);
    this.registerCursorListener();
  }

  private onBlur() {
    this.props.onFocusChange(false);
    this.toggleEditorOptions(false);
    this.unregisterCursorListener();
  }

  private registerCursorListener() {
    if (this.editor && this.props.onCursorPositionChange) {
      const selection = this.editor.getSelection();
      this.props.onCursorPositionChange(selection);

      if (!this.cursorPositionListener) {
        this.cursorPositionListener = this.editor.onDidChangeCursorSelection((event) =>
          this.props.onCursorPositionChange!(event.selection)
        );
      }
    }
  }

  private unregisterCursorListener() {
    if (this.cursorPositionListener) {
      this.cursorPositionListener.dispose();
      this.cursorPositionListener = undefined;
    }
  }

  /**
   * Toggle editor options based on if the editor is in active state (i.e. focused).
   * When the editor is not active, we want to deactivate some of the visual noise.
   * @param isActive Whether editor is active.
   */
  private toggleEditorOptions(isActive: boolean) {
    if (this.editor) {
      this.editor.updateOptions({
        matchBrackets: isActive,
        occurrencesHighlight: isActive,
        renderIndentGuides: isActive
      });
    }
  }

  /**
   * Register language features for target language. Call before setting language type to model.
   */
  private registerCompletionProvider() {
    const { enableCompletion, language, onRegisterCompletionProvider, shouldRegisterDefaultCompletion } = this.props;

    if (enableCompletion && language) {
      if (onRegisterCompletionProvider) {
        onRegisterCompletionProvider(language);
      } else if (shouldRegisterDefaultCompletion) {
        this.registerDefaultCompletionProvider(language);
      }
    }
  }
}

export default connect<IMonacoStateProps, void, IMonacoProps, AppState>(makeMapStateToProps)(MonacoEditor);
