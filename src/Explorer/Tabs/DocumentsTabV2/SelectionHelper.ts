/**
 * Utility class to help with selection.
 * This emulates File Explorer:
 * shift-ctrl: deselect index if selected, but do not select if not selected
 * ctrl: toggle selection of index
 * shift: select all rows between selectionStartIndex and index
 *
 * @param currentSelection current selection
 * @param clickedIndex index of clicked row
 * @param isShiftKey shift key is pressed
 * @param isCtrlKey ctrl key is pressed
 * @param selectionStartIndex index of current selected row
 * @returns new selection and selection start
 */
export const selectionHelper = (
  currentSelection: Set<number>,
  clickedIndex: number,
  isShiftKey: boolean,
  isCtrlKey: boolean,
  selectionStartIndex: number,
): {
  selection: Set<number>;
  selectionStartIndex: number;
} => {
  // Clear selection if no modifier keys are pressed
  document.getSelection().removeAllRanges();

  if ((!isShiftKey && !isCtrlKey) || selectionStartIndex === undefined) {
    return {
      selection: new Set<number>([clickedIndex]),
      selectionStartIndex: clickedIndex,
    };
  }

  if (isCtrlKey) {
    const isNotSelected = !currentSelection.has(clickedIndex);
    if (isNotSelected) {
      if (isShiftKey) {
        // Do nothing
        return {
          selection: currentSelection,
          selectionStartIndex: clickedIndex,
        };
      } else {
        return {
          selection: new Set(currentSelection.add(clickedIndex)),
          selectionStartIndex: clickedIndex,
        };
      }
    } else {
      // Remove
      currentSelection.delete(clickedIndex);
      return {
        selection: new Set(currentSelection),
        selectionStartIndex: clickedIndex,
      };
    }
  }

  // Shift, but no Ctrl
  // Enable everything between lastClickedIndex and clickedIndex and disable everything else
  const min = Math.min(clickedIndex, selectionStartIndex);
  const max = Math.max(clickedIndex, selectionStartIndex);
  const newSelection = new Set<number>();
  for (let i = min; i <= max; i++) {
    newSelection.add(i);
  }

  return {
    selection: newSelection,
    selectionStartIndex: undefined, // do not change selection start
  };
};
