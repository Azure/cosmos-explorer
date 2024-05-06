import { TableRowId } from "@fluentui/react-components";
import { ReactWrapper, mount } from "enzyme";
import React from "react";
import { DocumentsTableComponent, IDocumentsTableComponentProps } from "./DocumentsTableComponent.tsxx";

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

  let wrapper: ReactWrapper;
  describe("when rendered", () => {
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

  // describe("selection", () => {
  //   afterEach(() => {
  //     wrapper.unmount();
  //   });

  //   it("should clear selection when clicking on row", () => {
  //     const onSelectedRowsChange = jest.fn().mockName("onSelectedRowsChange");
  //     const onItemClicked = jest.fn().mockName("onItemClicked");

  //     const props: IDocumentsTableComponentProps = {
  //       ...createMockProps(),
  //       selectedRows: new Set<TableRowId>([1, 2]),
  //       onSelectedRowsChange,
  //       onItemClicked,
  //     };
  //     wrapper = mount(<DocumentsTableComponent {...props} />);
  //     const cell = wrapper.find(".fui-TableBody .fui-TableCell").findWhere((node) => node.text() === "2");
  //     // const cell = wrapper.find(".fui-TableBody .fui-TableCell").findWhere(node => node.text() === "2" && node.type() === "function");
  //     // const cell = wrapper.find("[title~=\"2\"]");
  //     cell.at(4).simulate("click");

  //     expect(onItemClicked).toHaveBeenCalledWith(2);
  //     expect(onSelectedRowsChange).toHaveBeenCalledWith(new Set<TableRowId>([2]));
  //   });
  // });
});
