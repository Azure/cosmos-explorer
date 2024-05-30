import { selectionHelper } from "Explorer/Tabs/DocumentsTabV2/SelectionHelper";

describe("Selection helper", () => {
  describe("when shift:off", () => {
    it("ctrl:off: should return clicked items and update selection start", () => {
      const currentSelection = new Set<number>([1, 2, 3]);
      const clickedIndex = 4;
      const isShiftKey = false;
      const isCtrlKey = false;
      const selectionStartIndex = 1;
      const result = selectionHelper(currentSelection, clickedIndex, isShiftKey, isCtrlKey, selectionStartIndex);
      expect(result.selection).toEqual(new Set<number>([4]));
      expect(result.selectionStartIndex).toEqual(4);
    });

    it("ctrl:on: should turn on selection and update selection start on not selected item", () => {
      const currentSelection = new Set<number>([1, 3]);
      const clickedIndex = 2;
      const isShiftKey = false;
      const isCtrlKey = true;
      const selectionStartIndex = 1;
      const result = selectionHelper(currentSelection, clickedIndex, isShiftKey, isCtrlKey, selectionStartIndex);
      expect(result.selection).toEqual(new Set<number>([1, 2, 3]));
      expect(result.selectionStartIndex).toEqual(2);
    });

    it("ctrl:on: should turn off selection and update selection start on selected item", () => {
      const currentSelection = new Set<number>([1, 2, 3]);
      const clickedIndex = 2;
      const isShiftKey = false;
      const isCtrlKey = true;
      const selectionStartIndex = 1;
      const result = selectionHelper(currentSelection, clickedIndex, isShiftKey, isCtrlKey, selectionStartIndex);
      expect(result.selection).toEqual(new Set<number>([1, 3]));
      expect(result.selectionStartIndex).toEqual(2);
    });
  });

  describe("when shift:on", () => {
    it("ctrl:off: should only select between selection start and clicked index (selection start < clicked index)", () => {
      const currentSelection = new Set<number>([7, 8, 10]);
      const clickedIndex = 9;
      const isShiftKey = true;
      const isCtrlKey = false;
      const selectionStartIndex = 5;
      const result = selectionHelper(currentSelection, clickedIndex, isShiftKey, isCtrlKey, selectionStartIndex);
      expect(result.selection).toEqual(new Set<number>([5, 6, 7, 8, 9]));
      expect(result.selectionStartIndex).toEqual(undefined);
    });

    it("ctrl:off: should only select between selection start and clicked index (selection start > clicked index)", () => {
      const currentSelection = new Set<number>([4, 6, 8]);
      const clickedIndex = 2;
      const isShiftKey = true;
      const isCtrlKey = false;
      const selectionStartIndex = 5;
      const result = selectionHelper(currentSelection, clickedIndex, isShiftKey, isCtrlKey, selectionStartIndex);
      expect(result.selection).toEqual(new Set<number>([2, 3, 4, 5]));
      expect(result.selectionStartIndex).toEqual(undefined);
    });

    it("ctrl:on: selection start on selected item should keep current selection and select range, and not update selection start", () => {
      const currentSelection = new Set<number>([1, 4, 5, 7]);
      const clickedIndex = 9;
      const isShiftKey = true;
      const isCtrlKey = true;
      const selectionStartIndex = 5;
      const result = selectionHelper(currentSelection, clickedIndex, isShiftKey, isCtrlKey, selectionStartIndex);
      expect(result.selection).toEqual(new Set<number>([1, 4, 5, 6, 7, 8, 9]));
      expect(result.selectionStartIndex).toEqual(undefined);
    });

    it("ctrl:on: selection start on deselected item should deselect range, and not update selection start", () => {
      const currentSelection = new Set<number>([1, 4, 6, 7, 10]);
      const clickedIndex = 9;
      const isShiftKey = true;
      const isCtrlKey = true;
      const selectionStartIndex = 5;
      const result = selectionHelper(currentSelection, clickedIndex, isShiftKey, isCtrlKey, selectionStartIndex);
      expect(result.selection).toEqual(new Set<number>([1, 4, 10]));
      expect(result.selectionStartIndex).toEqual(undefined);
    });
  });
});
