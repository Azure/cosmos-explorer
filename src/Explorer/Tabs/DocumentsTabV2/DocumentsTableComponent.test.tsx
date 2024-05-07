import { TableRowId } from "@fluentui/react-components";
import { DocumentExplorerState } from "Contracts/ViewModels";
import {
  ButtonsDependencies,
  getDeleteExistingDocumentButtonState,
  getDiscardExistingDocumentChangesButtonState,
  getDiscardNewDocumentChangesButtonState,
  getSaveExistingDocumentButtonState,
  getSaveNewDocumentButtonState,
  getTabsButtons,
} from "Explorer/Tabs/DocumentsTabV2/DocumentsTabV2";
import { ReactWrapper, mount } from "enzyme";
import React from "react";
import { DocumentsTableComponent, IDocumentsTableComponentProps } from "./DocumentsTableComponent";

const PARTITION_KEY_HEADER = "partitionKey";
const ID_HEADER = "id";

describe("DocumentsTableComponent", () => {
  const createMockProps = (): IDocumentsTableComponentProps => ({
    items: [
      { [ID_HEADER]: "1", [PARTITION_KEY_HEADER]: "pk1" },
      { [ID_HEADER]: "2", [PARTITION_KEY_HEADER]: "pk2" },
      { [ID_HEADER]: "3", [PARTITION_KEY_HEADER]: "pk3" },
    ],
    onItemClicked: (index: number): void => {
      index;
    },
    onSelectedRowsChange: (selectedItemsIndices: Set<TableRowId>): void => {
      selectedItemsIndices;
    },
    selectedRows: new Set<TableRowId>(),
    size: {
      height: 0,
      width: 0,
    },
    columnHeaders: {
      idHeader: ID_HEADER,
      partitionKeyHeaders: [PARTITION_KEY_HEADER],
    },
  });

  describe("when getting command bar button state", () => {
    describe("should set Save New Document state", () => {
      const testCases = new Set<{ state: DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.newDocumentValid, enabled: true, visible: true });
      testCases.add({ state: DocumentExplorerState.newDocumentInvalid, enabled: false, visible: true });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentNoEdits, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyValid, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyInvalid, enabled: false, visible: false });

      testCases.forEach((testCase) => {
        const state = getSaveNewDocumentButtonState(testCase.state);
        it(`enable for ${testCase.state}`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state}`, () => {
          expect(state.visible).toBe(testCase.visible);
        });
      });
    });

    describe("should set Discard New Document state", () => {
      const testCases = new Set<{ state: DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.newDocumentValid, enabled: true, visible: true });
      testCases.add({ state: DocumentExplorerState.newDocumentInvalid, enabled: true, visible: true });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentNoEdits, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyValid, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyInvalid, enabled: false, visible: false });

      testCases.forEach((testCase) => {
        const state = getDiscardNewDocumentChangesButtonState(testCase.state);
        it(`enable for ${testCase.state}`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state}`, () => {
          expect(state.visible).toBe(testCase.visible);
        });
      });
    });

    describe("should set Save Existing Document state", () => {
      const testCases = new Set<{ state: DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.newDocumentValid, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.newDocumentInvalid, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentNoEdits, enabled: false, visible: true });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyValid, enabled: true, visible: true });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyInvalid, enabled: false, visible: true });

      testCases.forEach((testCase) => {
        const state = getSaveExistingDocumentButtonState(testCase.state);
        it(`enable for ${testCase.state}`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state}`, () => {
          expect(state.visible).toBe(testCase.visible);
        });
      });
    });

    describe("should set Discard Existing Document state", () => {
      const testCases = new Set<{ state: DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.newDocumentValid, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.newDocumentInvalid, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentNoEdits, enabled: false, visible: true });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyValid, enabled: true, visible: true });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyInvalid, enabled: true, visible: true });

      testCases.forEach((testCase) => {
        const state = getDiscardExistingDocumentChangesButtonState(testCase.state);
        it(`enable for ${testCase.state}`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state}`, () => {
          expect(state.visible).toBe(testCase.visible);
        });
      });
    });

    describe("should set Delete Existing Document state", () => {
      const testCases = new Set<{ state: DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.newDocumentValid, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.newDocumentInvalid, enabled: false, visible: false });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentNoEdits, enabled: true, visible: true });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyValid, enabled: true, visible: true });
      testCases.add({ state: DocumentExplorerState.exisitingDocumentDirtyInvalid, enabled: true, visible: true });

      testCases.forEach((testCase) => {
        const state = getDeleteExistingDocumentButtonState(testCase.state, new Set<TableRowId>());
        it(`enable for ${testCase.state} (no selected rows)`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state} (no selected rows)`, () => {
          expect(state.visible).toBe(false);
        });

        // state = getDeleteExistingDocumentButtonState(testCase.state, new Set<TableRowId>([2, 1]));
        // it(`enable for ${testCase.state} (2 selected rows)`, () => {
        //   expect(state.enabled).toBe(testCase.enabled);
        // });
        // it(`visible for ${testCase.state} (2 selected rows)`, () => {
        //   expect(state.visible).toBe(testCase.visible);
        // });
      });
    });
  });

  describe("Do not get tabs button for Fabric readonly", () => {
    const buttons = getTabsButtons({} as ButtonsDependencies);
  });

  describe("when rendered", () => {
    let wrapper: ReactWrapper;
    beforeEach(() => {
      const props: IDocumentsTableComponentProps = createMockProps();
      wrapper = mount(<DocumentsTableComponent {...props} />);
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it("should show id and partition key(s) in header", () => {
      expect(
        wrapper
          .find(".fui-TableHeader")
          .findWhere((node) => node.text() === ID_HEADER)
          .exists(),
      ).toBeTruthy();
      expect(
        wrapper
          .find(".fui-TableHeader")
          .findWhere((node) => node.text() === PARTITION_KEY_HEADER)
          .exists(),
      ).toBeTruthy();
    });

    it("should show documents", () => {
      const rows = wrapper.find(".fui-TableBody .fui-TableRow");
      expect(rows.length).toBe(3);
      expect(
        rows
          .at(1)
          .findWhere((node) => node.text() === "2")
          .exists(),
      ).toBeTruthy();
      expect(
        rows
          .at(1)
          .findWhere((node) => node.text() === "pk2")
          .exists(),
      ).toBeTruthy();
    });
  });
});
