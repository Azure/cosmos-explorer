import { useEffect, useRef } from "react";

/**
 * Utility class to help with selection.
 * This emulates File Explorer selection behavior.
 * ctrl: toggle selection of index.
 * shift: select all rows between selectionStartIndex and index
 * shift + ctrl: select or deselect all rows between selectionStartIndex and index depending on whether selectionStartIndex is selected
 * No modifier only selects the clicked row
 * ctrl: updates selection start index
 * shift: do not update selection start index
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
  if (isShiftKey) {
    // Shift is about selecting range of rows
    if (isCtrlKey) {
      // shift + ctrl
      const isSelectionStartIndexSelected = currentSelection.has(selectionStartIndex);
      const min = Math.min(clickedIndex, selectionStartIndex);
      const max = Math.max(clickedIndex, selectionStartIndex);

      const newSelection = new Set<number>(currentSelection);
      for (let i = min; i <= max; i++) {
        // Select or deselect range depending on how selectionStartIndex is selected
        if (isSelectionStartIndexSelected) {
          // Select range
          newSelection.add(i);
        } else {
          // Deselect range
          newSelection.delete(i);
        }
      }

      return {
        selection: newSelection,
        selectionStartIndex: undefined,
      };
    } else {
      // shift only
      // Shift only: enable everything between lastClickedIndex and clickedIndex and disable everything else
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
    }
  } else {
    if (isCtrlKey) {
      // Ctrl only: toggle selection where we clicked
      const isNotSelected = !currentSelection.has(clickedIndex);
      if (isNotSelected) {
        return {
          selection: new Set(currentSelection.add(clickedIndex)),
          selectionStartIndex: clickedIndex,
        };
      } else {
        // Remove
        currentSelection.delete(clickedIndex);
        return {
          selection: new Set(currentSelection),
          selectionStartIndex: clickedIndex,
        };
      }
    } else {
      // If no modifier keys are pressed, select only the clicked row
      return {
        selection: new Set<number>([clickedIndex]),
        selectionStartIndex: clickedIndex,
      };
    }
  }
};

// To get previous values of a state in useEffect
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
