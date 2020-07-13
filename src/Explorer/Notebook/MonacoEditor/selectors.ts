import { AppState, ContentRef, selectors as nteractSelectors } from "@nteract/core";
import { CellId } from "@nteract/commutable";
import { Mode, mapCodeMirrorModeToMonaco } from "./converter";

/**
 * Returns the language to use for syntax highlighting and autocompletion in the Monaco Editor for a given cell, falling back to the notebook language if one for the cell is not defined.
 */
export const getCellMonacoLanguage = (
  state: AppState,
  contentRef: ContentRef,
  cellId: CellId,
  cellLanguageOverride?: string,
  notebookLanguageOverride?: string
): string => {
  const model = nteractSelectors.model(state, { contentRef });
  if (!model || model.type !== "notebook") {
    throw new Error("Connected Editor components should not be used with non-notebook models");
  }

  const cell = nteractSelectors.notebook.cellById(model, { id: cellId });
  if (!cell) {
    throw new Error("Invalid cell id");
  }

  switch (cell.cell_type) {
    case "markdown":
      return Mode.markdown;
    case "raw":
      return Mode.raw;
    case "code":
      if (cellLanguageOverride) {
        return mapCodeMirrorModeToMonaco(cellLanguageOverride);
      } else {
        // Fall back to notebook language if cell language isn't present.
        return getNotebookMonacoLanguage(state, contentRef, notebookLanguageOverride);
      }
  }
};

/**
 * Returns the language to use for syntax highlighting and autocompletion in the Monaco Editor for a given notebook.
 */
export const getNotebookMonacoLanguage = (
  state: AppState,
  contentRef: ContentRef,
  notebookLanguageOverride?: string
): string => {
  const model = nteractSelectors.model(state, { contentRef });
  if (!model || model.type !== "notebook") {
    throw new Error("Connected Editor components should not be used with non-notebook models");
  }

  if (notebookLanguageOverride) {
    return mapCodeMirrorModeToMonaco(notebookLanguageOverride);
  }

  const kernelRef = model.kernelRef;
  let codeMirrorMode;
  // Try to get the CodeMirror mode from the kernel.
  if (kernelRef) {
    codeMirrorMode = nteractSelectors.kernel(state, { kernelRef })?.info?.codemirrorMode;
  }
  // As a fallback, get the CodeMirror mode from the notebook itself.
  codeMirrorMode = codeMirrorMode ?? nteractSelectors.notebook.codeMirrorMode(model);

  return mapCodeMirrorModeToMonaco(codeMirrorMode);
};
