import { TableRowId } from "@fluentui/react-components";
import { mount } from "enzyme";
import React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
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
    onItemClicked: (): void => {},
    onSelectedRowsChange: (): void => {},
    selectedRows: new Set<TableRowId>(),
    size: {
      height: 0,
      width: 0,
    },
    columnDefinitions: [
      { id: ID_HEADER, label: "ID", isPartitionKey: false },
      { id: PARTITION_KEY_HEADER, label: "Partition Key", isPartitionKey: true },
    ],
    isRowSelectionDisabled: false,
    collection: {
      databaseId: "db",
      id: ((): string => "coll") as ko.Observable<string>,
    } as ViewModels.CollectionBase,
    onRefreshTable: (): void => {
      throw new Error("Function not implemented.");
    },
    selectedColumnIds: [],
  });

  it("should render documents and partition keys in header", () => {
    const props: IDocumentsTableComponentProps = createMockProps();
    const wrapper = mount(<DocumentsTableComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should not render selection column when isSelectionDisabled is true", () => {
    const props: IDocumentsTableComponentProps = createMockProps();
    props.isRowSelectionDisabled = true;
    const wrapper = mount(<DocumentsTableComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
