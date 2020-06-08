import React from "react";
import { shallow } from "enzyme";
import { NotebookMetadataComponentProps, NotebookMetadataComponent } from "./NotebookMetadataComponent";
import { NotebookMetadata } from "../../../Contracts/DataModels";

describe("NotebookMetadataComponent", () => {
  it("renders un-liked notebook", () => {
    const props: NotebookMetadataComponentProps = {
      notebookName: "My notebook",
      container: undefined,
      notebookMetadata: undefined,
      notebookContent: {},
      onNotebookMetadataChange: (newNotebookMetadata: NotebookMetadata) => Promise.resolve(),
      isLikedNotebook: false
    };

    const wrapper = shallow(<NotebookMetadataComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders liked notebook", () => {
    const props: NotebookMetadataComponentProps = {
      notebookName: "My notebook",
      container: undefined,
      notebookMetadata: undefined,
      notebookContent: {},
      onNotebookMetadataChange: (newNotebookMetadata: NotebookMetadata) => Promise.resolve(),
      isLikedNotebook: true
    };

    const wrapper = shallow(<NotebookMetadataComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  // TODO Add test for metadata display
});
