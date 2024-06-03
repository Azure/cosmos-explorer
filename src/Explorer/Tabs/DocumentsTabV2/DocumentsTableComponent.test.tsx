import { TableRowId } from "@fluentui/react-components";
import { mount } from "enzyme";
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
    onItemClicked: (): void => { },
    onSelectedRowsChange: (): void => { },
    selectedRows: new Set<TableRowId>(),
    size: {
      height: 0,
      width: 0,
    },
    columnHeaders: {
      idHeader: ID_HEADER,
      partitionKeyHeaders: [PARTITION_KEY_HEADER],
    },
    isSelectionDisabled: false,
  });

  it("should render documents and partition keys in header", () => {
    const props: IDocumentsTableComponentProps = createMockProps();
    const wrapper = mount(<DocumentsTableComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should not render selection column when isSelectionDisabled is true", () => {
    const props: IDocumentsTableComponentProps = createMockProps();
    props.isSelectionDisabled = true;
    const wrapper = mount(<DocumentsTableComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
