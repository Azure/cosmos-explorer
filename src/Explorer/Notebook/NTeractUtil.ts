import { NotebookContentRecordProps, selectors } from "@nteract/core";

/**
 * A bunch of utilities to interact with nteract
 */
  export function getCurrentCellType(content: NotebookContentRecordProps): "markdown" | "code" | "raw" | undefined {
    if (!content) {
      return undefined;
    }

    const cellFocusedId = selectors.notebook.cellFocused(content.model);
    if (cellFocusedId) {
      const cell = selectors.notebook.cellById(content.model, { id: cellFocusedId });
      if (cell) {
        return cell.cell_type;
      }
    }

    return undefined;
  }
