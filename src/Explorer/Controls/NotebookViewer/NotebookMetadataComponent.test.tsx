import React from "react";
import { shallow } from "enzyme";
import { NotebookMetadataComponentProps, NotebookMetadataComponent } from "./NotebookMetadataComponent";

describe("NotebookMetadataComponent", () => {
  it("renders un-liked notebook", () => {
    const props: NotebookMetadataComponentProps = {
      notebookName: "My notebook",
      container: undefined,
      notebookMetadata: undefined,
      notebookContent: {},
      onNotebookMetadataChange: () => Promise.resolve(),
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
      onNotebookMetadataChange: () => Promise.resolve(),
      isLikedNotebook: true
    };

    const wrapper = shallow(<NotebookMetadataComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  // TODO Add test for metadata display
});
