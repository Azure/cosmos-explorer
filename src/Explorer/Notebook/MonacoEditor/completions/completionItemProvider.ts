import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// import * as monaco from "../monaco";
import { Observable, Observer } from "rxjs";
import { first, map } from "rxjs/operators";
import { childOf, JupyterMessage, ofMessageType, Channels } from "@nteract/messaging";

/**
 * TODO: import from nteract when the changes under editor-base.ts are ported to nteract.
 */
import { CompletionResults, CompletionMatch, completionRequest, js_idx_to_char_idx } from "../editor-base";

/**
 * Jupyter to Monaco completion item kinds.
 */
const unknownJupyterKind = "<unknown>";
const jupyterToMonacoCompletionItemKind = {
  [unknownJupyterKind]: monaco.languages.CompletionItemKind.Field,
  class: monaco.languages.CompletionItemKind.Class,
  function: monaco.languages.CompletionItemKind.Function,
  keyword: monaco.languages.CompletionItemKind.Keyword,
  instance: monaco.languages.CompletionItemKind.Variable,
  statement: monaco.languages.CompletionItemKind.Variable
};

/**
 * Completion item provider.
 */
class CompletionItemProvider implements monaco.languages.CompletionItemProvider {
  private channels: Channels | undefined;

  /**
   * Set Channels of Jupyter kernel.
   * @param channels Channels of Jupyter kernel.
   */
  setChannels(channels: Channels | undefined) {
    this.channels = channels;
  }

  /**
   * Whether provider is connected to Jupyter kernel.
   */
  get isConnectedToKernel() {
    return !!this.channels;
  }

  /**
   * Additional characters to trigger completion other than Ctrl+Space.
   */
  get triggerCharacters() {
    return [" ", "<", "/", ".", "="];
  }

  /**
   * Get list of completion items at position of cursor.
   * @param model Monaco editor text model.
   * @param position Position of cursor.
   */
  async provideCompletionItems(model: monaco.editor.ITextModel, position: monaco.Position) {
    // Convert to zero-based index
    let cursorPos = model.getOffsetAt(position);
    const code = model.getValue();
    cursorPos = js_idx_to_char_idx(cursorPos, code);

    // Get completions from Jupyter kernel if its Channels is connected
    let items = [];
    if (this.channels) {
      try {
        const message = completionRequest(code, cursorPos);
        items = await this.codeCompleteObservable(this.channels, message, model).toPromise();
      } catch (error) {
        // Temporary log error to console until we settle on how we log in V3
        // tslint:disable-next-line
        console.error(error);
      }
    }

    return Promise.resolve<monaco.languages.CompletionList>({
      suggestions: items,
      incomplete: false
    });
  }

  /**
   * Get list of completion items from Jupyter kernel.
   * @param channels Channels of Jupyter kernel.
   * @param message Jupyter message for completion request.
   * @param model Text model.
   */
  private codeCompleteObservable(channels: Channels, message: JupyterMessage, model: monaco.editor.ITextModel) {
    // Process completion response
    const completion$ = channels.pipe(
      childOf(message),
      ofMessageType("complete_reply"),
      map(entry => entry.content),
      first(),
      map(results => this.adaptToMonacoCompletions(results, model))
    );

    // Subscribe and send completion request message
    return Observable.create((observer: Observer<unknown>) => {
      const subscription = completion$.subscribe(observer);
      channels.next(message);
      return subscription;
    });
  }

  /**
   * Converts Jupyter completion result to list of Monaco completion items.
   */
  private adaptToMonacoCompletions(results: CompletionResults, model: monaco.editor.ITextModel) {
    let range: monaco.IRange;
    let percentCount = 0;
    let matches = results ? results.matches : [];
    if (results.metadata && results.metadata._jupyter_types_experimental) {
      matches = results.metadata._jupyter_types_experimental as CompletionMatch[];
    }
    return matches.map((match: CompletionMatch, index: number) => {
      if (typeof match === "string") {
        const text = this.sanitizeText(match);
        const filtered = this.getFilterText(text);
        return {
          kind: this.adaptToMonacoCompletionItemKind(unknownJupyterKind),
          label: text,
          insertText: text,
          filterText: filtered,
          sortText: this.getSortText(index)
        } as monaco.languages.CompletionItem;
      } else {
        // We only need to get the range once as the range is the same for all completion items in the list.
        if (!range) {
          const start = model.getPositionAt(match.start);
          const end = model.getPositionAt(match.end);
          range = {
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column
          };

          // Get the range representing the text before the completion action was invoked.
          // If the text starts with magics % indicator, we need to track how many of these indicators exist
          // so that we ensure the insertion text only inserts the delta between what the user typed versus
          // what is recommended by the completion. Without this, there will be extra % insertions.
          // Example:
          // User types %%p then suggestion list will recommend %%python, if we now commit the item then the
          // final text in the editor becomes %%p%%python instead of %%python. This is why the tracking code
          // below is needed. This behavior is only specific to the magics % indicators as Monaco does not
          // handle % characters in their completion list well.
          const rangeText = model.getValueInRange(range);
          if (rangeText.startsWith("%%")) {
            percentCount = 2;
          } else if (rangeText.startsWith("%")) {
            percentCount = 1;
          }
        }

        const text = this.sanitizeText(match.text);
        const filtered = this.getFilterText(text);
        const insert = this.getInsertText(text, percentCount);
        return {
          kind: this.adaptToMonacoCompletionItemKind(match.type as keyof typeof jupyterToMonacoCompletionItemKind),
          label: text,
          insertText: percentCount > 0 ? insert : text,
          filterText: filtered,
          sortText: this.getSortText(index)
        } as monaco.languages.CompletionItem;
      }
    });
  }

  /**
   * Converts Jupyter completion item kind to Monaco completion item kind.
   * @param kind Jupyter completion item kind.
   */
  private adaptToMonacoCompletionItemKind(kind: keyof typeof jupyterToMonacoCompletionItemKind) {
    const result = jupyterToMonacoCompletionItemKind[kind];
    return result ? result : jupyterToMonacoCompletionItemKind[unknownJupyterKind];
  }

  /**
   * Remove everything before a dot. Jupyter completion results like to include all characters before
   * the trigger character. For example, if user types "myarray.", we expect the completion results to
   * show "append", "pop", etc. but for the actual case, it will show "myarray.append", "myarray.pop",
   * etc. so we are going to sanitize the text.
   * @param text Text of Jupyter completion item
   */
  private sanitizeText(text: string) {
    const index = text.lastIndexOf(".");
    return index > -1 && index < text.length - 1 ? text.substring(index + 1) : text;
  }

  /**
   * Remove magics all % characters as Monaco doesn't like them for the filtering text.
   * Without this, completion won't show magics match items.
   * @param text Text of Jupyter completion item.
   */
  private getFilterText(text: string) {
    return text.replace(/%/g, "");
  }

  /**
   * Get insertion text handling what to insert for the magics case depending on what
   * has already been typed.
   * @param text Text of Jupyter completion item.
   * @param percentCount Number of percent characters to remove
   */
  private getInsertText(text: string, percentCount: number) {
    for (let i = 0; i < percentCount; i++) {
      text = text.replace("%", "");
    }
    return text;
  }

  /**
   * Maps numbers to strings, such that if a>b numerically, f(a)>f(b) lexicograhically.
   * 1 -> "za", 26 -> "zz", 27 -> "zza", 28 -> "zzb", 52 -> "zzz", 53 ->"zzza"
   * @param order Number to be converted to a sorting-string. order >= 0.
   * @returns A string representing the order.
   */
  private getSortText(order: number): string {
    order++;
    const numCharacters = 26; // "z" - "a" + 1;
    const div = Math.floor(order / numCharacters);

    let sortText = "z";
    for (let i = 0; i < div; i++) {
      sortText += "z";
    }

    const remainder = order % numCharacters;
    if (remainder > 0) {
      sortText += String.fromCharCode(96 + remainder);
    }
    return sortText;
  }
}

const completionProvider = new CompletionItemProvider();
export { completionProvider };
